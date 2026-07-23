import { z } from 'zod';

export const StatutQueueEnum = z.enum([
  'EN_ATTENTE',
  'APPELE',
  'EN_CONSULTATION',
  'TERMINE',
  'ANNULE',
  'ABSENT'
]);

export const addToQueueSchema = z.object({
  patient_id: z.string().uuid().nullish(),
  rdv_id: z.string().uuid().nullish(),
  dentiste_id: z.string().uuid().nullish(),
  
  nom_minimal: z.string().min(1, 'Le nom est requis').nullish(),
  prenom_minimal: z.string().min(1, 'Le prénom est requis').nullish(),
  telephone_minimal: z.string().nullish(),
  
  motif: z.string().nullish(),
  observations: z.string().nullish(),
}).refine((data) => {
  // Soit patient_id, soit rdv_id, soit (nom_minimal ET prenom_minimal)
  return data.patient_id || data.rdv_id || (data.nom_minimal && data.prenom_minimal);
}, {
  message: "Un patient, un RDV, ou le nom/prénom d'une personne sans dossier est requis",
  path: ['patient_id']
});

export const updateQueueStatusSchema = z.object({
  statut: StatutQueueEnum,
});

export const reorderQueueSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(1),
    })
  ).min(1),
});
