-- ============================================================
-- 11. CORRECTIONS MÉTIER (Unicité catalogue & Vue Historique)
-- ============================================================

-- 1. Contrainte d'unicité manquante (catalogue_id, acte_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_catalogue_acte'
  ) THEN
    ALTER TABLE catalogue_actes_items 
    ADD CONSTRAINT unique_catalogue_acte UNIQUE(catalogue_id, acte_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT unique_catalogue_acte ON catalogue_actes_items IS 'Empêche d''avoir deux prix personnalisés pour le même acte dans un même catalogue';

-- 2. Vue SQL dédiée pour l'historique des séances
-- Agrégation de l'historique faite en SQL pour garantir la consistance entre les écrans
CREATE OR REPLACE VIEW v_historique_seances AS
SELECT 
  s.id,
  s.patient_id,
  s.date_heure AS date,
  s.observations AS description,
  s.prix AS cost,
  s.created_at,
  COALESCE(
    (
      SELECT STRING_AGG(sa.quantite || 'x ' || am.libelle, ', ')
      FROM seance_actes sa
      JOIN actes_medicaux am ON sa.acte_id = am.id
      WHERE sa.seance_id = s.id
    ),
    'Séance de soins'
  ) AS treatment_type,
  (
    SELECT STRING_AGG(DISTINCT loc, ', ')
    FROM seance_actes sa, unnest(sa.localisation) AS loc
    WHERE sa.seance_id = s.id
  ) AS tooth_number
FROM seances s;

COMMENT ON VIEW v_historique_seances IS 'Vue formatée de l''historique des séances avec agrégation des actes et des dents concernées';
