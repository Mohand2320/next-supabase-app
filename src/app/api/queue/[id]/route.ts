import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';

export async function DELETE(
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

    const { data: entry, error: findError } = await supabase
      .from('file_attente')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !entry) {
      return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 });
    }

    // Appel atomique via RPC — verrou advisory + UPDATE unique en une transaction
    const { error: rpcError } = await supabase.rpc('remove_from_queue', {
      p_id: id,
    });

    if (rpcError) {
      console.error('[DELETE /api/queue/[id]] RPC error:', rpcError);
      return NextResponse.json({ error: 'Erreur lors de la suppression de la file d\'attente' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/queue/[id]] Erreur:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
