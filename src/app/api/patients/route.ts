import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { patientSchema, queryParamsSchema } from '@/lib/validations/patient';
import { apiToDb, dbToApi, profileApiToDb } from '@/lib/mappers/patient';

/**
 * Secure GET Handler for Patients
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate Request
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate Query Parameters
    const { searchParams } = new URL(request.url);
    const paramsMap = Object.fromEntries(searchParams.entries());
    const validation = queryParamsSchema.safeParse(paramsMap);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.format() }, { status: 400 });
    }

    const { search, gender, sortBy, sortOrder, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    // 3. Query Database (map API fields to DB columns)
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Text search (map API search fields to DB columns)
    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,telephone.ilike.%${search}%`);
    }

    if (gender) {
      // API uses 'M'|'F'|'Other' - DB stores 'M'|'F'
      const dbGender = gender === 'M' ? 'M' : (gender === 'F' ? 'F' : 'F');
      query = query.eq('sexe', dbGender);
    }

    const { data: patientsRaw, error, count } = await query
      .order(sortBy === 'last_name' ? 'prenom' : (sortBy === 'first_name' ? 'nom' : sortBy), { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const patients = (patientsRaw || []).map(dbToApi);

    return NextResponse.json({
      data: patients,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err: any) {
    console.error('[API_ERROR] GET /api/patients:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Secure POST Handler for Patients
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate Request
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Body
    const body = await request.json();
    const validation = patientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // 3. Database Operation - map API fields to DB columns
    const dbPayload = apiToDb(validation.data);

    const { data: patientData, error: insertError } = await supabase
      .from('patients')
      .insert([{ ...dbPayload, created_by: user.id }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Upsert medical profile if provided
    const profilePayload = profileApiToDb(validation.data);
    if (Object.keys(profilePayload).length > 0) {
      const { error: profileErr } = await supabase
        .from('profils_medicaux')
        .upsert([{ patient_id: patientData.id, ...profilePayload }], { onConflict: 'patient_id' });
      if (profileErr) console.warn('Could not insert profile:', profileErr.message || profileErr);
    }

    return NextResponse.json(dbToApi(patientData), { status: 201 });
  } catch (err: any) {
    console.error('[API_ERROR] POST /api/patients:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
