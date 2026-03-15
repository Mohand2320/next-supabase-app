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

    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', id)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(treatments);
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
