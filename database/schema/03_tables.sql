-- ============================================================
-- 03. TABLES PRINCIPALES
-- ============================================================

-- ─── DENTISTE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dentistes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  specialite TEXT,
  numero_rpps TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE dentistes IS 'Praticiens dentistes du cabinet';

-- ─── ASSISTANT DENTISTE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE assistants IS 'Assistants dentaires';

-- ─── LIEN UTILISATEURS AUTH <-> PROFILS ──────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dentiste', 'assistant')),
  dentiste_id UUID REFERENCES dentistes(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_role_only CHECK (
    (role = 'dentiste' AND dentiste_id IS NOT NULL AND assistant_id IS NULL) OR
    (role = 'assistant' AND assistant_id IS NOT NULL AND dentiste_id IS NULL)
  )
);
COMMENT ON TABLE user_profiles IS 'Jointure entre auth.users et les entités métier. Gère aussi les droits d''accès globaux et le statut d''administration.';

-- ─── PATIENT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  sexe sexe_enum NOT NULL,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  num_assurance TEXT,
  groupe_sanguin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE patients IS 'Dossier administratif du patient';

-- ─── PROFIL MÉDICAL ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profils_medicaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  antecedents TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  diabete BOOLEAN NOT NULL DEFAULT false,
  groupe_sanguin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profils_medicaux IS 'Données médicales — relation 1-1 avec patients';

-- ─── ACTE MÉDICAL ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actes_medicaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  libelle TEXT NOT NULL,
  categorie categorie_acte_enum NOT NULL,
  prix_defaut NUMERIC(10, 2) NOT NULL CHECK (prix_defaut >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE actes_medicaux IS 'Référentiel des actes dentaires avec tarif par défaut';

-- ─── CATALOGUE ACTES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogues_actes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dentiste_id UUID NOT NULL UNIQUE REFERENCES dentistes(id) ON DELETE CASCADE,
  personnalise BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE catalogues_actes IS 'Catalogue d''actes lié à un dentiste (1-1)';

-- Table pivot : catalogue <-> actes
CREATE TABLE IF NOT EXISTS catalogue_actes_items (
  catalogue_id UUID NOT NULL REFERENCES catalogues_actes(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES actes_medicaux(id) ON DELETE CASCADE,
  prix_personnalise NUMERIC(10, 2),
  PRIMARY KEY (catalogue_id, acte_id)
);

-- ─── SÉANCE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  dentiste_id UUID REFERENCES dentistes(id) ON DELETE RESTRICT,
  date_heure TIMESTAMPTZ NOT NULL,
  prix NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (prix >= 0),
  observations TEXT,
  localisation TEXT[] NOT NULL DEFAULT '{}',
  type_denture type_denture_enum NOT NULL DEFAULT 'ADULTE',
  imagerie TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE seances IS 'Séance de soin réalisée sur un patient';

-- Table pivot : séance <-> actes médicaux réalisés
CREATE TABLE IF NOT EXISTS seance_actes (
  seance_id UUID NOT NULL REFERENCES seances(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES actes_medicaux(id) ON DELETE RESTRICT,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_applique NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (seance_id, acte_id)
);
COMMENT ON TABLE seance_actes IS 'Actes réalisés lors d''une séance';

-- ─── RENDEZ-VOUS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
  dentiste_id UUID REFERENCES dentistes(id) ON DELETE RESTRICT,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  date_heure TIMESTAMPTZ NOT NULL,
  duree INTEGER NOT NULL DEFAULT 30 CHECK (duree > 0),
  statut statut_rdv_enum NOT NULL DEFAULT 'PLANIFIE',
  motif TEXT,
  couleur TEXT DEFAULT '#378ADD',
  seance_id UUID REFERENCES seances(id) ON DELETE SET NULL,
  
  -- Support RDV sans dossier patient complet
  nom_minimal TEXT,
  prenom_minimal TEXT,
  telephone_minimal TEXT,
  observation TEXT,
  origine_annulation origine_annulation_enum,
  cree_par UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  modifie_par UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_rdv_patient_ou_minimal CHECK (
    patient_id IS NOT NULL OR (nom_minimal IS NOT NULL AND prenom_minimal IS NOT NULL)
  ),
  CONSTRAINT chk_rdv_annulation_origine CHECK (
    statut != 'ANNULE' OR origine_annulation IS NOT NULL
  )
);
COMMENT ON TABLE rendez_vous IS 'Planification des rendez-vous patients, avec support pour RDV minimal (nouveau patient)';
