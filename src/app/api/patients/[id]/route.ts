import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { patientSchema } from '@/lib/validations/patient';
import { apiToDb, dbToApi, profileApiToDb } from '@/lib/mappers/patient';

/**
 * GET /api/patients/[id]
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

    const { data: patientRaw, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      throw patientError;
    }

    // fetch profile
    const { data: profile } = await supabase.from('profils_medicaux').select('*').eq('patient_id', id).single();
    const patient = dbToApi(patientRaw);
    if (profile) {
      patient.allergies = profile.allergies || [];
      patient.medical_history = profile.antecedents || [];
      patient.diabete = profile.diabete;
    }

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error('[API_ERROR] GET /api/patients/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/patients/[id]
 */
export async function PUT(
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
    const validation = patientSchema.partial().safeParse(body); // Partial for updates

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const dbPayload = apiToDb(validation.data);

    const { data, error } = await supabase
      .from('patients')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // update profile if applicable
    const profilePayload = profileApiToDb(validation.data);
    if (Object.keys(profilePayload).length > 0) {
      const { error: profileErr } = await supabase
        .from('profils_medicaux')
        .upsert({ patient_id: id, ...profilePayload }, { onConflict: 'patient_id' });
      if (profileErr) console.warn('Profile upsert error:', profileErr.message || profileErr);
    }

    return NextResponse.json(dbToApi(data));
  } catch (error: any) {
    console.error('[API_ERROR] PUT /api/patients/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/patients/[id]
 */
export async function DELETE(
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

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('[API_ERROR] DELETE /api/patients/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
