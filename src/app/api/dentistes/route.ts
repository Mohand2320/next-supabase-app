import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';

export async function GET() {
  try {
    const supabase = await createClientServer();
    const { isAuthorized, error: authError } = await requireRoles(['admin', 'dentiste', 'assistant']);
    if (!isAuthorized) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('dentistes')
      .select('id, nom, prenom, specialite')
      .order('nom');

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des dentistes' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
