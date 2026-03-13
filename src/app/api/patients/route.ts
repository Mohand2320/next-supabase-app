import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PatientInsert } from '@/types/patient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const gender = searchParams.get('gender');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Text search
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Gender filter
    if (gender && ['M', 'F', 'Other'].includes(gender)) {
      query = query.eq('gender', gender);
    }

    // Sorting – validate column name to prevent injection
    const allowedSortColumns = ['last_name', 'first_name', 'created_at', 'date_of_birth'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const { data: patients, error, count } = await query
      .order(safeSort, { ascending: sortOrder === 'asc' })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: PatientInsert = await request.json();

    // Basic validation
    if (!body.first_name || !body.last_name) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
