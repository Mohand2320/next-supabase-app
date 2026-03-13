import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TreatmentInsert } from '@/types/patient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', id)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(treatments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body: Omit<TreatmentInsert, 'patient_id'> = await request.json();

    if (!body.treatment_type || body.cost === undefined) {
      return NextResponse.json(
        { error: 'Treatment type and cost are required' },
        { status: 400 }
      );
    }

    const newTreatment: TreatmentInsert = {
      ...body,
      patient_id: id,
    };

    const { data, error } = await supabase
      .from('treatments')
      .insert([newTreatment])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
