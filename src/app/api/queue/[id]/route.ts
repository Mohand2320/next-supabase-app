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

    // 1. Statut → ANNULE, position éloignée pour éviter les conflits
    const { error: updateError } = await supabase
      .from('file_attente')
      .update({ statut: 'ANNULE', position: 9999 })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Recalculer les positions des entrées actives restantes
    const dateJour = new Date().toISOString().split('T')[0];
    const { data: actives, error: fetchError } = await supabase
      .from('file_attente')
      .select('id')
      .eq('date_jour', dateJour)
      .in('statut', ['EN_ATTENTE', 'APPELE', 'EN_CONSULTATION'])
      .order('position');

    if (fetchError) throw fetchError;

    if (actives && actives.length > 0) {
      const results = await Promise.all(
        actives.map((entry, i) =>
          supabase
            .from('file_attente')
            .update({ position: i + 1 })
            .eq('id', entry.id)
        )
      );

      const err = results.find(r => r.error)?.error;
      if (err) throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/queue/[id]] Erreur:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
