-- ============================================================
-- 04. INDEX DE PERFORMANCE
-- ============================================================

-- ─── PATIENTS ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom);
CREATE INDEX IF NOT EXISTS idx_patients_prenom ON patients(prenom);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON patients(telephone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON patients(sexe);

-- Index trigram pour recherche (ILIKE %...%)
CREATE INDEX IF NOT EXISTS idx_patients_nom_trgm ON patients USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_prenom_trgm ON patients USING gin(prenom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_telephone_trgm ON patients USING gin(telephone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_email_trgm ON patients USING gin(email gin_trgm_ops);

-- ─── SÉANCES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_seances_patient ON seances(patient_id);
CREATE INDEX IF NOT EXISTS idx_seances_dentiste ON seances(dentiste_id);
CREATE INDEX IF NOT EXISTS idx_seances_date ON seances(date_heure DESC);

-- ─── RENDEZ-VOUS ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rdv_patient ON rendez_vous(patient_id);
CREATE INDEX IF NOT EXISTS idx_rdv_dentiste ON rendez_vous(dentiste_id);
CREATE INDEX IF NOT EXISTS idx_rdv_date ON rendez_vous(date_heure);
CREATE INDEX IF NOT EXISTS idx_rdv_statut ON rendez_vous(statut);
CREATE INDEX IF NOT EXISTS idx_rdv_nom_minimal ON rendez_vous(nom_minimal) WHERE nom_minimal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rdv_telephone_minimal ON rendez_vous(telephone_minimal) WHERE telephone_minimal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rdv_cree_par ON rendez_vous(cree_par) WHERE cree_par IS NOT NULL;

-- ─── ACTES MÉDICAUX ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_actes_categorie ON actes_medicaux(categorie);
CREATE INDEX IF NOT EXISTS idx_actes_libelle ON actes_medicaux USING gin(to_tsvector('french', libelle));
