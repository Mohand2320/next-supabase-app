import type { RendezVous } from './rdv';
import type { UserProfile } from './user';

export type StatutQueue = 'EN_ATTENTE' | 'APPELE' | 'EN_CONSULTATION' | 'TERMINE' | 'ANNULE' | 'ABSENT';

export interface FileAttente {
  id: string;
  date_jour: string; // YYYY-MM-DD
  position: number;
  statut: StatutQueue;
  heure_arrivee: string; // ISO String
  
  patient_id: string | null;
  rdv_id: string | null;
  dentiste_id: string | null;
  
  // Pour Walk-ins
  nom_minimal: string | null;
  prenom_minimal: string | null;
  telephone_minimal: string | null;
  
  motif: string | null;
  observations: string | null;
  
  cree_par: string | null;
  
  created_at: string;
  updated_at: string;

  // Relations (jointures optionnelles selon la requête)
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string | null;
  } | null;
  rendez_vous?: RendezVous;
  createur?: UserProfile;
}

export interface AddToQueueDTO {
  patient_id?: string;
  rdv_id?: string;
  dentiste_id?: string;
  
  nom_minimal?: string;
  prenom_minimal?: string;
  telephone_minimal?: string;
  
  motif?: string;
  observations?: string;
}

export interface UpdateQueueStatusDTO {
  statut: StatutQueue;
}

export interface ReorderQueueDTO {
  items: { id: string; position: number }[];
}
