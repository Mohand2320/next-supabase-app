// Types natifs de react-odontogram (v0.5.6) — ne pas modifier
export type ToothDetail = {
  id: string;
  notations: { fdi: string; universal: string; palmer: string };
  type: string;
};
export type ToothConditionGroup = {
  label: string;
  teeth: string[];
  outlineColor: string;
  fillColor: string;
};

// Types métier DentiPro
export type TypeDenture = 'ENFANT' | 'ADULTE';

/** Seuil d'âge (en années) en dessous duquel on initialise la denture sur ENFANT.
 *  Dentition mixte généralement jusqu'à 12-13 ans.
 *  À rendre configurable si le cabinet le souhaite. */
export const SEUIL_AGE_ENFANT = 13;

export interface ActeMedical {
  id: string;
  libelle: string;
  prix_defaut: number;
  couleur: string | null;
}

export interface CatalogueActeItem {
  acteId: string;
  libelle: string;
  prix: number;
  couleur: string;
}

export interface LigneActeSaisie {
  cleTemporaire: string;
  acteId: string;
  libelle: string;
  quantite: number;
  prixApplique: number;
  dentsFdi: string[];
  couleur: string;
}

export interface NouvelleSeanceInput {
  seanceId?: string;
  patientId: string;
  dentisteId: string;
  dateHeure: string;
  observations: string;
  typeDenture: TypeDenture;
  actes: LigneActeSaisie[];
}

/** Info patient minimales passées au formulaire (Server → Client). */
export interface PatientSeanceInfo {
  nom: string;
  prenom: string;
  dateNaissance: string | null;
}

// ─── Devise ──────────────────────────────────────────────────
/** Devise utilisée dans l'application. Centralisée ici pour cohérence globale. */
export const DEVISE = 'DA';

/**
 * Formate un montant numérique avec la devise DentiPro.
 * Ex: formatMontant(1500) → "1 500.00 DA"
 */
export function formatMontant(valeur: number): string {
  return `${valeur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${DEVISE}`;
}

// ─── Calcul denture ─────────────────────────────────────────
/**
 * Calcule l'âge d'un patient à partir de sa date de naissance.
 * Retourne null si la date est absente ou invalide.
 */
export function calculerAge(dateNaissance: string | null | undefined): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const moisDiff = today.getMonth() - birth.getMonth();
  if (moisDiff < 0 || (moisDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Détermine le type de denture initial à partir de la date de naissance.
 * Retourne 'ENFANT' si âge < SEUIL_AGE_ENFANT, 'ADULTE' sinon ou par défaut.
 */
export function determinerDentureInitiale(dateNaissance: string | null | undefined): TypeDenture {
  const age = calculerAge(dateNaissance);
  if (age === null) return 'ADULTE';
  return age < SEUIL_AGE_ENFANT ? 'ENFANT' : 'ADULTE';
}

/** Couleur par défaut si un acte n'en a pas (gris neutre). */
export const COULEUR_DEFAUT = '#64748B';
