import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';
import { updateQueueStatusSchema } from '@/lib/validations/queue';

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const validatedData = updateQueueStatusSchema.parse(body);
    
    const supabase = await createClientServer();
    
    const { data, error } = await supabase
      .from('file_attente')
      .update({ statut: validatedData.statut })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/queue/[id]/status] Supabase error:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du statut' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[PATCH /api/queue/[id]/status] Erreur:', err);
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
