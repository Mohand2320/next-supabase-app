-- ============================================================
-- CABINET DENTAL — Schéma Supabase (PostgreSQL)
-- Généré depuis le diagramme UML
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUMS ──────────────────────────────────────────────────
CREATE TYPE sexe_enum AS ENUM ('M', 'F');
CREATE TYPE type_denture_enum AS ENUM ('ENFANT', 'ADULTE');

CREATE TYPE categorie_acte_enum AS ENUM (
  'CONSERVATEUR',
  'ENDODONTIE',
  'PROTHESE',
  'PARODONTOLOGIE',
  'CHIRURGIE',
  'ESTHETIQUE',
  'CONSULTATION'
);

CREATE TYPE statut_rdv_enum AS ENUM (
  'PLANIFIE',
  'CONFIRME',
  'TERMINE',
  'ANNULE'
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origine_annulation_enum') THEN
    CREATE TYPE origine_annulation_enum AS ENUM ('PATIENT', 'CABINET');
  END IF;
END$$;

-- ============================================================
-- TABLES PRINCIPALES
-- ============================================================

-- ─── DENTISTE ────────────────────────────────────────────────
CREATE TABLE dentistes (
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
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE assistants IS 'Assistants dentaires — credentials via Supabase Auth';

-- ─── LIEN UTILISATEURS AUTH <-> PROFILS ──────────────────────
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dentiste', 'assistant')),
  dentiste_id UUID REFERENCES dentistes(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_role_only CHECK (
    (role = 'dentiste' AND dentiste_id IS NOT NULL AND assistant_id IS NULL) OR
    (role = 'assistant' AND assistant_id IS NOT NULL AND dentiste_id IS NULL)
  )
);

COMMENT ON TABLE user_profiles IS 'Jointure entre auth.users et les entités métier';

-- ─── PATIENT ─────────────────────────────────────────────────
CREATE TABLE patients (
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
COMMENT ON COLUMN patients.num_assurance IS 'À chiffrer via Supabase Vault en production';

-- ─── PROFIL MÉDICAL ──────────────────────────────────────────
CREATE TABLE profils_medicaux (
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
COMMENT ON COLUMN profils_medicaux.antecedents IS 'Liste des antécédents médicaux';
COMMENT ON COLUMN profils_medicaux.allergies IS 'Liste des allergies connues';

-- ─── ACTE MÉDICAL ────────────────────────────────────────────
CREATE TABLE actes_medicaux (
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
CREATE TABLE catalogues_actes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dentiste_id UUID NOT NULL UNIQUE REFERENCES dentistes(id) ON DELETE CASCADE,
  personnalise BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE catalogues_actes IS 'Catalogue d''actes lié à un dentiste (1-1)';

-- Table pivot : catalogue <-> actes
CREATE TABLE catalogue_actes_items (
  catalogue_id UUID NOT NULL REFERENCES catalogues_actes(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES actes_medicaux(id) ON DELETE CASCADE,
  prix_personnalise NUMERIC(10, 2),
  PRIMARY KEY (catalogue_id, acte_id)
);

COMMENT ON TABLE catalogue_actes_items IS 'Actes inclus dans un catalogue (avec prix optionnel surchargé)';

-- ─── SÉANCE ──────────────────────────────────────────────────
CREATE TABLE seances (
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
COMMENT ON COLUMN seances.localisation IS 'Numéros de dents concernées selon notation ISO 3950';
COMMENT ON COLUMN seances.imagerie IS 'URLs signées Supabase Storage vers les radiographies';

-- Table pivot : séance <-> actes médicaux réalisés
CREATE TABLE seance_actes (
  seance_id UUID NOT NULL REFERENCES seances(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES actes_medicaux(id) ON DELETE RESTRICT,
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_applique NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (seance_id, acte_id)
);

COMMENT ON TABLE seance_actes IS 'Actes réalisés lors d''une séance (avec prix historique)';

-- ─── RENDEZ-VOUS ─────────────────────────────────────────────
CREATE TABLE rendez_vous (
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
    patient_id IS NOT NULL
    OR (nom_minimal IS NOT NULL AND prenom_minimal IS NOT NULL)
  ),
  CONSTRAINT chk_rdv_annulation_origine CHECK (
    statut != 'ANNULE' OR origine_annulation IS NOT NULL
  )
);

COMMENT ON TABLE rendez_vous IS 'Planification des rendez-vous patients';
COMMENT ON COLUMN rendez_vous.duree IS 'Durée en minutes';
COMMENT ON COLUMN rendez_vous.couleur IS 'Couleur hexadécimale pour affichage calendrier';
COMMENT ON COLUMN rendez_vous.seance_id IS 'Référence vers la séance créée après conversion';

-- ============================================================
-- INDEX DE PERFORMANCE
-- ============================================================
CREATE INDEX idx_patients_nom ON patients(nom);
CREATE INDEX idx_patients_prenom ON patients(prenom);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_telephone ON patients(telephone);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX idx_patients_sexe ON patients(sexe);

CREATE INDEX idx_patients_nom_trgm ON patients USING gin(nom gin_trgm_ops);
CREATE INDEX idx_patients_prenom_trgm ON patients USING gin(prenom gin_trgm_ops);
CREATE INDEX idx_patients_telephone_trgm ON patients USING gin(telephone gin_trgm_ops);
CREATE INDEX idx_patients_email_trgm ON patients USING gin(email gin_trgm_ops);

CREATE INDEX idx_seances_patient ON seances(patient_id);
CREATE INDEX idx_seances_dentiste ON seances(dentiste_id);
CREATE INDEX idx_seances_date ON seances(date_heure DESC);

CREATE INDEX idx_rdv_patient ON rendez_vous(patient_id);
CREATE INDEX idx_rdv_dentiste ON rendez_vous(dentiste_id);
CREATE INDEX idx_rdv_date ON rendez_vous(date_heure);
CREATE INDEX idx_rdv_statut ON rendez_vous(statut);
CREATE INDEX idx_rdv_nom_minimal ON rendez_vous(nom_minimal) WHERE nom_minimal IS NOT NULL;
CREATE INDEX idx_rdv_telephone_minimal ON rendez_vous(telephone_minimal) WHERE telephone_minimal IS NOT NULL;
CREATE INDEX idx_rdv_cree_par ON rendez_vous(cree_par) WHERE cree_par IS NOT NULL;

CREATE INDEX idx_actes_categorie ON actes_medicaux(categorie);
CREATE INDEX idx_actes_libelle ON actes_medicaux USING gin(to_tsvector('french', libelle));

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dentistes_updated_at BEFORE UPDATE ON dentistes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_assistants_updated_at BEFORE UPDATE ON assistants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profils_medicaux_updated_at BEFORE UPDATE ON profils_medicaux FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_actes_medicaux_updated_at BEFORE UPDATE ON actes_medicaux FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_seances_updated_at BEFORE UPDATE ON seances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rdv_updated_at BEFORE UPDATE ON rendez_vous FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FONCTIONS MÉTIER
-- ============================================================
CREATE OR REPLACE FUNCTION get_age(p_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT DATE_PART('year', AGE(date_naissance))::INTEGER FROM patients WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION add_antecedent(p_patient_id UUID, p_antecedent TEXT)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE profils_medicaux
  SET antecedents = array_append(antecedents, p_antecedent)
  WHERE patient_id = p_patient_id;
$$;

CREATE OR REPLACE FUNCTION recalculer_prix_seance(p_seance_id UUID)
RETURNS NUMERIC LANGUAGE sql AS $$
  SELECT COALESCE(SUM(sa.prix_applique * sa.quantite), 0)
  FROM seance_actes sa
  WHERE sa.seance_id = p_seance_id;
$$;

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

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_dentiste_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT dentiste_id FROM user_profiles WHERE user_id = auth.uid();
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
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

-- Patients
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (current_user_role() IN ('dentiste', 'assistant'));
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (current_user_role() IN ('dentiste', 'assistant'));
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (current_user_role() = 'dentiste');

-- Profils médicaux
CREATE POLICY "profils_select" ON profils_medicaux FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profils_insert_update" ON profils_medicaux FOR ALL USING (current_user_role() IN ('dentiste', 'assistant'));

-- Séances
CREATE POLICY "seances_select" ON seances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "seances_insert" ON seances FOR INSERT WITH CHECK (current_user_role() = 'dentiste');
CREATE POLICY "seances_update" ON seances FOR UPDATE USING (current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id());
CREATE POLICY "seances_delete" ON seances FOR DELETE USING (current_user_role() = 'dentiste' AND dentiste_id = current_dentiste_id());

-- Rendez-vous
CREATE POLICY "rdv_select" ON rendez_vous FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rdv_insert" ON rendez_vous FOR INSERT WITH CHECK (current_user_role() IN ('dentiste', 'assistant'));
CREATE POLICY "rdv_update" ON rendez_vous FOR UPDATE USING (current_user_role() IN ('dentiste', 'assistant'));
CREATE POLICY "rdv_delete" ON rendez_vous FOR DELETE USING (current_user_role() = 'dentiste');

-- Catalogue
CREATE POLICY "catalogue_select" ON catalogues_actes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "catalogue_modify" ON catalogues_actes FOR ALL USING (dentiste_id = current_dentiste_id());

-- Actes médicaux
CREATE POLICY "actes_select" ON actes_medicaux FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "actes_modify" ON actes_medicaux FOR ALL USING (current_user_role() = 'dentiste');

-- ============================================================
-- DONNÉES INITIALES (SEED)
-- ============================================================
INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description) VALUES
  ('Consultation initiale', 'CONSULTATION', 30.00, 'Premier examen clinique complet'),
  ('Consultation de contrôle', 'CONSULTATION', 23.00, 'Examen de suivi semestriel'),
  ('Détartrage simple', 'CONSERVATEUR', 28.50, 'Détartrage supra-gingival manuel'),
  ('Obturation composite 1 face', 'CONSERVATEUR', 45.00, 'Résine composite 1 face (antérieure)'),
  ('Obturation composite 2 faces', 'CONSERVATEUR', 62.00, 'Résine composite 2 faces'),
  ('Traitement canalaire monorad.', 'ENDODONTIE', 120.00, 'Dépulpation + mise en forme + obturation'),
  ('Traitement canalaire multirad.', 'ENDODONTIE', 185.00, 'Molaire — 3 canaux ou plus'),
  ('Couronne céramique', 'PROTHESE', 450.00, 'Prothèse fixée tout céramique'),
  ('Couronne métallique', 'PROTHESE', 280.00, 'Prothèse fixée métal-céramique'),
  ('Prothèse amovible partielle', 'PROTHESE', 650.00, 'Appareil partiel résine'),
  ('Chirurgie extraction simple', 'CHIRURGIE', 45.00, 'Avulsion dent déchaussée ou mobile'),
  ('Chirurgie extraction complexe', 'CHIRURGIE', 120.00, 'Dent incluse ou retenue'),
  ('Blanchiment en cabinet', 'ESTHETIQUE', 250.00, 'Blanchiment professionnel lampe LED'),
  ('Détartrage parodontal', 'PARODONTOLOGIE', 85.00, 'Surfaçage radiculaire par quadrant')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VUE UTILITAIRE : fiche patient complète
-- ============================================================
CREATE OR REPLACE VIEW v_fiche_patient AS
SELECT
  p.id,
  p.nom,
  p.prenom,
  p.date_naissance,
  DATE_PART('year', AGE(p.date_naissance))::INTEGER AS age,
  p.sexe,
  p.telephone,
  p.email,
  p.groupe_sanguin,
  pm.antecedents,
  pm.allergies,
  pm.diabete,
  COUNT(DISTINCT s.id) AS nb_seances,
  COUNT(DISTINCT rdv.id) AS nb_rdv_a_venir,
  MAX(s.date_heure) AS derniere_seance
FROM patients p
LEFT JOIN profils_medicaux pm ON pm.patient_id = p.id
LEFT JOIN seances s ON s.patient_id = p.id
LEFT JOIN rendez_vous rdv ON (rdv.patient_id = p.id AND rdv.date_heure > now() AND rdv.statut NOT IN ('ANNULE', 'TERMINE'))
GROUP BY p.id, pm.antecedents, pm.allergies, pm.diabete;

COMMENT ON VIEW v_fiche_patient IS 'Vue consolidée patient + profil médical + stats séances/RDV';
