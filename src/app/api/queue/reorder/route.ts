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

    // Appel de la fonction RPC atomique créée dans la migration SQL
    // Cela évite les erreurs de contrainte d'unicité (date_jour, position)
    // et garantit un réordonnancement sans collision.
    const { error } = await supabase.rpc('reorder_queue', {
      p_items: validatedData.items
    });

    if (error) {
      console.error('[PATCH /api/queue/reorder] RPC error:', error);
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
