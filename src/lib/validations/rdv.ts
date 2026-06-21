import { z } from 'zod';
import { TRANSITIONS_AUTORISEES } from '@/types/rdv';
import type { StatutRDV } from '@/types/rdv';

// ============================================================
// Validation — Module Agenda (Rendez-vous)
// ============================================================

/**
 * Schéma de création d'un RDV.
 * Supporte RDV_STANDARD (patient_id) et RDV_MINIMAL (nom + prénom + téléphone).
 */
export const rdvCreateSchema = z.object({
  // RDV_STANDARD
  patient_id: z.string().uuid('ID patient invalide').optional().nullable(),
  // RDV_MINIMAL
  nom_minimal: z.string().trim().min(1, 'Le nom est requis').optional().nullable(),
  prenom_minimal: z.string().trim().min(1, 'Le prénom est requis').optional().nullable(),
  telephone_minimal: z.string().trim().min(5, 'Numéro de téléphone invalide').or(z.literal('')).optional().nullable(),
  // Commun
  dentiste_id: z.string().uuid('ID dentiste invalide').optional().nullable(),
  date_heure: z.string().min(1, 'La date et heure sont requises'),
  duree: z.coerce.number().int().min(5, 'Durée minimum 5 minutes').max(480, 'Durée maximum 8 heures').default(30),
  motif: z.string().trim().optional().nullable(),
  observation: z.string().trim().optional().nullable(),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide').optional().default('#378ADD'),
}).refine(
  (data) => {
    // Contrainte : patient_id OU (nom + prénom)
    if (data.patient_id) return true;
    return !!(data.nom_minimal && data.prenom_minimal);
  },
  {
    message: 'Un RDV doit avoir soit un patient lié, soit un nom et prénom.',
    path: ['patient_id'],
  }
);

export type RdvCreateInput = z.infer<typeof rdvCreateSchema>;

/**
 * Schéma de mise à jour d'un RDV (champs modifiables uniquement).
 */
export const rdvUpdateSchema = z.object({
  date_heure: z.string().min(1).optional(),
  duree: z.coerce.number().int().min(5).max(480).optional(),
  motif: z.string().trim().optional().nullable(),
  observation: z.string().trim().optional().nullable(),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type RdvUpdateInput = z.infer<typeof rdvUpdateSchema>;

/**
 * Schéma de transition de statut.
 * Valide que la transition est autorisée et que origine_annulation est présent si ANNULE.
 */
export const rdvStatusTransitionSchema = z.object({
  statut_actuel: z.enum(['PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE'] as const),
  nouveau_statut: z.enum(['PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE'] as const),
  origine_annulation: z.enum(['PATIENT', 'CABINET'] as const).optional().nullable(),
}).refine(
  (data) => {
    const allowed = TRANSITIONS_AUTORISEES[data.statut_actuel as StatutRDV];
    return allowed.includes(data.nouveau_statut as StatutRDV);
  },
  {
    message: 'Transition de statut non autorisée.',
    path: ['nouveau_statut'],
  }
).refine(
  (data) => {
    if (data.nouveau_statut === 'ANNULE') {
      return !!data.origine_annulation;
    }
    return true;
  },
  {
    message: "L'origine de l'annulation est obligatoire.",
    path: ['origine_annulation'],
  }
);

export type RdvStatusTransitionInput = z.infer<typeof rdvStatusTransitionSchema>;

/**
 * Schéma pour les filtres du calendrier.
 */
export const rdvCalendarQuerySchema = z.object({
  date_debut: z.string().min(1, 'Date de début requise'),
  date_fin: z.string().min(1, 'Date de fin requise'),
  dentiste_id: z.string().uuid().optional(),
  statut: z.string().optional(), // comma-separated statuts
});

export type RdvCalendarQuery = z.infer<typeof rdvCalendarQuerySchema>;

/**
 * Schéma de conversion RDV_MINIMAL → Patient.
 */
export const rdvConvertPatientSchema = z.object({
  action: z.enum(['link_existing', 'create_new']),
  patient_id: z.string().uuid('ID patient invalide').optional(),
  patient_data: z.object({
    nom: z.string().trim().min(1, 'Le nom est requis'),
    prenom: z.string().trim().min(1, 'Le prénom est requis'),
    telephone: z.string().trim().optional(),
    date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    sexe: z.enum(['M', 'F']).optional().nullable(),
  }).optional(),
}).refine(
  (data) => {
    if (data.action === 'link_existing') return !!data.patient_id;
    if (data.action === 'create_new') return !!data.patient_data;
    return false;
  },
  {
    message: 'Données invalides pour la conversion.',
    path: ['action'],
  }
);

export type RdvConvertPatientInput = z.infer<typeof rdvConvertPatientSchema>;
