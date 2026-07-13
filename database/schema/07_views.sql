-- ============================================================
-- 07. VUES
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
