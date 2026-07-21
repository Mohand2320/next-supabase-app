import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { treatmentSchema } from '@/lib/validations/patient';

/**
 * GET /api/patients/[id]/treatments
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
    const offset = (page - 1) * limit;

    // Récupérer l'historique via la vue agrégée
    const { data: treatments, count, error } = await supabase
      .from('v_historique_seances')
      .select('id, patient_id, date, description, cost, created_at, treatment_type, tooth_number', { count: 'exact' })
      .eq('patient_id', id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: treatments || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error: any) {
    console.error('[API_ERROR] GET /api/patients/[id]/treatments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/patients/[id]/treatments
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = treatmentSchema.safeParse({ ...body, patient_id: id });

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('treatments')
      .insert([validation.data])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[API_ERROR] POST /api/patients/[id]/treatments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
