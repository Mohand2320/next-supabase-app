// ============================================================
// Types — Module Agenda (Rendez-vous)
// ============================================================

// --- Enums ---

export type StatutRDV = 'PLANIFIE' | 'CONFIRME' | 'TERMINE' | 'ANNULE';
export type OrigineAnnulation = 'PATIENT' | 'CABINET';
export type CalendarView = 'day' | 'week' | 'month';

// --- Transitions autorisées ---

export const TRANSITIONS_AUTORISEES: Record<StatutRDV, StatutRDV[]> = {
  PLANIFIE: ['CONFIRME', 'ANNULE', 'TERMINE'],
  CONFIRME: ['TERMINE', 'ANNULE'],
  TERMINE: [],  // état terminal
  ANNULE: [],   // état terminal
};

// --- Labels & Couleurs statuts ---

export const STATUT_LABELS: Record<StatutRDV, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const STATUT_COLORS: Record<StatutRDV, { bg: string; text: string; border: string }> = {
  PLANIFIE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CONFIRME: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  TERMINE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ANNULE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const ORIGINE_LABELS: Record<OrigineAnnulation, string> = {
  PATIENT: 'Annulé par le patient',
  CABINET: 'Annulé par le cabinet',
};

// --- Entité principale ---

export interface RendezVous {
  id: string;
  patient_id: string | null;
  nom_minimal: string | null;
  prenom_minimal: string | null;
  telephone_minimal: string | null;
  dentiste_id?: string | null;
  date_heure: string;          // ISO 8601
  duree: number;               // minutes
  statut: StatutRDV;
  origine_annulation: OrigineAnnulation | null;
  motif: string | null;
  observation: string | null;
  couleur: string;
  seance_id: string | null;
  cree_par: string | null;
  modifie_par: string | null;
  created_at: string;
  updated_at: string;
  // Données jointes (optionnelles, pour l'affichage)
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string | null;
  } | null;
  dentiste?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

// --- Variante du RDV ---

export type RdvVariante = 'RDV_STANDARD' | 'RDV_MINIMAL';

export function getRdvVariante(rdv: RendezVous): RdvVariante {
  return rdv.patient_id ? 'RDV_STANDARD' : 'RDV_MINIMAL';
}

export function getDisplayName(rdv: RendezVous): string {
  if (rdv.patient) {
    return `${rdv.patient.prenom} ${rdv.patient.nom}`;
  }
  if (rdv.prenom_minimal && rdv.nom_minimal) {
    return `${rdv.prenom_minimal} ${rdv.nom_minimal}`;
  }
  return rdv.nom_minimal || 'Patient inconnu';
}

export function getDisplayPhone(rdv: RendezVous): string | null {
  if (rdv.patient?.telephone) return rdv.patient.telephone;
  return rdv.telephone_minimal;
}

// --- Création ---

export interface RdvCreatePayload {
  // RDV_STANDARD
  patient_id?: string | null;
  // RDV_MINIMAL
  nom_minimal?: string | null;
  prenom_minimal?: string | null;
  telephone_minimal?: string | null;
  // Commun
  dentiste_id?: string | null;
  date_heure: string;
  duree: number;
  motif?: string | null;
  observation?: string | null;
  couleur?: string;
}

export interface RdvUpdatePayload {
  date_heure?: string;
  duree?: number;
  motif?: string | null;
  observation?: string | null;
  couleur?: string;
}

// --- Transition de statut ---

export interface RdvStatusTransitionPayload {
  nouveau_statut: StatutRDV;
  origine_annulation?: OrigineAnnulation;
}

export interface RdvStatusTransitionResponse {
  rdv: RendezVous;
  seance_id?: string | null;
  conversion_proposee?: boolean;
  candidats_patients?: Array<{
    id: string;
    nom: string;
    prenom: string;
    telephone: string | null;
  }>;
}

// --- Conversion RDV_MINIMAL → Patient ---

export interface RdvConvertPatientPayload {
  action: 'link_existing' | 'create_new';
  patient_id?: string;          // si action = link_existing
  patient_data?: {              // si action = create_new
    nom: string;
    prenom: string;
    telephone?: string;
    date_naissance?: string;
    sexe?: 'M' | 'F';
  };
}

// --- Filtres calendrier ---

export interface RdvCalendarFilters {
  date_debut: string;  // ISO date
  date_fin: string;    // ISO date
  dentiste_id?: string;
  statut?: StatutRDV[];
}

// --- Helpers date pour calendrier ---

export function computeEndTime(dateHeure: string, dureeMinutes: number): Date {
  const start = new Date(dateHeure);
  return new Date(start.getTime() + dureeMinutes * 60 * 1000);
}

export function formatHeure(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
