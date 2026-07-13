-- ============================================================
-- 02. ENUMS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sexe_enum') THEN
    CREATE TYPE sexe_enum AS ENUM ('M', 'F');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_denture_enum') THEN
    CREATE TYPE type_denture_enum AS ENUM ('ENFANT', 'ADULTE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categorie_acte_enum') THEN
    CREATE TYPE categorie_acte_enum AS ENUM (
      'CONSERVATEUR',
      'ENDODONTIE',
      'PROTHESE',
      'PARODONTOLOGIE',
      'CHIRURGIE',
      'ESTHETIQUE',
      'CONSULTATION'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_rdv_enum') THEN
    CREATE TYPE statut_rdv_enum AS ENUM (
      'PLANIFIE',
      'CONFIRME',
      'TERMINE',
      'ANNULE'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origine_annulation_enum') THEN
    CREATE TYPE origine_annulation_enum AS ENUM ('PATIENT', 'CABINET');
  END IF;
END$$;
