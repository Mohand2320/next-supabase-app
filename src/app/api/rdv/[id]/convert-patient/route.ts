import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { rdvConvertPatientSchema } from '@/lib/validations/rdv';
import { rdvDbToApi } from '@/lib/mappers/rdv';

// ============================================================
// POST /api/rdv/[id]/convert-patient
// Convertit un RDV_MINIMAL en rattachant un patient (existant ou nouveau)
// ============================================================
export async function POST(
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

    // Récupérer le RDV
    const { data: rdv, error: fetchError } = await supabase
      .from('rendez_vous')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rdv) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 });
    }

    // Vérifier que c'est bien un RDV_MINIMAL
    if (rdv.patient_id) {
      return NextResponse.json(
        { error: 'Ce RDV a déjà un patient rattaché' },
        { status: 422 }
      );
    }

    const body = await request.json();
    const validation = rdvConvertPatientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, patient_id, patient_data } = validation.data;
    let finalPatientId: string;

    if (action === 'link_existing') {
      // Vérifier que le patient existe
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patient_id!)
        .single();

      if (!existingPatient) {
        return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });
      }

      finalPatientId = existingPatient.id;
    } else {
      // Créer un nouveau patient
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          nom: patient_data!.nom,
          prenom: patient_data!.prenom,
          telephone: patient_data!.telephone ?? rdv.telephone_minimal,
          date_naissance: patient_data!.date_naissance ?? '2000-01-01',
          sexe: patient_data!.sexe ?? 'M',
        }])
        .select()
        .single();

      if (createError) {
        console.error('[API_ERROR] create patient:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création du patient', details: createError.message },
          { status: 500 }
        );
      }

      // Créer le profil médical vide
      await supabase
        .from('profils_medicaux')
        .insert([{ patient_id: newPatient.id }]);

      finalPatientId = newPatient.id;
    }

    // Rattacher le patient au RDV
    const { error: updateError } = await supabase
      .from('rendez_vous')
      .update({
        patient_id: finalPatientId,
        modifie_par: user.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[API_ERROR] update rdv patient_id:', updateError);
      return NextResponse.json({ error: 'Erreur lors du rattachement' }, { status: 500 });
    }

    // Si le RDV est TERMINE et a maintenant un patient, créer la séance
    if (rdv.statut === 'TERMINE') {
      const { data: seanceId } = await supabase
        .rpc('convertir_rdv_en_seance_post_conversion', {
          p_rdv_id: id,
          p_patient_id: finalPatientId,
        })
        .single();

      // Fallback : créer manuellement si la function n'existe pas
      if (!seanceId) {
        const { data: seance } = await supabase
          .from('seances')
          .insert([{
            patient_id: finalPatientId,
            dentiste_id: rdv.dentiste_id,
            date_heure: rdv.date_heure,
            type_denture: 'ADULTE',
          }])
          .select('id')
          .single();

        if (seance) {
          await supabase
            .from('rendez_vous')
            .update({ seance_id: seance.id })
            .eq('id', id);
        }
      }
    }

    // Recharger le RDV avec jointures
    const { data: updated } = await supabase
      .from('rendez_vous')
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .eq('id', id)
      .single();

    return NextResponse.json({
      rdv: rdvDbToApi(updated),
      patient_id: finalPatientId,
      action_effectuee: action,
    });
  } catch (error) {
    console.error('[API_ERROR] POST /api/rdv/[id]/convert-patient:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
