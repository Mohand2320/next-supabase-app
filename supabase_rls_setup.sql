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
