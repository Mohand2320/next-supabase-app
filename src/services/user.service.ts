'use server';

import { createClientServer } from '@/lib/supabase/server';
import type { CurrentUserData, UpdateProfileInput } from '@/types/user';
import { revalidatePath } from 'next/cache';

export async function getCurrentUserProfile(): Promise<{ data: CurrentUserData | null, error: string | null }> {
  try {
    console.log('[getCurrentUserProfile] Démarrage de la récupération du profil...');
    const supabase = await createClientServer();
    
    // 1. Vérification de la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('[getCurrentUserProfile] Aucune session active ou session expirée.');
      return { data: null, error: 'Session expirée' };
    }

    // 2. Récupération de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('[getCurrentUserProfile] Utilisateur non connecté.');
      return { data: null, error: 'Utilisateur non connecté' };
    }

    console.log(`[getCurrentUserProfile] Utilisateur authentifié: ${user.id} (Email: ${user.email})`);

    // 3. Récupération du profil de base (user_profiles)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Utilisation de maybeSingle pour éviter PGRST116 (0 rows)

    if (profileError) {
      console.error('[getCurrentUserProfile] Erreur Supabase (user_profiles):', profileError);
      return { data: null, error: 'Erreur de chargement des données (user_profiles)' };
    }

    if (!profile) {
      console.log(`[getCurrentUserProfile] Aucun profil dans user_profiles pour l'ID: ${user.id}`);
      return { data: null, error: 'Profil utilisateur inexistant' };
    }

    console.log(`[getCurrentUserProfile] Profil de base trouvé. Rôle: ${profile.role}`);

    // 4. Récupération des données métier selon le rôle
    if (profile.role === 'dentiste') {
      if (!profile.dentiste_id) {
        console.warn('[getCurrentUserProfile] dentiste_id manquant dans user_profiles.');
        return { data: null, error: 'Profil métier introuvable (dentiste_id manquant)' };
      }

      const { data: dentiste, error: dentisteError } = await supabase
        .from('dentistes')
        .select('*')
        .eq('id', profile.dentiste_id)
        .maybeSingle();
        
      if (dentisteError) {
        console.error('[getCurrentUserProfile] Erreur Supabase (dentistes):', dentisteError);
        return { data: null, error: 'Erreur de chargement des données (dentistes)' };
      }

      if (!dentiste) {
        console.warn(`[getCurrentUserProfile] Aucun dentiste trouvé avec l'ID: ${profile.dentiste_id}`);
        return { data: null, error: 'Profil métier introuvable' };
      }

      console.log('[getCurrentUserProfile] Succès : Données dentiste récupérées.');
      return { data: { role: 'dentiste', email: user.email || '', profile, data: dentiste }, error: null };
    }

    if (profile.role === 'assistant') {
      if (!profile.assistant_id) {
        console.warn('[getCurrentUserProfile] assistant_id manquant dans user_profiles.');
        return { data: null, error: 'Profil métier introuvable (assistant_id manquant)' };
      }

      const { data: assistant, error: assistantError } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', profile.assistant_id)
        .maybeSingle();
        
      if (assistantError) {
        console.error('[getCurrentUserProfile] Erreur Supabase (assistants):', assistantError);
        return { data: null, error: 'Erreur de chargement des données (assistants)' };
      }

      if (!assistant) {
        console.warn(`[getCurrentUserProfile] Aucun assistant trouvé avec l'ID: ${profile.assistant_id}`);
        return { data: null, error: 'Profil métier introuvable' };
      }

      console.log('[getCurrentUserProfile] Succès : Données assistant récupérées.');
      return { data: { role: 'assistant', email: user.email || '', profile, data: assistant }, error: null };
    }

    console.warn('[getCurrentUserProfile] Mapping incorrect des données : Rôle inconnu', profile.role);
    return { data: null, error: 'Mapping incorrect des données' };
  } catch (error) {
    console.error('[getCurrentUserProfile] Erreur inattendue:', error);
    return { data: null, error: 'Erreur de chargement des données' };
  }
}

export async function updateUserProfile(input: UpdateProfileInput): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Non authentifié' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Profil de base introuvable' };
    }

    if (profile.role === 'dentiste' && profile.dentiste_id) {
      const updateData: any = {};
      if (input.nom !== undefined) updateData.nom = input.nom;
      if (input.prenom !== undefined) updateData.prenom = input.prenom;
      if (input.specialite !== undefined) updateData.specialite = input.specialite;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('dentistes')
        .update(updateData)
        .eq('id', profile.dentiste_id);

      if (updateError) return { success: false, error: 'Erreur lors de la mise à jour des données dentiste' };
    } else if (profile.role === 'assistant' && profile.assistant_id) {
      const updateData: any = {};
      if (input.nom !== undefined) updateData.nom = input.nom;
      if (input.prenom !== undefined) updateData.prenom = input.prenom;
      if (input.login !== undefined) updateData.login = input.login;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('assistants')
        .update(updateData)
        .eq('id', profile.assistant_id);

      if (updateError) return { success: false, error: 'Erreur lors de la mise à jour des données assistant' };
    } else {
      return { success: false, error: 'Opération impossible : Profil mal configuré' };
    }

    revalidatePath('/dashboard/profile');
    return { success: true, error: null };
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return { success: false, error: 'Erreur serveur inattendue' };
  }
}

export async function initUserProfile(role: 'dentiste' | 'assistant', nom: string, prenom: string, loginOuSpe: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return { success: false, error: 'Non authentifié' };

    // Verifier s'il a deja un profil
    const { data: existing } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (existing) return { success: false, error: 'Vous avez déjà un profil.' };

    if (role === 'dentiste') {
      const { data: dData, error: dErr } = await supabase.from('dentistes').insert({
        nom, prenom, specialite: loginOuSpe, numero_rpps: null
      }).select('id').single();
      
      if (dErr || !dData) return { success: false, error: 'Erreur création dentiste' };

      const { error: pErr } = await supabase.from('user_profiles').insert({
        user_id: user.id, role: 'dentiste', dentiste_id: dData.id
      });
      if (pErr) return { success: false, error: 'Erreur liaison profil dentiste' };

    } else {
      const { data: aData, error: aErr } = await supabase.from('assistants').insert({
        nom, prenom, login: loginOuSpe
      }).select('id').single();

      if (aErr || !aData) return { success: false, error: 'Erreur création assistant' };

      const { error: pErr } = await supabase.from('user_profiles').insert({
        user_id: user.id, role: 'assistant', assistant_id: aData.id
      });
      if (pErr) return { success: false, error: 'Erreur liaison profil assistant' };
    }

    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Erreur inattendue' };
  }
}
