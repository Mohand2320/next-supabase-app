import type {
  RendezVous,
  RdvCreatePayload,
  RdvUpdatePayload,
  RdvStatusTransitionPayload,
  RdvStatusTransitionResponse,
  RdvConvertPatientPayload,
  RdvCalendarFilters,
} from '@/types/rdv';

// ============================================================
// Service Client — Module Agenda (Rendez-vous)
// ============================================================

/**
 * Récupère les RDV pour une plage de dates (vue calendrier).
 */
export async function fetchRdvs(
  filters: RdvCalendarFilters,
  signal?: AbortSignal
): Promise<{ data: RendezVous[] }> {
  const params = new URLSearchParams();
  params.set('date_debut', filters.date_debut);
  params.set('date_fin', filters.date_fin);
  if (filters.dentiste_id) params.set('dentiste_id', filters.dentiste_id);
  if (filters.statut && filters.statut.length > 0) {
    params.set('statut', filters.statut.join(','));
  }

  const response = await fetch(`/api/rdv?${params.toString()}`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors du chargement des rendez-vous');
  }

  return payload;
}

/**
 * Récupère le détail d'un RDV.
 */
export async function fetchRdv(id: string): Promise<RendezVous> {
  const response = await fetch(`/api/rdv/${id}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors du chargement du RDV');
  }

  return payload;
}

/**
 * Crée un nouveau RDV.
 */
export async function createRdv(data: RdvCreatePayload): Promise<RendezVous> {
  const response = await fetch('/api/rdv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors de la création du RDV');
  }

  return payload;
}

/**
 * Met à jour un RDV (date, durée, motif, observation).
 */
export async function updateRdv(id: string, data: RdvUpdatePayload): Promise<RendezVous> {
  const response = await fetch(`/api/rdv/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors de la mise à jour du RDV');
  }

  return payload;
}

/**
 * Supprime un RDV (uniquement si PLANIFIE).
 */
export async function deleteRdv(id: string): Promise<void> {
  const response = await fetch(`/api/rdv/${id}`, { method: 'DELETE' });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors de la suppression du RDV');
  }
}

/**
 * Change le statut d'un RDV (machine à états).
 */
export async function updateRdvStatus(
  id: string,
  data: RdvStatusTransitionPayload
): Promise<RdvStatusTransitionResponse> {
  const response = await fetch(`/api/rdv/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors du changement de statut');
  }

  return payload;
}

/**
 * Convertit un RDV_MINIMAL en rattachant un patient.
 */
export async function convertMinimalToPatient(
  rdvId: string,
  data: RdvConvertPatientPayload
): Promise<{ rdv: RendezVous; patient_id: string; action_effectuee: string }> {
  const response = await fetch(`/api/rdv/${rdvId}/convert-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur lors de la conversion');
  }

  return payload;
}

/**
 * Recherche des patients par nom/téléphone (pour la sélection lors de la création).
 */
export async function searchPatients(
  search: string,
  signal?: AbortSignal
): Promise<Array<{ id: string; nom: string; prenom: string; telephone: string | null }>> {
  const params = new URLSearchParams();
  params.set('search', search);
  params.set('limit', '10');

  const response = await fetch(`/api/patients?${params.toString()}`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) return [];

  // Map from API format (first_name/last_name) to our format (nom/prenom)
  return (payload?.data || []).map((p: any) => ({
    id: p.id,
    nom: p.last_name,
    prenom: p.first_name,
    telephone: p.phone,
  }));
}
