-- ============================================================
-- OPTIMISATION INDEX PATIENTS
-- ============================================================

-- Index manquants pour les filtres patients existants
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON patients(telephone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON patients(sexe);

-- Extension pg_trgm pour optimiser les recherches partielles (ILIKE %...%)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigram pour optimiser les recherches de la barre de recherche globale
CREATE INDEX IF NOT EXISTS idx_patients_nom_trgm ON patients USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_prenom_trgm ON patients USING gin(prenom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_telephone_trgm ON patients USING gin(telephone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_email_trgm ON patients USING gin(email gin_trgm_ops);
