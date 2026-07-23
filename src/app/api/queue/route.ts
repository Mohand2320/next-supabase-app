import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';
import { addToQueueSchema } from '@/lib/validations/queue';

export async function GET(req: NextRequest) {
  const guard = await requireRoles(['admin', 'dentiste', 'assistant']);
  if (!guard.isAuthorized) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  try {
    const supabase = await createClientServer();
    
    // On veut la file d'attente du jour, ordonnée par position
    const { data, error } = await supabase
      .from('file_attente')
      .select(`
        *,
        patient:patients(id, nom, prenom, telephone),
        rendez_vous:rendez_vous(id, motif, heure:date_heure)
      `)
      .eq('date_jour', new Date().toISOString().split('T')[0])
      .order('position', { ascending: true });

    if (error) {
      console.error('[GET /api/queue] Supabase error:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération de la file d\'attente' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[GET /api/queue] Erreur:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRoles(['admin', 'dentiste', 'assistant']);
  if (!guard.isAuthorized) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = addToQueueSchema.parse(body);
    
    const supabase = await createClientServer();
    
    // Vérifier s'il est déjà dans la file (actif)
    if (validatedData.patient_id) {
      const { data: existing } = await supabase
        .from('file_attente')
        .select('id, statut')
        .eq('date_jour', new Date().toISOString().split('T')[0])
        .eq('patient_id', validatedData.patient_id)
        .in('statut', ['EN_ATTENTE', 'APPELE', 'EN_CONSULTATION'])
        .single();
        
      if (existing) {
        return NextResponse.json({ error: 'Ce patient est déjà dans la file d\'attente (actif)' }, { status: 400 });
      }
    }

    // Utilisation de rpc pour appeler la fonction add_to_queue sécurisée
    const { data, error } = await supabase
      .rpc('add_to_queue', {
        p_patient_id: validatedData.patient_id || null,
        p_rdv_id: validatedData.rdv_id || null,
        p_dentiste_id: validatedData.dentiste_id || null,
        p_nom_minimal: validatedData.nom_minimal || null,
        p_prenom_minimal: validatedData.prenom_minimal || null,
        p_telephone_minimal: validatedData.telephone_minimal || null,
        p_motif: validatedData.motif || null,
        p_observations: validatedData.observations || null,
        p_cree_par: guard.user.id
      });

    if (error) {
      console.error('[POST /api/queue] Supabase error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'ajout à la file d\'attente' }, { status: 500 });
    }

    return NextResponse.json(data[0] || data);
  } catch (err: any) {
    console.error('[POST /api/queue] Erreur:', err);
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
