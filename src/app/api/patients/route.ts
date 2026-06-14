import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { apiToDb, dbToApi, profileApiToDb } from '@/lib/mappers/patient';
import { patientListQuerySchema, patientSchema } from '@/lib/validations/patient';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getWeekRange(referenceDate: Date) {
  const result = startOfDay(referenceDate);
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  const end = new Date(result);
  end.setDate(result.getDate() + 7);
  return { start: result, end };
}

function getMonthRange(referenceDate: Date) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  return { start, end };
}

function normalizeGender(value: string | null) {
  if (value === 'male' || value === 'M') return 'male';
  if (value === 'female' || value === 'F') return 'female';
  return 'all';
}

function normalizeSort(sort: string | null, sortBy: string | null, sortOrder: string | null) {
  if (sort === 'name_asc' || sort === 'name_desc' || sort === 'newest' || sort === 'oldest') {
    return sort;
  }

  if (sortBy === 'last_name') return sortOrder === 'desc' ? 'name_desc' : 'name_asc';
  if (sortBy === 'created_at') return sortOrder === 'asc' ? 'oldest' : 'newest';

  return 'newest';
}

function normalizeCreationPreset(value: string | null) {
  if (value === 'today' || value === 'week' || value === 'month' || value === 'custom') {
    return value;
  }
  return 'all';
}

export async function GET(request: Request) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const normalized = {
      search: url.searchParams.get('search') ?? '',
      gender: normalizeGender(url.searchParams.get('gender')),
      createdPreset: normalizeCreationPreset(url.searchParams.get('createdPreset')),
      createdFrom: url.searchParams.get('createdFrom') ?? '',
      createdTo: url.searchParams.get('createdTo') ?? '',
      birthFrom: url.searchParams.get('birthFrom') ?? '',
      birthTo: url.searchParams.get('birthTo') ?? '',
      sort: normalizeSort(url.searchParams.get('sort'), url.searchParams.get('sortBy'), url.searchParams.get('sortOrder')),
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
    };

    const validation = patientListQuerySchema.safeParse(normalized);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const query = validation.data;
    let builder = supabase.from('patients').select('*', { count: 'exact' });

    if (query.search) {
      const search = `%${query.search}%`;
      builder = builder.or(
        `nom.ilike.${search},prenom.ilike.${search},telephone.ilike.${search},email.ilike.${search}`
      );
    }

    if (query.gender === 'male') {
      builder = builder.eq('sexe', 'M');
    } else if (query.gender === 'female') {
      builder = builder.eq('sexe', 'F');
    }

    const today = new Date();
    if (query.createdPreset === 'today') {
      builder = builder.gte('created_at', startOfDay(today).toISOString()).lte('created_at', endOfDay(today).toISOString());
    } else if (query.createdPreset === 'week') {
      const { start, end } = getWeekRange(today);
      builder = builder.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
    } else if (query.createdPreset === 'month') {
      const { start, end } = getMonthRange(today);
      builder = builder.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
    }

    if (query.createdPreset === 'custom') {
      if (query.createdFrom) {
        builder = builder.gte('created_at', startOfDay(new Date(`${query.createdFrom}T00:00:00`)).toISOString());
      }
      if (query.createdTo) {
        builder = builder.lte('created_at', endOfDay(new Date(`${query.createdTo}T00:00:00`)).toISOString());
      }
    }

    if (query.birthFrom) {
      builder = builder.gte('date_naissance', query.birthFrom);
    }
    if (query.birthTo) {
      builder = builder.lte('date_naissance', query.birthTo);
    }

    if (query.sort === 'name_asc') {
      builder = builder.order('nom', { ascending: true }).order('prenom', { ascending: true });
    } else if (query.sort === 'name_desc') {
      builder = builder.order('nom', { ascending: false }).order('prenom', { ascending: false });
    } else if (query.sort === 'oldest') {
      builder = builder.order('created_at', { ascending: true });
    } else {
      builder = builder.order('created_at', { ascending: false });
    }

    const offset = (query.page - 1) * query.limit;
    const { data, count, error } = await builder.range(offset, offset + query.limit - 1);

    if (error) {
      console.error('[API_ERROR] GET /api/patients:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map(dbToApi),
      meta: {
        total: count || 0,
        page: query.page,
        limit: query.limit,
        totalPages: count ? Math.ceil(count / query.limit) : 0,
      },
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = patientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dbPayload = apiToDb(validation.data);

    const { data: patientData, error: insertError } = await supabase
      .from('patients')
      .insert([{ ...dbPayload }])
      .select()
      .single();

    if (insertError) {
      console.error('[API_ERROR] POST /api/patients:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du patient', details: insertError.message },
        { status: insertError.code === '42501' ? 403 : 500 }
      );
    }

    const profilePayload = profileApiToDb(validation.data);
    if (Object.keys(profilePayload).length > 0) {
      const { error: profileErr } = await supabase
        .from('profils_medicaux')
        .upsert([{ patient_id: patientData.id, ...profilePayload }], { onConflict: 'patient_id' });

      if (profileErr) {
        console.warn('Could not insert profile:', profileErr.message || profileErr);
      }
    }

    return NextResponse.json(dbToApi(patientData), { status: 201 });
  } catch (error) {
    console.error('[API_ERROR] POST /api/patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
