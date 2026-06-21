import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
