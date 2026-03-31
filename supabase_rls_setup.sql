-- 1. Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES FOR 'patients' table
-- Users can only see their own patients
CREATE POLICY "Users can view their own patients" 
ON patients FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert patients for themselves
CREATE POLICY "Users can insert their own patients" 
ON patients FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own patients
CREATE POLICY "Users can update their own patients" 
ON patients FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own patients
CREATE POLICY "Users can delete their own patients" 
ON patients FOR DELETE 
USING (auth.uid() = user_id);


-- 3. CREATE POLICIES FOR 'treatments' table
-- Note: Assuming treatments table has a joining or user relationship.
-- If treatments depend on patients, we can check if the user owns the patient.
CREATE POLICY "Users can view treatments for their patients" 
ON treatments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = treatments.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert treatments for their patients" 
ON treatments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = treatments.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update treatments for their patients" 
ON treatments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = treatments.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete treatments for their patients" 
ON treatments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = treatments.patient_id 
    AND patients.user_id = auth.uid()
  )
);

-- 4. Verify RLS status
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';



-- backup 31/03/2026
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::appointment_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT appointments_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['M'::text, 'F'::text, 'Other'::text])),
  phone text,
  email text,
  address text,
  allergies text,
  medical_history text,
  internal_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id uuid,
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  treatment_type text NOT NULL,
  tooth_number text,
  description text,
  cost numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT treatments_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
-------------------------------------------------------------------------------