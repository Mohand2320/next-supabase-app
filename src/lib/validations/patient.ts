import { z } from 'zod';

/**
 * Schema for Patient creation/update
 */
export const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required").trim(),
  last_name: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email address").or(z.literal('')).optional().nullable(),
  phone: z.string().min(5, "Invalid phone number").or(z.literal('')).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').min(1, 'La date de naissance est requise'),
  gender: z.enum(['M', 'F'], { required_error: 'Le sexe est requis' }),
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
  patient_id: z.string().uuid("Invalid patient ID"),
  treatment_type: z.string().min(1, "Treatment type is required"),
  cost: z.number().min(0, "Cost must be a positive number"),
  description: z.string().optional().nullable(),
  tooth_number: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, "Invalid date format (ISO)").optional(),
});

export const queryParamsSchema = patientListQuerySchema;
