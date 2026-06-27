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
  created_at: string;
}

// Vérification de sécurité (Server side)
async function requireAdmin() {
  const { data } = await getCurrentUserProfile();
  if (!data || data.role !== 'admin') {
    throw new Error('Non autorisé. Seul un administrateur peut effectuer cette action.');
  }
}

export async function getUsersList(): Promise<{ data: AdminUserListItem[] | null, error: string | null }> {
  try {
    await requireAdmin();

    // 1. Récupérer tous les profils (sans RLS via supabaseAdmin)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, role, is_active, created_at, dentiste_id, assistant_id');

    if (profilesError) throw profilesError;

    // 2. Récupérer les emails et métadonnées depuis auth.admin.listUsers()
    // Attention: pagination max 50 par defaut, suffisant pour ~15 utilisateurs.
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
    
    if (authError) throw authError;

    // 3. Récupérer les noms depuis dentistes et assistants
    const { data: dentistes } = await supabaseAdmin.from('dentistes').select('id, nom, prenom');
    const { data: assistants } = await supabaseAdmin.from('assistants').select('id, nom, prenom');

    // 4. Fusionner les données
    const list: AdminUserListItem[] = (profiles || []).map(p => {
      const authUser = users.find(u => u.id === p.user_id);
      
      let nom = authUser?.user_metadata?.nom || null;
      let prenom = authUser?.user_metadata?.prenom || null;

      if (p.role === 'dentiste' && p.dentiste_id) {
        const d = dentistes?.find(x => x.id === p.dentiste_id);
        if (d) { nom = d.nom; prenom = d.prenom; }
      } else if (p.role === 'assistant' && p.assistant_id) {
        const a = assistants?.find(x => x.id === p.assistant_id);
        if (a) { nom = a.nom; prenom = a.prenom; }
      } else if (p.role === 'admin' && authUser?.user_metadata?.full_name) {
        // Fallback si on a mis full_name (selon approche simplifiée)
        nom = authUser.user_metadata.full_name;
      }

      return {
        id: p.user_id,
        email: authUser?.email || 'Email inconnu',
        nom,
        prenom,
        role: p.role,
        is_active: p.is_active,
        created_at: p.created_at,
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

export async function inviteUser(email: string, nom: string, role: 'user' | 'admin'): Promise<{ success: boolean, error: string | null }> {
  try {
    await requireAdmin();

    // 1. Créer l'utilisateur (Supabase envoie l'email automatiquement)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { full_name: nom }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erreur de création d'utilisateur");

    // 2. Insérer le profil (l'utilisateur est créé mais doit finir son onboarding s'il est dentiste/assistant)
    // Ici, le rôle initial est 'admin' ou autre. Si c'est 'user', il est sans doute 'assistant' par défaut ou 'dentiste'.
    // Puisque le plan dit : "L'administrateur saisit uniquement nom + email + rôle (user/admin)"
    // On va stocker 'admin' ou 'assistant' (on peut considérer 'user' = 'assistant' pour le moment, ou un rôle générique).
    // D'après le DB schema, role DOIT être dans ('dentiste', 'assistant', 'admin').
    // Si role === 'user' dans la modal, on l'assimile à 'assistant' par défaut, qui pourra être changé.
    const dbRole = role === 'admin' ? 'admin' : 'assistant';

    let assistantId = null;

    // Si on le crée comme assistant, créons l'entrée assistants pour avoir son nom
    if (dbRole === 'assistant') {
      const { data: astData, error: astError } = await supabaseAdmin.from('assistants').insert({
        nom,
        prenom: '',
        login: email.split('@')[0]
      }).select('id').single();

      if (astError) throw astError;
      assistantId = astData.id;
    }

    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      user_id: authData.user.id,
      role: dbRole,
      assistant_id: assistantId,
      is_active: true
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
