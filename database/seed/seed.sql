-- ============================================================
-- SEED DATA
-- Insertion des données initiales essentielles
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
