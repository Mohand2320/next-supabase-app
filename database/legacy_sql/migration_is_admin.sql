-- ============================================================
-- MIGRATION: Remplacement du rôle 'admin' par le booléen is_admin
-- ============================================================
-- À exécuter dans le SQL Editor de Supabase
-- Cette migration est NON DESTRUCTIVE et peut être exécutée plusieurs fois.
-- ============================================================

-- 1. Ajouter la colonne is_admin
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Migrer les utilisateurs ayant le rôle 'admin' → marquer is_admin = true
-- NOTE: Ces utilisateurs devront ensuite être recréés avec un vrai rôle métier
-- (dentiste ou assistant) car un admin pur n'a pas de données métier.
UPDATE user_profiles SET is_admin = true WHERE role = 'admin';

-- 3. S'assurer que is_active existe (ajouté par la migration précédente)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 4. Supprimer les anciennes contraintes
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS one_role_only;

-- 5. Remettre la contrainte role SANS 'admin'
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('dentiste', 'assistant'));

-- 6. Remettre la contrainte one_role_only SANS le cas admin
ALTER TABLE user_profiles 
ADD CONSTRAINT one_role_only CHECK (
  (role = 'dentiste' AND dentiste_id IS NOT NULL AND assistant_id IS NULL) OR
  (role = 'assistant' AND assistant_id IS NOT NULL AND dentiste_id IS NULL)
);

-- ============================================================
-- 7. RLS sur user_profiles (idempotent)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_admin" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Chaque utilisateur peut lire son propre profil
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Un is_admin peut lire tous les profils
CREATE POLICY "user_profiles_select_admin" ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- Un is_admin peut modifier les profils (toggle is_active, etc.)
CREATE POLICY "user_profiles_update_admin" ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- ============================================================
-- 8. NETTOYAGE : Supprimer les comptes admin purs (OPTIONNEL)
-- ============================================================
-- Les comptes ayant role='admin' violeront la nouvelle contrainte.
-- Vous devez soit :
--   A) Les supprimer (si ce sont des comptes de test)
--   B) Les migrer vers un vrai rôle (dentiste ou assistant)
--
-- Pour les SUPPRIMER :
-- DELETE FROM user_profiles WHERE role = 'admin';
--
-- Pour les MIGRER vers assistant (exemple) :
-- 1. Créer l'entrée assistant :
--    INSERT INTO assistants (id, nom, prenom, login) 
--    VALUES (gen_random_uuid(), 'NOM', 'PRENOM', 'login_unique')
--    RETURNING id;
-- 2. Mettre à jour le profil :
--    UPDATE user_profiles 
--    SET role = 'assistant', assistant_id = 'ID_RETOURNÉ'
--    WHERE user_id = 'ID_USER';

-- ============================================================
-- INSTRUCTION POUR VOTRE COMPTE (amoura)
-- ============================================================
-- Après avoir créé votre profil dentiste (voir add role to user.txt),
-- exécutez simplement :
--
-- UPDATE user_profiles SET is_admin = true 
-- WHERE user_id = '5a0cc048-6400-4a50-a451-b2852e4286a7';
--
-- Vous serez alors Dentiste + Administrateur.
-- ============================================================
