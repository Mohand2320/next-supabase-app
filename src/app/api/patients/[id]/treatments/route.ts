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

    // Récupérer les séances (et actes) et les mapper au format attendu (historique)
    const { data: seances, error } = await supabase
      .from('seances')
      .select(`
        id,
        patient_id,
        date_heure,
        observations,
        prix,
        created_at,
        seance_actes (
          quantite,
          prix_applique,
          localisation,
          actes_medicaux ( libelle )
        )
      `)
      .eq('patient_id', id)
      .order('date_heure', { ascending: false });

    if (error) throw error;

    const mappedTreatments = (seances || []).map((s: any) => {
      const types = s.seance_actes?.map((a: any) => `${a.quantite}x ${a.actes_medicaux?.libelle}`).join(', ');
      const localisations = Array.from(new Set(s.seance_actes?.flatMap((a: any) => a.localisation))).join(', ');
      return {
        id: s.id,
        patient_id: s.patient_id,
        date: s.date_heure,
        treatment_type: types || 'Séance de soins',
        tooth_number: localisations || null,
        description: s.observations,
        cost: s.prix,
        created_at: s.created_at
      };
    });

    return NextResponse.json(mappedTreatments);
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
