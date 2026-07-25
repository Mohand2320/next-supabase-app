-- ============================================================
-- 13. FILE D'ATTENTE (QUEUE MANAGEMENT)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_queue_enum') THEN
    CREATE TYPE statut_queue_enum AS ENUM (
      'EN_ATTENTE',
      'APPELE',
      'EN_CONSULTATION',
      'TERMINE',
      'ANNULE',
      'ABSENT'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS file_attente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_jour DATE NOT NULL DEFAULT CURRENT_DATE,
  position INTEGER NOT NULL,
  statut statut_queue_enum NOT NULL DEFAULT 'EN_ATTENTE',
  heure_arrivee TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  rdv_id UUID REFERENCES rendez_vous(id) ON DELETE SET NULL,
  dentiste_id UUID REFERENCES dentistes(id) ON DELETE SET NULL,
  
  nom_minimal TEXT,
  prenom_minimal TEXT,
  telephone_minimal TEXT,
  
  motif TEXT,
  observations TEXT,
  
  cree_par UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_file_attente_patient CHECK (
    patient_id IS NOT NULL OR 
    rdv_id IS NOT NULL OR 
    (nom_minimal IS NOT NULL AND prenom_minimal IS NOT NULL)
  )
);

-- Désactivation explicite du RLS comme demandé
ALTER TABLE file_attente DISABLE ROW LEVEL SECURITY;

-- Index partiel pour bloquer les doublons UNIQUEMENT si le statut est actif
-- (Un patient peut revenir l'après-midi si sa première visite est 'TERMINE' ou 'ANNULE')
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_attente_patient_jour_actif 
ON file_attente (date_jour, patient_id) 
WHERE patient_id IS NOT NULL AND statut IN ('EN_ATTENTE', 'APPELE', 'EN_CONSULTATION');

-- Trigger pour la mise à jour de updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_file_attente_updated_at'
    ) THEN
        CREATE TRIGGER set_file_attente_updated_at
        BEFORE UPDATE ON file_attente
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;


-- Fonction SQL sécurisée avec lock transactionnel pour gérer la position sans collision
CREATE OR REPLACE FUNCTION add_to_queue(
  p_patient_id UUID DEFAULT NULL,
  p_rdv_id UUID DEFAULT NULL,
  p_dentiste_id UUID DEFAULT NULL,
  p_nom_minimal TEXT DEFAULT NULL,
  p_prenom_minimal TEXT DEFAULT NULL,
  p_telephone_minimal TEXT DEFAULT NULL,
  p_motif TEXT DEFAULT NULL,
  p_observations TEXT DEFAULT NULL,
  p_cree_par UUID DEFAULT NULL
) RETURNS SETOF file_attente AS $$
DECLARE
  v_position INTEGER;
  v_new_row file_attente;
BEGIN
  -- Verrou exclusif transactionnel basé sur la date du jour pour éviter les race conditions
  PERFORM pg_advisory_xact_lock(hashtext('file_attente_insert_' || CURRENT_DATE::text));
  
  -- Récupération de la position max + 1
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position 
  FROM file_attente 
  WHERE date_jour = CURRENT_DATE;

  -- Insertion
  INSERT INTO file_attente (
    position, patient_id, rdv_id, dentiste_id, 
    nom_minimal, prenom_minimal, telephone_minimal, 
    motif, observations, cree_par
  ) VALUES (
    v_position, p_patient_id, p_rdv_id, p_dentiste_id,
    p_nom_minimal, p_prenom_minimal, p_telephone_minimal,
    p_motif, p_observations, p_cree_par
  ) RETURNING * INTO v_new_row;

  RETURN NEXT v_new_row;
END;
$$ LANGUAGE plpgsql;


-- Contrainte unique (date_jour, position) pour garantir l'intégrité des positions
-- DEFERRABLE INITIALLY DEFERRED est obligatoire pour permettre de "swapper" deux positions
-- dans un même UPDATE (sinon PostgreSQL lève une erreur de conflit pendant l'UPDATE)
DO $$
BEGIN
  ALTER TABLE file_attente DROP CONSTRAINT IF EXISTS uq_file_attente_date_position;
  ALTER TABLE file_attente ADD CONSTRAINT uq_file_attente_date_position UNIQUE (date_jour, position) DEFERRABLE INITIALLY DEFERRED;
END$$;


-- Fonction RPC atomique avec verrou pour le réordonnancement
-- Met à jour TOUTES les positions en une seule requête, pas seulement l'entrée déplacée
-- Le verrou advisory empêche deux réordonnancements concurrents de s'entrelacer
CREATE OR REPLACE FUNCTION reorder_queue(
  p_items JSONB,
  p_date_jour DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
  -- Verrou transactionnel : un seul reorder à la fois par jour
  PERFORM pg_advisory_xact_lock(hashtext('reorder_queue_' || p_date_jour::text));

  -- Single UPDATE atomique — pas de trou ni de doublon possible
  UPDATE file_attente AS f
  SET position = item.position
  FROM (
    SELECT
      (obj->>'id')::UUID AS id,
      (obj->>'position')::INTEGER AS position
    FROM jsonb_array_elements(p_items) AS elem(obj)
  ) AS item
  WHERE f.id = item.id AND f.date_jour = p_date_jour;
END;
$$ LANGUAGE plpgsql;
