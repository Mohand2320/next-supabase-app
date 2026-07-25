-- ============================================================
-- 14. SUPPRESSION D'UNE ENTRÉE DE LA FILE D'ATTENTE
--     (remplace le Promise.all côté API par une transaction atomique)
-- ============================================================

-- Fonction RPC atomique avec verrou pour la suppression
-- Marque l'entrée comme ANNULE avec une position garantie unique (MIN - 1),
-- puis renumérote toutes les entrées actives restantes en une seule requête.
-- Évite les collisions de contrainte uq_file_attente_date_position
-- et les race conditions liées aux transactions multiples.
CREATE OR REPLACE FUNCTION remove_from_queue(
  p_id UUID,
  p_date_jour DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_min_position INTEGER;
BEGIN
  -- Verrou transactionnel : une seule suppression à la fois par jour
  PERFORM pg_advisory_xact_lock(hashtext('remove_from_queue_' || p_date_jour::text));

  -- Calculer une position garantie unique par rapport à toutes les entrées du jour
  -- (y compris celles déjà annulées : -1, -2...) pour éviter toute collision
  SELECT COALESCE(MIN(position), 0) - 1 INTO v_min_position
  FROM file_attente
  WHERE date_jour = p_date_jour;

  -- Marquer la ligne comme ANNULE avec cette position sûre
  UPDATE file_attente
  SET statut = 'ANNULE', position = v_min_position
  WHERE id = p_id AND date_jour = p_date_jour;

  -- Renuméroter atomiquement (1, 2, 3...) toutes les entrées actives restantes
  -- en une seule requête UPDATE avec une fenêtre ROW_NUMBER — pas de boucle
  UPDATE file_attente AS f
  SET position = sub.new_position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS new_position
    FROM file_attente
    WHERE date_jour = p_date_jour
      AND statut IN ('EN_ATTENTE', 'APPELE', 'EN_CONSULTATION')
  ) AS sub
  WHERE f.id = sub.id;
END;
$$ LANGUAGE plpgsql;
