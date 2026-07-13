-- ============================================================
-- FIX RLS : Sécurisation de la table user_profiles
-- ============================================================

-- 1. Activer RLS sur la table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_admin" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_admin" ON user_profiles;

-- 3. Créer les nouvelles policies

-- Un utilisateur peut voir son propre profil
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Un admin peut voir tous les profils
CREATE POLICY "user_profiles_select_admin" ON user_profiles FOR SELECT
  USING (current_user_role() = 'admin');

-- Seul un admin peut modifier un profil (notamment is_active)
CREATE POLICY "user_profiles_update_admin" ON user_profiles FOR UPDATE
  USING (current_user_role() = 'admin');

-- Note: L'insertion des profils se fait actuellement via supabaseAdmin (service_role) 
-- dans admin.service.ts, ce qui bypass le RLS. Il n'est donc pas strictement nécessaire
-- de créer une policy d'INSERT pour l'instant.
