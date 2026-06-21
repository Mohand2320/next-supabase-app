import type { RendezVous } from '@/types/rdv';

// ============================================================
// Mapper — Module Agenda (Rendez-vous)
// DB (snake_case français) ↔ API (snake_case tel quel)
// ============================================================

/**
 * Convertit une ligne DB (rendez_vous + jointures) vers le format API.
 */
export function rdvDbToApi(row: any): RendezVous {
  if (!row) return row;

  return {
    id: row.id,
    patient_id: row.patient_id ?? null,
    nom_minimal: row.nom_minimal ?? null,
    prenom_minimal: row.prenom_minimal ?? null,
    telephone_minimal: row.telephone_minimal ?? null,
    dentiste_id: row.dentiste_id,
    date_heure: row.date_heure,
    duree: row.duree ?? 30,
    statut: row.statut,
    origine_annulation: row.origine_annulation ?? null,
    motif: row.motif ?? null,
    observation: row.observation ?? null,
    couleur: row.couleur ?? '#378ADD',
    seance_id: row.seance_id ?? null,
    cree_par: row.cree_par ?? null,
    modifie_par: row.modifie_par ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Jointures optionnelles
    patient: row.patients ? {
      id: row.patients.id,
      nom: row.patients.nom,
      prenom: row.patients.prenom,
      telephone: row.patients.telephone ?? null,
    } : null,
    dentiste: row.dentistes ? {
      id: row.dentistes.id,
      nom: row.dentistes.nom,
      prenom: row.dentistes.prenom,
    } : null,
  };
}

/**
 * Convertit un payload API de création vers le format DB.
 */
export function rdvApiToDb(obj: any): Record<string, any> {
  const mapped: Record<string, any> = {};

  if (obj.patient_id !== undefined) mapped.patient_id = obj.patient_id || null;
  if (obj.nom_minimal !== undefined) mapped.nom_minimal = obj.nom_minimal || null;
  if (obj.prenom_minimal !== undefined) mapped.prenom_minimal = obj.prenom_minimal || null;
  if (obj.telephone_minimal !== undefined) mapped.telephone_minimal = obj.telephone_minimal || null;
  if (obj.dentiste_id !== undefined) mapped.dentiste_id = obj.dentiste_id;
  if (obj.date_heure !== undefined) mapped.date_heure = obj.date_heure;
  if (obj.duree !== undefined) mapped.duree = obj.duree;
  if (obj.motif !== undefined) mapped.motif = obj.motif || null;
  if (obj.observation !== undefined) mapped.observation = obj.observation || null;
  if (obj.couleur !== undefined) mapped.couleur = obj.couleur;

  return mapped;
}
