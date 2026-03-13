-- Create Patients Table
CREATE TABLE public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    allergies TEXT,
    medical_history TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Treatments Table
CREATE TABLE public.treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    treatment_type TEXT NOT NULL,
    tooth_number TEXT,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes for performance
CREATE INDEX idx_patients_last_name ON public.patients(last_name);
CREATE INDEX idx_treatments_patient_id ON public.treatments(patient_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Create Policies (Example: allow anon authenticated access for development. 
-- In production, restrict based on users)
CREATE POLICY "Allow all access to authenticated users on patients"
ON public.patients FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to anon on patients for testing"
ON public.patients FOR ALL TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users on treatments"
ON public.treatments FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all access to anon on treatments for testing"
ON public.treatments FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- Functions to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
