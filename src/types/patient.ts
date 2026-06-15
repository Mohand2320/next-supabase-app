export type Gender = 'M' | 'F' | 'Other';
export type PatientGenderFilter = 'all' | 'male' | 'female';
export type PatientCreationPreset = 'all' | 'today' | 'week' | 'month' | 'custom';
export type PatientSortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest';

export interface Patient {
  id: string; // UUID
  first_name: string;
  last_name: string;
  date_of_birth: string | null; // ISO Date string (YYYY-MM-DD)
  gender: Gender | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  allergies: string | null;
  medical_history: string | null;
  internal_notes: string | null;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}

export interface PatientInsert extends Omit<Patient, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientUpdate extends Partial<PatientInsert> {}

export interface PatientListFilters {
  search: string;
  gender: PatientGenderFilter;
  createdPreset: PatientCreationPreset;
  createdFrom: string;
  createdTo: string;
  birthFrom: string;
  birthTo: string;
  sort: PatientSortOption;
  page: number;
  limit: number;
}

export interface PatientListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatientListResponse {
  data: Patient[];
  meta: PatientListMeta;
}

export interface Treatment {
  id: string; // UUID
  patient_id: string; // UUID references Patient.id
  date: string; // ISO DateTime string
  treatment_type: string;
  tooth_number: string | null;
  description: string | null;
  cost: number;
  created_at: string; // ISO Date string
}

export interface TreatmentInsert extends Omit<Treatment, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export interface TreatmentUpdate extends Partial<TreatmentInsert> {}
