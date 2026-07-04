-- ============================================================
-- FIX RLS : Inclusion du rôle 'admin' dans les policies
-- ============================================================

-- ─── 1. Patients ─────────────────────────────────────────────
DROP POLICY IF EXISTS "patients_insert" ON patients;
CREATE POLICY "patients_insert" ON patients FOR INSERT
  WITH CHECK (current_user_role() IN ('dentiste', 'assistant', 'admin'));

DROP POLICY IF EXISTS "patients_update" ON patients;
CREATE POLICY "patients_update" ON patients FOR UPDATE
  USING (current_user_role() IN ('dentiste', 'assistant', 'admin'));

-- ─── 2. Rendez-vous ──────────────────────────────────────────
DROP POLICY IF EXISTS "rdv_insert" ON rendez_vous;
CREATE POLICY "rdv_insert" ON rendez_vous FOR INSERT
  WITH CHECK (current_user_role() IN ('dentiste', 'assistant', 'admin'));

DROP POLICY IF EXISTS "rdv_update" ON rendez_vous;
CREATE POLICY "rdv_update" ON rendez_vous FOR UPDATE
  USING (current_user_role() IN ('dentiste', 'assistant', 'admin'));

-- ─── 3. Séances ──────────────────────────────────────────────
-- On laisse l'admin créer/modifier les séances, tout comme le dentiste
DROP POLICY IF EXISTS "seances_insert" ON seances;
CREATE POLICY "seances_insert" ON seances FOR INSERT
  WITH CHECK (current_user_role() IN ('dentiste', 'admin'));

DROP POLICY IF EXISTS "seances_update" ON seances;
CREATE POLICY "seances_update" ON seances FOR UPDATE
  USING (
    (current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id()) OR
    current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "seances_delete" ON seances;
CREATE POLICY "seances_delete" ON seances FOR DELETE
  USING (
    (current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id()) OR
    current_user_role() = 'admin'
  );

-- ─── 4. Actes Médicaux ───────────────────────────────────────
DROP POLICY IF EXISTS "actes_modify" ON actes_medicaux;
CREATE POLICY "actes_modify" ON actes_medicaux FOR ALL
  USING (current_user_role() IN ('dentiste', 'admin'));

-- ─── 5. Dentistes et Assistants ──────────────────────────────
DROP POLICY IF EXISTS "dentistes_modify" ON dentistes;
CREATE POLICY "dentistes_modify" ON dentistes FOR ALL
  USING (current_user_role() IN ('dentiste', 'admin'));

DROP POLICY IF EXISTS "assistants_modify" ON assistants;
CREATE POLICY "assistants_modify" ON assistants FOR ALL
  USING (current_user_role() IN ('dentiste', 'admin'));
