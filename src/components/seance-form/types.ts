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

export interface ActeMedical {
  id: string;
  libelle: string;
  prix_defaut: number;
}

export interface CatalogueActeItem {
  acteId: string;
  libelle: string;
  prix: number;
}

export interface LigneActeSaisie {
  cleTemporaire: string;
  acteId: string;
  libelle: string;
  quantite: number;
  prixApplique: number;
  dentsFdi: string[];
}

export interface NouvelleSeanceInput {
  seanceId?: string;
  patientId: string;
  dentisteId: string;
  dateHeure: string; // Adapté du 'date'
  observations: string;
  typeDenture: TypeDenture;
  actes: LigneActeSaisie[];
}
