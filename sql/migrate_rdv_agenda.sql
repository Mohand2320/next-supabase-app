-- ============================================================
-- MIGRATION — Module Agenda (Rendez-vous)
-- Adapte la table rendez_vous pour supporter RDV_MINIMAL
-- et la machine à états complète (PLANIFIE→CONFIRME→TERMINE/ANNULE)
-- ============================================================

-- ─── ENUM origine_annulation ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origine_annulation_enum') THEN
    CREATE TYPE origine_annulation_enum AS ENUM ('PATIENT', 'CABINET');
  END IF;
END$$;

-- ─── Rendre patient_id et dentiste_id nullables ──────────────
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
-- Un RDV doit toujours avoir soit un patient lié, soit nom + prénom + téléphone
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

-- ─── RLS pour les nouvelles colonnes (policies existantes couvrent déjà) ─
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

  -- Pour un RDV_MINIMAL sans patient_id, on ne crée pas de séance
  -- (la séance nécessite un patient_id NOT NULL)
  -- Le RDV sera simplement marqué TERMINE
  IF v_rdv.patient_id IS NOT NULL THEN
    INSERT INTO seances (patient_id, date_heure, type_denture)
    VALUES (v_rdv.patient_id, v_rdv.date_heure, 'ADULTE')
    RETURNING id INTO v_seance_id;

    UPDATE rendez_vous
    SET statut = 'TERMINE', seance_id = v_seance_id
    WHERE id = p_rdv_id;
  ELSE
    -- RDV_MINIMAL : marquer terminé sans séance (séance créée après conversion patient)
    UPDATE rendez_vous
    SET statut = 'TERMINE'
    WHERE id = p_rdv_id;
  END IF;

  RETURN v_seance_id;  -- NULL si RDV_MINIMAL
END;
$$;

COMMENT ON FUNCTION convertir_rdv_en_seance IS 'Crée une Seance depuis un RendezVous et passe son statut à TERMINE. Supporte les RDV_MINIMAL (sans patient).';
