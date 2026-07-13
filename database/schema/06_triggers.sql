-- ============================================================
-- 06. TRIGGERS
-- ============================================================

CREATE TRIGGER trg_dentistes_updated_at BEFORE UPDATE ON dentistes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_assistants_updated_at BEFORE UPDATE ON assistants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profils_medicaux_updated_at BEFORE UPDATE ON profils_medicaux FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_actes_medicaux_updated_at BEFORE UPDATE ON actes_medicaux FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_seances_updated_at BEFORE UPDATE ON seances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rdv_updated_at BEFORE UPDATE ON rendez_vous FOR EACH ROW EXECUTE FUNCTION set_updated_at();
