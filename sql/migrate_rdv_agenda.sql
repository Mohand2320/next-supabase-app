-- ============================================================
-- MIGRATION — Module Agenda (Rendez-vous)
-- Adapte la table rendez_vous pour supporter RDV_MINIMAL
-- et la machine à états complète (PLANIFIE→CONFIRME→TERMINE/ANNULE)
-- Ce script est idempotent : peut être exécuté plusieurs fois.
-- ============================================================

-- ─── ENUM origine_annulation ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origine_annulation_enum') THEN
    CREATE TYPE origine_annulation_enum AS ENUM ('PATIENT', 'CABINET');
  END IF;
END$$;

-- ─── Rendre patient_id et dentiste_id nullables ──────────────
-- (Sécurisé par IF EXISTS pour les exécutions multiples)
ALTER TABLE rendez_vous ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE rendez_vous ALTER COLUMN dentiste_id DROP NOT NULL;
ALTER TABLE seances ALTER COLUMN dentiste_id DROP NOT NULL;

-- ─── Nouveaux champs ────────────────────────────────────────
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS nom_minimal TEXT;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS prenom_minimal TEXT;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS telephone_minimal TEXT;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS observation TEXT;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS origine_annulation origine_annulation_enum;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS cree_par UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL;
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS modifie_par UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ─── Contrainte d'intégrité : patient_id OU infos minimales ─
ALTER TABLE rendez_vous DROP CONSTRAINT IF EXISTS chk_rdv_patient_ou_minimal;
ALTER TABLE rendez_vous ADD CONSTRAINT chk_rdv_patient_ou_minimal CHECK (
  patient_id IS NOT NULL
  OR (nom_minimal IS NOT NULL AND prenom_minimal IS NOT NULL)
);

-- ─── Contrainte : origine_annulation obligatoire si ANNULE ──
ALTER TABLE rendez_vous DROP CONSTRAINT IF EXISTS chk_rdv_annulation_origine;
ALTER TABLE rendez_vous ADD CONSTRAINT chk_rdv_annulation_origine CHECK (
  statut != 'ANNULE' OR origine_annulation IS NOT NULL
);

-- ─── Index supplémentaires ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rdv_nom_minimal ON rendez_vous(nom_minimal) WHERE nom_minimal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rdv_telephone_minimal ON rendez_vous(telephone_minimal) WHERE telephone_minimal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rdv_cree_par ON rendez_vous(cree_par) WHERE cree_par IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rdv_statut ON rendez_vous(statut);

-- ─── Index patients supplémentaires ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON patients(telephone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON patients(sexe);

-- ─── Index trigram patients ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_patients_nom_trgm ON patients USING gin(nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_prenom_trgm ON patients USING gin(prenom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_telephone_trgm ON patients USING gin(telephone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_email_trgm ON patients USING gin(email gin_trgm_ops);

-- ─── Fonctions RLS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_dentiste_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT dentiste_id FROM user_profiles WHERE user_id = auth.uid();
$$;

-- ─── RLS pour les nouvelles colonnes ───────────────────────
-- Les policies rdv_select, rdv_insert, rdv_update, rdv_delete couvrent
-- déjà la table entière. Pas besoin d'en ajouter.

-- ============================================================
-- MISE À JOUR de la fonction convertir_rdv_en_seance
-- Supporte maintenant les RDV sans patient_id (RDV_MINIMAL)
-- ============================================================
CREATE OR REPLACE FUNCTION convertir_rdv_en_seance(p_rdv_id UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_rdv rendez_vous%ROWTYPE;
  v_seance_id UUID;
BEGIN
  SELECT * INTO v_rdv FROM rendez_vous WHERE id = p_rdv_id;

  IF v_rdv IS NULL THEN
    RAISE EXCEPTION 'RDV non trouvé : %', p_rdv_id;
  END IF;

  IF v_rdv.statut NOT IN ('CONFIRME', 'PLANIFIE') THEN
    RAISE EXCEPTION 'Le RDV doit être PLANIFIE ou CONFIRME pour être converti (statut actuel : %)', v_rdv.statut;
  END IF;

  IF v_rdv.patient_id IS NOT NULL THEN
    INSERT INTO seances (patient_id, date_heure, type_denture)
    VALUES (v_rdv.patient_id, v_rdv.date_heure, 'ADULTE')
    RETURNING id INTO v_seance_id;

    UPDATE rendez_vous
    SET statut = 'TERMINE', seance_id = v_seance_id
    WHERE id = p_rdv_id;
  ELSE
    UPDATE rendez_vous
    SET statut = 'TERMINE'
    WHERE id = p_rdv_id;
  END IF;

  RETURN v_seance_id;
END;
$$;

COMMENT ON FUNCTION convertir_rdv_en_seance IS 'Crée une Seance depuis un RendezVous et passe son statut à TERMINE. Supporte les RDV_MINIMAL (sans patient).';
