import { createClientServer } from '@/lib/supabase/server';
import { Role, hasRole } from './permissions';

export interface GuardResult {
  isAuthorized: boolean;
  user: any | null;
  profile: any | null;
  error: string | null;
}

/**
 * Vérifie si l'utilisateur courant possède l'un des rôles autorisés.
 * À utiliser dans les Server Actions et Route Handlers.
 */
export async function requireRoles(allowedRoles: Role[]): Promise<GuardResult> {
  try {
    const supabase = await createClientServer();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAuthorized: false, user: null, profile: null, error: 'Non authentifié' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAuthorized: false, user, profile: null, error: 'Profil introuvable' };
    }

    if (!profile.is_active) {
      return { isAuthorized: false, user, profile, error: 'Compte désactivé' };
    }

    if (!hasRole(profile.role, allowedRoles)) {
      return { isAuthorized: false, user, profile, error: 'Accès non autorisé pour ce rôle' };
    }

    return { isAuthorized: true, user, profile, error: null };
  } catch (err: any) {
    console.error('[requireRoles] Erreur:', err);
    return { isAuthorized: false, user: null, profile: null, error: 'Erreur serveur' };
  }
}
