-- ============================================================
-- 08. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profils_medicaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE seances ENABLE ROW LEVEL SECURITY;
ALTER TABLE seance_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE dentistes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE actes_medicaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogues_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_actes_items ENABLE ROW LEVEL SECURITY;

-- ─── USER_PROFILES ───────────────────────────────────────────
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_profiles_select_admin" ON user_profiles FOR SELECT USING (current_user_is_admin());
CREATE POLICY "user_profiles_update_admin" ON user_profiles FOR UPDATE USING (current_user_is_admin());

-- ─── PATIENTS ────────────────────────────────────────────────
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (current_user_role() IN ('dentiste', 'assistant') OR current_user_is_admin());
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (current_user_role() IN ('dentiste', 'assistant') OR current_user_is_admin());
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (current_user_role() = 'dentiste' OR current_user_is_admin());

-- ─── PROFILS MEDICAUX ────────────────────────────────────────
CREATE POLICY "profils_select" ON profils_medicaux FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profils_insert_update" ON profils_medicaux FOR ALL USING (current_user_role() IN ('dentiste', 'assistant') OR current_user_is_admin());

-- ─── SEANCES ─────────────────────────────────────────────────
CREATE POLICY "seances_select" ON seances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "seances_insert" ON seances FOR INSERT WITH CHECK (current_user_role() = 'dentiste' OR current_user_is_admin());
CREATE POLICY "seances_update" ON seances FOR UPDATE USING ((current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id()) OR current_user_is_admin());
CREATE POLICY "seances_delete" ON seances FOR DELETE USING ((current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id()) OR current_user_is_admin());

-- ─── RENDEZ-VOUS ─────────────────────────────────────────────
CREATE POLICY "rdv_select" ON rendez_vous FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rdv_insert" ON rendez_vous FOR INSERT WITH CHECK (current_user_role() IN ('dentiste', 'assistant') OR current_user_is_admin());
CREATE POLICY "rdv_update" ON rendez_vous FOR UPDATE USING (current_user_role() IN ('dentiste', 'assistant') OR current_user_is_admin());
CREATE POLICY "rdv_delete" ON rendez_vous FOR DELETE USING (current_user_role() = 'dentiste' OR current_user_is_admin());

-- ─── CATALOGUE ACTES ─────────────────────────────────────────
CREATE POLICY "catalogue_select" ON catalogues_actes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "catalogue_modify" ON catalogues_actes FOR ALL USING (dentiste_id = current_dentiste_id() OR current_user_is_admin());

CREATE POLICY "catalogue_items_select" ON catalogue_actes_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "catalogue_items_modify" ON catalogue_actes_items FOR ALL USING (current_user_role() = 'dentiste' OR current_user_is_admin());

-- ─── ACTES MEDICAUX ──────────────────────────────────────────
CREATE POLICY "actes_select" ON actes_medicaux FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "actes_modify" ON actes_medicaux FOR ALL USING (current_user_role() = 'dentiste' OR current_user_is_admin());

-- ─── DENTISTES ET ASSISTANTS ─────────────────────────────────
CREATE POLICY "dentistes_select" ON dentistes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dentistes_modify" ON dentistes FOR ALL USING (current_user_role() = 'dentiste' OR current_user_is_admin());

CREATE POLICY "assistants_select" ON assistants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "assistants_modify" ON assistants FOR ALL USING (current_user_role() = 'dentiste' OR current_user_is_admin());

-- ─── SEANCE ACTES ────────────────────────────────────────────
CREATE POLICY "seance_actes_select" ON seance_actes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "seance_actes_insert" ON seance_actes FOR INSERT WITH CHECK (current_user_role() = 'dentiste' OR current_user_is_admin());
CREATE POLICY "seance_actes_modify" ON seance_actes FOR ALL USING (current_user_role() = 'dentiste' OR current_user_is_admin());
