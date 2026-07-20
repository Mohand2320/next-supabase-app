import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { requireRoles } from '@/lib/auth/guards';
import { rdvDbToApi, rdvApiToDb } from '@/lib/mappers/rdv';
import { rdvCreateSchema, rdvCalendarQuerySchema } from '@/lib/validations/rdv';

// ============================================================
// GET /api/rdv — Liste des RDV (filtres par plage de dates)
// ============================================================
export async function GET(request: Request) {
  try {
    const supabase = await createClientServer();
    const { isAuthorized, error: authError } = await requireRoles(['admin', 'dentiste', 'assistant']);
    if (!isAuthorized) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '200', 10) || 200));
    const offset = (page - 1) * limit;

    const searchParam = url.searchParams.get('search') ?? '';
    const params = {
      date_debut: url.searchParams.get('date_debut') ?? '',
      date_fin: url.searchParams.get('date_fin') ?? '',
      dentiste_id: url.searchParams.get('dentiste_id') ?? undefined,
      statut: url.searchParams.get('statut') ?? undefined,
      search: searchParam,
      sort: (url.searchParams.get('sort') as 'date_asc' | 'date_desc') ?? 'date_asc',
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
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)', { count: 'exact' })
      .gte('date_heure', query.date_debut)
      .lte('date_heure', query.date_fin)
      .order('date_heure', { ascending: query.sort === 'date_asc' });

    if (query.dentiste_id) {
      builder = builder.eq('dentiste_id', query.dentiste_id);
    }

    if (query.statut) {
      const statuts = query.statut.split(',').map(s => s.trim());
      builder = builder.in('statut', statuts);
    }

    if (query.search) {
      const search = `%${query.search}%`;
      const { data: matchingPatients } = await supabase
        .from('patients')
        .select('id')
        .or(`nom.ilike.${search},prenom.ilike.${search}`);
      const patientIds = (matchingPatients || []).map((p: any) => p.id);

      const searchConditions: string[] = [];
      searchConditions.push(`nom_minimal.ilike.${search}`);
      searchConditions.push(`prenom_minimal.ilike.${search}`);
      if (patientIds.length > 0) {
        searchConditions.push(`patient_id.in.(${patientIds.join(',')})`);
      }
      builder = builder.or(searchConditions.join(','));
    }

    const { data, count, error } = await builder.range(offset, offset + limit - 1);

    if (error) {
      console.error('[API_ERROR] GET /api/rdv:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map(rdvDbToApi),
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
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
    const { isAuthorized, user, error: authError } = await requireRoles(['admin', 'dentiste', 'assistant']);
    if (!isAuthorized || !user) {
      return NextResponse.json({ error: authError }, { status: 403 });
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