import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { rdvDbToApi } from '@/lib/mappers/rdv';
import { rdvStatusTransitionSchema } from '@/lib/validations/rdv';

// ============================================================
// PATCH /api/rdv/[id]/status — Transition de statut
// Machine à états : PLANIFIE→CONFIRME, PLANIFIE→ANNULE,
//                   PLANIFIE→TERMINE, CONFIRME→ANNULE, CONFIRME→TERMINE
// ============================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le RDV actuel
    const { data: existing, error: fetchError } = await supabase
      .from('rendez_vous')
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 });
    }

    const body = await request.json();

    // Valider la transition (inclut vérification machine à états + origine_annulation)
    const validation = rdvStatusTransitionSchema.safeParse({
      statut_actuel: existing.statut,
      nouveau_statut: body.nouveau_statut,
      origine_annulation: body.origine_annulation ?? null,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Transition invalide', details: validation.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { nouveau_statut, origine_annulation } = validation.data;

    // --- Transition vers TERMINE ---
    if (nouveau_statut === 'TERMINE') {
      return await handleTerminer(supabase, id, existing, user.id);
    }

    // --- Transition vers ANNULE ---
    if (nouveau_statut === 'ANNULE') {
      const updatePayload: Record<string, any> = {
        statut: 'ANNULE',
        origine_annulation: origine_annulation,
        modifie_par: user.id,
      };

      const { data: updated, error: updateError } = await supabase
        .from('rendez_vous')
        .update(updatePayload)
        .eq('id', id)
        .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
        .single();

      if (updateError) {
        console.error('[API_ERROR] PATCH /api/rdv/[id]/status ANNULE:', updateError);
        return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
      }

      return NextResponse.json({ rdv: rdvDbToApi(updated) });
    }

    // --- Transition vers CONFIRME ---
    if (nouveau_statut === 'CONFIRME') {
      const { data: updated, error: updateError } = await supabase
        .from('rendez_vous')
        .update({ statut: 'CONFIRME', modifie_par: user.id })
        .eq('id', id)
        .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
        .single();

      if (updateError) {
        console.error('[API_ERROR] PATCH /api/rdv/[id]/status CONFIRME:', updateError);
        return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
      }

      return NextResponse.json({ rdv: rdvDbToApi(updated) });
    }

    return NextResponse.json({ error: 'Transition non gérée' }, { status: 422 });
  } catch (error) {
    console.error('[API_ERROR] PATCH /api/rdv/[id]/status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================================
// Gestion de la transition vers TERMINE
// - Crée la séance (si patient_id non null) via convertir_rdv_en_seance
// - Si RDV_MINIMAL, propose la conversion patient
// ============================================================
async function handleTerminer(
  supabase: any,
  rdvId: string,
  existing: any,
  userId: string,
) {
  const isMinimal = !existing.patient_id;

  if (!isMinimal) {
    // RDV_STANDARD : utiliser la fonction SQL pour créer la séance
    const { data: seanceId, error: rpcError } = await supabase
      .rpc('convertir_rdv_en_seance', { p_rdv_id: rdvId });

    if (rpcError) {
      console.error('[API_ERROR] convertir_rdv_en_seance:', rpcError);
      return NextResponse.json(
        { error: 'Erreur lors de la clôture du RDV', details: rpcError.message },
        { status: 500 }
      );
    }

    // Update modifie_par
    await supabase
      .from('rendez_vous')
      .update({ modifie_par: userId })
      .eq('id', rdvId);

    // Recharger le RDV mis à jour
    const { data: updated } = await supabase
      .from('rendez_vous')
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .eq('id', rdvId)
      .single();

    return NextResponse.json({
      rdv: rdvDbToApi(updated),
      seance_id: seanceId,
      conversion_proposee: false,
    });
  }

  // RDV_MINIMAL : marquer TERMINE + proposer conversion patient
  const { error: updateError } = await supabase
    .from('rendez_vous')
    .update({ statut: 'TERMINE', modifie_par: userId })
    .eq('id', rdvId);

  if (updateError) {
    console.error('[API_ERROR] TERMINE RDV_MINIMAL:', updateError);
    return NextResponse.json({ error: 'Erreur lors de la clôture' }, { status: 500 });
  }

  // Recherche anti-doublon : candidats par nom + téléphone
  const candidats = await searchPatientCandidates(
    supabase,
    existing.nom_minimal,
    existing.prenom_minimal,
    existing.telephone_minimal
  );

  // Recharger le RDV
  const { data: updated } = await supabase
    .from('rendez_vous')
    .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
    .eq('id', rdvId)
    .single();

  return NextResponse.json({
    rdv: rdvDbToApi(updated),
    seance_id: null,
    conversion_proposee: true,
    candidats_patients: candidats,
  });
}

/**
 * Recherche des patients candidats pour la conversion anti-doublon.
 */
async function searchPatientCandidates(
  supabase: any,
  nom: string | null,
  prenom: string | null,
  telephone: string | null,
) {
  if (!nom && !telephone) return [];

  let builder = supabase
    .from('patients')
    .select('id, nom, prenom, telephone')
    .limit(10);

  // Recherche par nom OU téléphone
  const orConditions: string[] = [];
  if (nom) orConditions.push(`nom.ilike.%${nom}%`);
  if (prenom) orConditions.push(`prenom.ilike.%${prenom}%`);
  if (telephone) orConditions.push(`telephone.ilike.%${telephone}%`);

  if (orConditions.length > 0) {
    builder = builder.or(orConditions.join(','));
  }

  const { data } = await builder;
  return data || [];
}
