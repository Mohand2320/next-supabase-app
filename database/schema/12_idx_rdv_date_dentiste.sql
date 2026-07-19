-- ============================================================
-- 12. INDEX COMPOSITE RENDEZ-VOUS (date_heure + dentiste_id)
-- ============================================================
-- Optimise la requete calendrier : filtrage par date + dentiste
-- Utilise par GET /api/rdv avec parametres date_debut, date_fin, dentiste_id
CREATE INDEX IF NOT EXISTS idx_rdv_date_dentiste
ON rendez_vous (date_heure, dentiste_id)
WHERE dentiste_id IS NOT NULL;