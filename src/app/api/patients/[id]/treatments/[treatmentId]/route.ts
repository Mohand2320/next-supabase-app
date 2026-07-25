import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; treatmentId: string }> }
) {
  try {
    const { id, treatmentId } = await params;
    const supabase = await createClientServer();

    const { isAuthorized, error: authError } = await requireRoles(['admin', 'dentiste']);
    if (!isAuthorized) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('seances')
      .select('id')
      .eq('id', treatmentId)
      .eq('patient_id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 });
    }

    const { data: deletedData, error: deleteError } = await supabase
      .from('seances')
      .delete()
      .eq('id', treatmentId)
      .select();

    if (deleteError) throw deleteError;

    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à supprimer cette séance' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API_ERROR] DELETE /api/patients/[id]/treatments/[treatmentId]:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la séance' }, { status: 500 });
  }
}