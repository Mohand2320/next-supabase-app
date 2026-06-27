import { z } from 'zod';

/**
 * Schema for Patient creation/update
 */
export const patientSchema = z.object({
  first_name: z.string().min(1, "Le prénom est obligatoire.").trim(),
  last_name: z.string().min(1, "Le nom est obligatoire.").trim(),
  email: z.string().email("Veuillez saisir une adresse email valide.").or(z.literal('')).optional().nullable(),
  phone: z.string().min(5, "Le numéro de téléphone est invalide (minimum 5 caractères).").or(z.literal('')).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (AAAA-MM-JJ).').min(1, 'La date de naissance est obligatoire.'),
  gender: z.enum(['M', 'F'], { message: 'Le sexe est obligatoire.' }),
  address: z.string().optional().nullable(),
  medical_history: z.string().optional().nullable(),
});

export const patientListQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  gender: z.enum(['all', 'male', 'female']).default('all'),
  createdPreset: z.enum(['all', 'today', 'week', 'month', 'custom']).default('all'),
  createdFrom: z.string().trim().optional().default(''),
  createdTo: z.string().trim().optional().default(''),
  birthFrom: z.string().trim().optional().default(''),
  birthTo: z.string().trim().optional().default(''),
  sort: z.enum(['name_asc', 'name_desc', 'newest', 'oldest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

/**
 * Schema for Treatment creation
 */
export const treatmentSchema = z.object({
  patient_id: z.string().uuid("Identifiant patient invalide."),
  treatment_type: z.string().min(1, "Le type de traitement est obligatoire."),
  cost: z.number().min(0, "Le coût doit être un nombre positif."),
  description: z.string().optional().nullable(),
  tooth_number: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, "Format de date invalide.").optional(),
});

export const queryParamsSchema = patientListQuerySchema;
