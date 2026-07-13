-- ============================================================
-- 09. MODULE FEUILLE DE SOINS (SEANCE & ACTES)
-- ============================================================

-- 1. Ajout de la colonne localisation dans la table pivot (si elle n'existe pas)
-- Cela permet de savoir quelles dents spécifiques ont été traitées pour un acte donné.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='seance_actes' AND column_name='localisation') THEN
    ALTER TABLE seance_actes ADD COLUMN localisation TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- 2. Création de la fonction RPC pour enregistrement atomique
CREATE OR REPLACE FUNCTION enregistrer_feuille_de_soins(
  p_seance_id UUID,
  p_patient_id UUID,
  p_dentiste_id UUID,
  p_date_heure TIMESTAMPTZ,
  p_observations TEXT,
  p_type_denture type_denture_enum,
  p_localisation TEXT[],
  p_actes JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seance_id UUID;
  v_acte_item JSONB;
  v_total NUMERIC(10,2) := 0;
  v_acte_prix NUMERIC(10,2);
  v_acte_quantite INTEGER;
  v_acte_local TEXT[];
BEGIN
  -- Vérification: p_actes ne doit pas être vide
  IF jsonb_array_length(p_actes) = 0 THEN
    RAISE EXCEPTION 'Impossible d''enregistrer une feuille de soins sans actes.';
  END IF;

  -- A. Gérer la création ou mise à jour de la séance
  IF p_seance_id IS NULL THEN
    -- Insertion d'une nouvelle séance
    INSERT INTO seances (
      patient_id, 
      dentiste_id, 
      date_heure, 
      observations, 
      type_denture, 
      localisation, 
      prix
    )
    VALUES (
      p_patient_id, 
      p_dentiste_id, 
      p_date_heure, 
      p_observations, 
      p_type_denture, 
      p_localisation, 
      0
    )
    RETURNING id INTO v_seance_id;
  ELSE
    -- Mise à jour d'une séance existante
    -- Vérifier que le patient correspond bien
    IF NOT EXISTS (SELECT 1 FROM seances WHERE id = p_seance_id AND patient_id = p_patient_id) THEN
      RAISE EXCEPTION 'La séance spécifiée n''appartient pas au patient (ou n''existe pas).';
    END IF;

    UPDATE seances
    SET observations = p_observations,
        type_denture = p_type_denture,
        localisation = p_localisation,
        date_heure = p_date_heure,
        dentiste_id = p_dentiste_id
    WHERE id = p_seance_id;
    
    v_seance_id := p_seance_id;

    -- Nettoyer les anciens actes pour repartir sur une base propre
    DELETE FROM seance_actes WHERE seance_id = v_seance_id;
  END IF;

  -- B. Boucler sur les actes pour les insérer et calculer le total
  FOR v_acte_item IN SELECT * FROM jsonb_array_elements(p_actes)
  LOOP
    v_acte_prix := (v_acte_item->>'prix_applique')::NUMERIC;
    v_acte_quantite := (v_acte_item->>'quantite')::INTEGER;
    
    -- Extraire le tableau de texte pour localisation
    SELECT array_agg(elem) INTO v_acte_local
    FROM jsonb_array_elements_text(v_acte_item->'localisation') AS elem;
    
    IF v_acte_local IS NULL THEN
      v_acte_local := '{}'::TEXT[];
    END IF;

    INSERT INTO seance_actes (
      seance_id, 
      acte_id, 
      quantite, 
      prix_applique, 
      localisation
    )
    VALUES (
      v_seance_id, 
      (v_acte_item->>'acte_id')::UUID, 
      v_acte_quantite, 
      v_acte_prix, 
      v_acte_local
    );

    v_total := v_total + (v_acte_prix * v_acte_quantite);
  END LOOP;

  -- C. Mettre à jour le prix total de la séance
  UPDATE seances
  SET prix = v_total
  WHERE id = v_seance_id;

  RETURN v_seance_id;
END;
$$;

COMMENT ON FUNCTION enregistrer_feuille_de_soins IS 'Insère/Met à jour atomiquement une séance et la liste de ses actes.';

-- 3. Si des policies de sécurité sont nécessaires pour la fonction RPC, elles sont gérées
-- implicitement car le SECURITY DEFINER exécute le code avec les privilèges de l'owner de la fonction.
-- Le contrôle est fait côté applicatif et par RLS au niveau du reste de la BDD.
