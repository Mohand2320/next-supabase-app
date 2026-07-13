-- ============================================================
-- 05. FONCTIONS
-- ============================================================

-- ─── UTILITAIRES SYSTÈME ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── FONCTIONS D'AIDE RLS ────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_dentiste_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT dentiste_id FROM user_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_admin FROM user_profiles WHERE user_id = auth.uid();
$$;

-- ─── FONCTIONS MÉTIER ────────────────────────────────────────
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
