  -- ============================================================
  -- 10. AJOUT COLONNE COULEUR + COMPLÉTION CATALOGUE ACTES
  -- ============================================================

  -- 1. Ajout de la colonne couleur (format hex) sur actes_medicaux
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='actes_medicaux' AND column_name='couleur') THEN
      ALTER TABLE actes_medicaux ADD COLUMN couleur TEXT DEFAULT NULL;
    END IF;
  END $$;

  COMMENT ON COLUMN actes_medicaux.couleur IS 'Code couleur hex (#RRGGBB) pour l''affichage dans l''odontogramme et les badges';

  -- 2. Mise à jour des couleurs pour les actes EXISTANTS
  -- (ON CONFLICT n'existe pas pour UPDATE, on fait des UPDATE conditionnels)

  -- Consultations → vert sauge
  UPDATE actes_medicaux SET couleur = '#16A34A' WHERE libelle ILIKE '%consultation%' AND couleur IS NULL;

  -- Détartrages → cyan
  UPDATE actes_medicaux SET couleur = '#0891B2' WHERE libelle ILIKE '%détartrage%' AND couleur IS NULL;

  -- Obturations → bleu
  UPDATE actes_medicaux SET couleur = '#2563EB' WHERE libelle ILIKE '%obturation%' AND couleur IS NULL;

  -- Traitements canalaires → violet
  UPDATE actes_medicaux SET couleur = '#7C3AED' WHERE libelle ILIKE '%canalaire%' AND couleur IS NULL;

  -- Couronnes → or
  UPDATE actes_medicaux SET couleur = '#CA8A04' WHERE libelle ILIKE '%couronne%' AND couleur IS NULL;

  -- Prothèses → orange
  UPDATE actes_medicaux SET couleur = '#EA580C' WHERE libelle ILIKE '%prothèse%' AND couleur IS NULL;

  -- Chirurgie / Extractions → gris ardoise
  UPDATE actes_medicaux SET couleur = '#475569' WHERE libelle ILIKE '%extraction%' OR libelle ILIKE '%chirurgie%' AND couleur IS NULL;

  -- Blanchiment → rose
  UPDATE actes_medicaux SET couleur = '#DB2777' WHERE libelle ILIKE '%blanchiment%' AND couleur IS NULL;

  -- Parodontologie → teal foncé (différent du teal-600 des boutons)
  UPDATE actes_medicaux SET couleur = '#0F766E' WHERE libelle ILIKE '%parodont%' AND couleur IS NULL;

  -- Tout acte restant sans couleur → gris neutre
  UPDATE actes_medicaux SET couleur = '#64748B' WHERE couleur IS NULL;

  -- 3. Insertion des actes manquants (avec vérification par libellé pour éviter les doublons)
  -- On utilise INSERT ... WHERE NOT EXISTS pour être idempotent.

  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Carie', 'CONSERVATEUR', 35.00, 'Traitement de carie dentaire', '#DC2626'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle ILIKE '%carie%');

  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Extraction', 'CHIRURGIE', 45.00, 'Extraction dentaire simple', '#475569'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle = 'Extraction');

  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Bridge', 'PROTHESE', 850.00, 'Bridge fixe 3 éléments', '#EA580C'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle ILIKE '%bridge%');

  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Implant', 'CHIRURGIE', 1200.00, 'Implant dentaire unitaire', '#4F46E5'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle ILIKE '%implant%');

  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Facette', 'ESTHETIQUE', 500.00, 'Facette céramique ou composite', '#DB2777'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle ILIKE '%facette%');

  -- Note : acte non facturable, utilisé pour annoter une dent sans soin réalisé
  INSERT INTO actes_medicaux (libelle, categorie, prix_defaut, description, couleur)
  SELECT 'Note', 'CONSULTATION', 0.00, 'Annotation non facturable sur une dent (observation, rappel, suivi)', '#94A3B8'
  WHERE NOT EXISTS (SELECT 1 FROM actes_medicaux WHERE libelle = 'Note');

  -- Les actes suivants existent probablement déjà dans le seed :
  -- - Obturation → déjà "Obturation composite 1/2 faces"
  -- - Couronne → déjà "Couronne céramique/métallique"  
  -- - Traitement canalaire → déjà "Traitement canalaire monorad./multirad."
  -- On ne les réinsère donc pas pour éviter les doublons.
