import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { patientSchema, queryParamsSchema } from '@/lib/validations/patient';

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

    // 3. Query Database
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Text search (safe because used in Supabase filter)
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    const { data: patients, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

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

    // 3. Database Operation
    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...validation.data, user_id: user.id }]) // Ensure user_id is linked
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('[API_ERROR] POST /api/patients:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
