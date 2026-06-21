import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { rdvDbToApi, rdvApiToDb } from '@/lib/mappers/rdv';
import { rdvCreateSchema, rdvCalendarQuerySchema } from '@/lib/validations/rdv';

// ============================================================
// GET /api/rdv — Liste des RDV (filtrés par plage de dates)
// ============================================================
export async function GET(request: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = {
      date_debut: url.searchParams.get('date_debut') ?? '',
      date_fin: url.searchParams.get('date_fin') ?? '',
      dentiste_id: url.searchParams.get('dentiste_id') ?? undefined,
      statut: url.searchParams.get('statut') ?? undefined,
    };

    const validation = rdvCalendarQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validation.error.format() },
        { status: 400 }
      );
    }

    const query = validation.data;

    let builder = supabase
      .from('rendez_vous')
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .gte('date_heure', query.date_debut)
      .lte('date_heure', query.date_fin)
      .order('date_heure', { ascending: true });

    if (query.dentiste_id) {
      builder = builder.eq('dentiste_id', query.dentiste_id);
    }

    if (query.statut) {
      const statuts = query.statut.split(',').map(s => s.trim());
      builder = builder.in('statut', statuts);
    }

    const { data, error } = await builder;

    if (error) {
      console.error('[API_ERROR] GET /api/rdv:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map(rdvDbToApi),
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/rdv:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================================
// POST /api/rdv — Création d'un RDV
// Statut initial toujours PLANIFIE
// ============================================================
export async function POST(request: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = rdvCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dbPayload = rdvApiToDb(validation.data);
    // Statut initial toujours PLANIFIE (règle métier non négociable)
    dbPayload.statut = 'PLANIFIE';
    dbPayload.cree_par = user.id;
    dbPayload.modifie_par = user.id;

    const { data, error } = await supabase
      .from('rendez_vous')
      .insert([dbPayload])
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .single();

    if (error) {
      console.error('[API_ERROR] POST /api/rdv:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du RDV', details: error.message },
        { status: error.code === '42501' ? 403 : 500 }
      );
    }

    return NextResponse.json(rdvDbToApi(data), { status: 201 });
  } catch (error) {
    console.error('[API_ERROR] POST /api/rdv:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
