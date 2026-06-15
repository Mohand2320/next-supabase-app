export interface UserProfile {
  user_id: string;
  role: 'dentiste' | 'assistant';
  dentiste_id: string | null;
  assistant_id: string | null;
  created_at: string;
}

export interface Dentiste {
  id: string;
  nom: string;
  prenom: string;
  specialite: string | null;
  numero_rpps: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  nom: string;
  prenom: string;
  login: string;
  created_at: string;
  updated_at: string;
}

export type CurrentUserData = 
  | { role: 'dentiste'; email: string; profile: UserProfile; data: Dentiste }
  | { role: 'assistant'; email: string; profile: UserProfile; data: Assistant };

export interface UpdateProfileInput {
  nom?: string;
  prenom?: string;
  specialite?: string; // Spécifique au dentiste
  login?: string; // Spécifique à l'assistant
}
