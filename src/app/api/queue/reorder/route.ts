import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';
import { reorderQueueSchema } from '@/lib/validations/queue';

export async function PATCH(req: NextRequest) {
  const guard = await requireRoles(['admin', 'dentiste', 'assistant']);
  if (!guard.isAuthorized) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = reorderQueueSchema.parse(body);
    
    const supabase = await createClientServer();

    // Mise à jour individuelle de chaque position.
    // On utilise update() et non upsert() car les lignes existent déjà :
    // update() ne touche que la colonne explicitement passée (position),
    // et préserve toutes les autres (patient_id, nom_minimal, …) — pas de
    // risque de violation de la contrainte chk_file_attente_patient.
    // Promise.all les exécute en parallèle ; en cas d'échec partiel le bloc
    // catch en bas recharge la file côté frontend.
    const results = await Promise.all(
      validatedData.items.map(item =>
        supabase
          .from('file_attente')
          .update({ position: item.position })
          .eq('id', item.id)
      )
    );

    const error = results.find(r => r.error)?.error;
    if (error) {
      console.error('[PATCH /api/queue/reorder] Update error:', error);
      return NextResponse.json({ error: 'Erreur lors de la réorganisation de la file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/queue/reorder] Erreur:', err);
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
