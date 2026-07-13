-- ============================================================
-- MIGRATION: Ajout de la gestion des Administrateurs
-- ============================================================

-- 1. Ajout de la colonne is_active pour gérer l'état du compte (activé/désactivé)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Mise à jour de la contrainte CHECK sur les rôles pour inclure 'admin'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('dentiste', 'assistant', 'admin'));

-- 3. Mise à jour de la contrainte one_role_only pour gérer le rôle 'admin'
-- Un administrateur n'a ni dentiste_id ni assistant_id
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS one_role_only;

ALTER TABLE user_profiles 
ADD CONSTRAINT one_role_only CHECK (
  (role = 'dentiste' AND dentiste_id IS NOT NULL AND assistant_id IS NULL) OR
  (role = 'assistant' AND assistant_id IS NOT NULL AND dentiste_id IS NULL) OR
  (role = 'admin' AND dentiste_id IS NULL AND assistant_id IS NULL)
);

-- ============================================================
-- INSTRUCTION POUR LE PREMIER ADMINISTRATEUR
-- ============================================================
-- Pour créer le premier administrateur, exécutez la commande suivante
-- dans le SQL Editor de Supabase en remplaçant 'UUID_ICI' par votre ID (auth.users) :
--
-- UPDATE user_profiles SET role = 'admin' WHERE user_id = 'UUID_ICI';
-- ============================================================
