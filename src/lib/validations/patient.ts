import { z } from 'zod';

/**
 * Schema for Patient creation/update
 */
export const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required").trim(),
  last_name: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().min(5, "Invalid phone number").optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().nullable(),
  gender: z.enum(['M', 'F', 'Other']).optional().nullable(),
  address: z.string().optional().nullable(),
  medical_history: z.string().optional().nullable(),
});

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

/**
 * Schema for pagination and search query parameters
 */
export const queryParamsSchema = z.object({
  search: z.string().optional().nullable(),
  gender: z.enum(['M', 'F', 'Other']).optional().nullable(),
  sortBy: z.enum(['last_name', 'first_name', 'created_at', 'date_of_birth']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).default(1)),
  limit: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(100).default(10)),
});
