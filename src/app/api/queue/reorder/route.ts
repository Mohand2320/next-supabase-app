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
    
    // Bulk update positions. Supabase client doesn't support bulk update easily without rpc
    // Since the queue is small (per day), we can use Promise.all safely.
    const updates = validatedData.items.map(item => 
      supabase
        .from('file_attente')
        .update({ position: item.position })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    
    const error = results.find(r => r.error)?.error;
    if (error) {
      console.error('[PATCH /api/queue/reorder] Supabase error on one or more updates:', error);
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
