-- ============================================================
-- SEED DATA
-- Insertion des données initiales essentielles
-- ============================================================

INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur) VALUES
  ('Consultation initiale', 'CONSULTATION', 30.00, 'Premier examen clinique complet', '#16A34A'),
  ('Consultation de contrôle', 'CONSULTATION', 23.00, 'Examen de suivi semestriel', '#16A34A'),
  ('Détartrage simple', 'CONSERVATEUR', 28.50, 'Détartrage supra-gingival manuel', '#0891B2'),
  ('Carie', 'CONSERVATEUR', 35.00, 'Traitement de carie dentaire', '#DC2626'),
  ('Obturation composite 1 face', 'CONSERVATEUR', 45.00, 'Résine composite 1 face (antérieure)', '#2563EB'),
  ('Obturation composite 2 faces', 'CONSERVATEUR', 62.00, 'Résine composite 2 faces', '#2563EB'),
  ('Traitement canalaire monorad.', 'ENDODONTIE', 120.00, 'Dépulpation + mise en forme + obturation', '#7C3AED'),
  ('Traitement canalaire multirad.', 'ENDODONTIE', 185.00, 'Molaire — 3 canaux ou plus', '#7C3AED'),
  ('Couronne céramique', 'PROTHESE', 450.00, 'Prothèse fixée tout céramique', '#CA8A04'),
  ('Couronne métallique', 'PROTHESE', 280.00, 'Prothèse fixée métal-céramique', '#CA8A04'),
  ('Bridge', 'PROTHESE', 850.00, 'Bridge fixe 3 éléments', '#EA580C'),
  ('Prothèse amovible partielle', 'PROTHESE', 650.00, 'Appareil partiel résine', '#EA580C'),
  ('Extraction', 'CHIRURGIE', 45.00, 'Extraction dentaire simple', '#475569'),
  ('Chirurgie extraction simple', 'CHIRURGIE', 45.00, 'Avulsion dent déchaussée ou mobile', '#475569'),
  ('Chirurgie extraction complexe', 'CHIRURGIE', 120.00, 'Dent incluse ou retenue', '#475569'),
  ('Implant', 'CHIRURGIE', 1200.00, 'Implant dentaire unitaire', '#4F46E5'),
  ('Blanchiment en cabinet', 'ESTHETIQUE', 250.00, 'Blanchiment professionnel lampe LED', '#DB2777'),
  ('Facette', 'ESTHETIQUE', 500.00, 'Facette céramique ou composite', '#DB2777'),
  ('Détartrage parodontal', 'PARODONTOLOGIE', 85.00, 'Surfaçage radiculaire par quadrant', '#0F766E'),
  ('Note', 'CONSULTATION', 0.00, 'Annotation non facturable sur une dent (observation, rappel, suivi)', '#94A3B8')
ON CONFLICT DO NOTHING;
