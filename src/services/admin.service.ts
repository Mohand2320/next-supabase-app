'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUserProfile } from './user.service';
import { revalidatePath } from 'next/cache';

export interface AdminUserListItem {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  role: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  specialite: string | null;
  login: string | null;
}

// Vérification de sécurité (Server side)
async function requireAdmin() {
  const { data } = await getCurrentUserProfile();
  if (!data || !data.profile.is_admin) {
    throw new Error('Non autorisé. Seul un administrateur peut effectuer cette action.');
  }
}

export async function getUsersList(): Promise<{ data: AdminUserListItem[] | null, error: string | null }> {
  try {
    await requireAdmin();

    // 1. Récupérer tous les profils (sans RLS via supabaseAdmin)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, role, is_active, is_admin, created_at, dentiste_id, assistant_id');

    if (profilesError) throw profilesError;

    // 2. Récupérer les emails et métadonnées depuis auth.admin.listUsers()
    // Attention: pagination max 50 par defaut, suffisant pour ~15 utilisateurs.
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
    
    if (authError) throw authError;

    // 3. Récupérer les noms depuis dentistes et assistants
    const { data: dentistes } = await supabaseAdmin.from('dentistes').select('id, nom, prenom, specialite');
    const { data: assistants } = await supabaseAdmin.from('assistants').select('id, nom, prenom, login');

    // 4. Fusionner les données
    const list: AdminUserListItem[] = (profiles || []).map(p => {
      const authUser = users.find(u => u.id === p.user_id);
      
      let nom = authUser?.user_metadata?.nom || null;
      let prenom = authUser?.user_metadata?.prenom || null;
      let specialite = null;
      let login = null;

      if (p.role === 'dentiste' && p.dentiste_id) {
        const d = dentistes?.find(x => x.id === p.dentiste_id);
        if (d) { nom = d.nom; prenom = d.prenom; specialite = d.specialite; }
      } else if (p.role === 'assistant' && p.assistant_id) {
        const a = assistants?.find(x => x.id === p.assistant_id);
        if (a) { nom = a.nom; prenom = a.prenom; login = a.login; }
      }

      return {
        id: p.user_id,
        email: authUser?.email || 'Email inconnu',
        nom,
        prenom,
        role: p.role,
        is_active: p.is_active,
        is_admin: p.is_admin,
        created_at: p.created_at,
        specialite,
        login
      };
    });

    // Trier par date de création (plus récent d'abord)
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { data: list, error: null };
  } catch (err: any) {
    console.error('[admin.service] getUsersList error:', err);
    return { data: null, error: err.message || 'Erreur lors de la récupération des utilisateurs' };
  }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<{ success: boolean, error: string | null }> {
  try {
    await requireAdmin();

    const newStatus = !currentStatus;
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_active: newStatus })
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/dashboard/utilisateurs');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[admin.service] toggleUserStatus error:', err);
    return { success: false, error: err.message || 'Erreur lors de la modification du statut' };
  }
}

export async function inviteUser(email: string, nom: string, prenom: string, role: 'dentiste' | 'assistant', specialiteOrLogin: string, isAdmin: boolean, password?: string): Promise<{ success: boolean, error: string | null }> {
  try {
    await requireAdmin();

    // 1. Créer l'utilisateur avec un mot de passe (évite la limite d'emails de Supabase)
    const defaultPassword = password || 'Cabinet2026!';
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Confirme directement l'email pour qu'ils puissent se connecter
      user_metadata: { nom, prenom }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erreur de création d'utilisateur");

    let dentisteId = null;
    let assistantId = null;

    if (role === 'dentiste') {
      const { data: dData, error: dError } = await supabaseAdmin.from('dentistes').insert({
        nom,
        prenom,
        specialite: specialiteOrLogin || null,
        numero_rpps: null
      }).select('id').single();

      if (dError) throw dError;
      dentisteId = dData.id;
    } else {
      const { data: aData, error: aError } = await supabaseAdmin.from('assistants').insert({
        nom,
        prenom,
        login: specialiteOrLogin
      }).select('id').single();

      if (aError) throw aError;
      assistantId = aData.id;
    }

    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      user_id: authData.user.id,
      role: role,
      dentiste_id: dentisteId,
      assistant_id: assistantId,
      is_active: true,
      is_admin: isAdmin
    });

    if (profileError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    revalidatePath('/dashboard/utilisateurs');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[admin.service] inviteUser error:', err);
    if (err.message && err.message.includes('already registered')) {
      return { success: false, error: 'Un utilisateur avec cet email existe déjà.' };
    }
    return { success: false, error: err.message || 'Erreur lors de l\'invitation' };
  }
}

export async function updateUser(
  userId: string,
  nom: string,
  prenom: string,
  specialiteOrLogin: string,
  isAdmin: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAdmin();

    // 1. Récupérer le profil actuel
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, dentiste_id, assistant_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) throw new Error("Profil introuvable");

    // 2. Mettre à jour metadata auth
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { nom, prenom }
    });

    // 3. Mettre à jour le profil (is_admin)
    await supabaseAdmin
      .from('user_profiles')
      .update({ is_admin: isAdmin })
      .eq('user_id', userId);

    // 4. Mettre à jour la table métier correspondante
    if (profile.role === 'dentiste' && profile.dentiste_id) {
      await supabaseAdmin
        .from('dentistes')
        .update({ nom, prenom, specialite: specialiteOrLogin })
        .eq('id', profile.dentiste_id);
    } else if (profile.role === 'assistant' && profile.assistant_id) {
      await supabaseAdmin
        .from('assistants')
        .update({ nom, prenom, login: specialiteOrLogin })
        .eq('id', profile.assistant_id);
    }

    revalidatePath('/dashboard/utilisateurs');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[admin.service] updateUser error:', err);
    return { success: false, error: err.message || "Erreur lors de la modification de l'utilisateur" };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAdmin();

    // La suppression dans auth.users entraîne la suppression en cascade dans user_profiles
    // L'enregistrement dentiste ou assistant est conservé pour l'historique (ON DELETE SET NULL)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) throw error;

    revalidatePath('/dashboard/utilisateurs');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[admin.service] deleteUser error:', err);
    return { success: false, error: err.message || "Erreur lors de la suppression de l'utilisateur" };
  }
}
