import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';
import { rdvConvertPatientSchema } from '@/lib/validations/rdv';

// ============================================================
// POST /api/queue/[id]/convert-patient
// Convertit une entrée walk-in (sans patient_id) en dossier patient.
// Lie aussi le patient au RDV rattaché si rdv_id est présent.
// ============================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRoles(['admin', 'dentiste', 'assistant']);
  if (!guard.isAuthorized) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const supabase = await createClientServer();

    // Récupérer l'entrée file_attente
    const { data: entry, error: fetchError } = await supabase
      .from('file_attente')
      .select('*, rendez_vous!file_attente_rdv_id_fkey(*)')
      .eq('id', id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });
    }

    // Vérifier qu'elle n'a pas déjà un patient
    if (entry.patient_id) {
      return NextResponse.json(
        { error: 'Cette entrée a déjà un dossier patient rattaché' },
        { status: 422 }
      );
    }

    const body = await _request.json();
    const validation = rdvConvertPatientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
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

      // Vérifier qu'il n'a pas déjà une entrée active aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { data: conflict } = await supabase
        .from('file_attente')
        .select('id, statut')
        .eq('date_jour', today)
        .eq('patient_id', patient_id!)
        .in('statut', ['EN_ATTENTE', 'APPELE', 'EN_CONSULTATION'])
        .neq('id', id)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { error: `Ce patient est déjà dans la file d'attente avec le statut "${conflict.statut}". Terminez ou retirez l'autre entrée avant de le lier ici.` },
          { status: 409 }
        );
      }

      finalPatientId = existingPatient.id;
    } else {
      // Créer un nouveau patient
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          nom: patient_data!.nom,
          prenom: patient_data!.prenom,
          telephone: patient_data!.telephone ?? entry.telephone_minimal,
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

    // Mettre à jour file_attente.patient_id
    const { error: updateQueueError } = await supabase
      .from('file_attente')
      .update({ patient_id: finalPatientId })
      .eq('id', id);

    if (updateQueueError) {
      console.error('[API_ERROR] update file_attente:', updateQueueError);
      return NextResponse.json(
        { error: 'Erreur lors de la liaison à la file d\'attente' },
        { status: 500 }
      );
    }

    // Si l'entrée a un rdv_id : lier aussi le RDV (RDV orphelin)
    if (entry.rdv_id) {
      const rdv = entry.rendez_vous;

      const { error: updateRdvError } = await supabase
        .from('rendez_vous')
        .update({
          patient_id: finalPatientId,
          modifie_par: guard.user.id,
        })
        .eq('id', entry.rdv_id);

      if (updateRdvError) {
        console.error('[API_ERROR] update rdv patient_id:', updateRdvError);
      }

      // Si le RDV est TERMINE, créer la séance
      if (rdv && rdv.statut === 'TERMINE') {
        const { data: seanceId } = await supabase
          .rpc('convertir_rdv_en_seance_post_conversion', {
            p_rdv_id: entry.rdv_id,
            p_patient_id: finalPatientId,
          })
          .single();

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
              .eq('id', entry.rdv_id);
          }
        }
      }
    }

    // Recharger l'entrée mise à jour
    const { data: updated } = await supabase
      .from('file_attente')
      .select(`
        *,
        patient:patients(id, nom, prenom, telephone),
        rendez_vous:rendez_vous(id, motif, heure:date_heure)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      entry: updated,
      patient_id: finalPatientId,
      action_effectuee: action,
    });
  } catch (err: any) {
    console.error('[POST /api/queue/[id]/convert-patient] Erreur:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
