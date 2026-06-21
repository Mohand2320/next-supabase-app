import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { rdvDbToApi, rdvApiToDb } from '@/lib/mappers/rdv';
import { rdvUpdateSchema } from '@/lib/validations/rdv';

// ============================================================
// GET /api/rdv/[id] — Détail d'un RDV
// ============================================================
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('rendez_vous')
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 });
    }

    return NextResponse.json(rdvDbToApi(data));
  } catch (error) {
    console.error('[API_ERROR] GET /api/rdv/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================================
// PUT /api/rdv/[id] — Mise à jour (date, durée, motif, observation)
// Ne change PAS le statut (utiliser PATCH /status pour ça)
// ============================================================
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
    const validation = rdvUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Vérifier que le RDV n'est pas dans un état terminal
    const { data: existing } = await supabase
      .from('rendez_vous')
      .select('statut')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 });
    }

    if (existing.statut === 'TERMINE' || existing.statut === 'ANNULE') {
      return NextResponse.json(
        { error: 'Impossible de modifier un RDV terminé ou annulé' },
        { status: 422 }
      );
    }

    const dbPayload = rdvApiToDb(validation.data);
    dbPayload.modifie_par = user.id;

    const { data, error } = await supabase
      .from('rendez_vous')
      .update(dbPayload)
      .eq('id', id)
      .select('*, patients(id, nom, prenom, telephone), dentistes(id, nom, prenom)')
      .single();

    if (error) {
      console.error('[API_ERROR] PUT /api/rdv/[id]:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json(rdvDbToApi(data));
  } catch (error) {
    console.error('[API_ERROR] PUT /api/rdv/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/rdv/[id] — Suppression (uniquement si PLANIFIE)
// ============================================================
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('rendez_vous')
      .select('statut')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 });
    }

    if (existing.statut !== 'PLANIFIE') {
      return NextResponse.json(
        { error: 'Seul un RDV planifié peut être supprimé. Utilisez l\'annulation pour les autres statuts.' },
        { status: 422 }
      );
    }

    const { error } = await supabase
      .from('rendez_vous')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API_ERROR] DELETE /api/rdv/[id]:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] DELETE /api/rdv/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
