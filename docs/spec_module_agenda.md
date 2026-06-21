# SPECIFICATION — Module Agenda (Gestion des Rendez-vous)

> **Document destiné à un agent IA de génération de code.**
> Ce document est la source de vérité fonctionnelle pour l'implémentation du module Agenda. Toute génération de code (entités, services, UI, règles de validation) doit s'y conformer strictement. Ne pas inventer de règle, de statut, de champ ou de comportement non listé ici. Si une information nécessaire à l'implémentation est absente, la signaler explicitement plutôt que de supposer.

---

## 1. CONTEXTE

- **Application** : gestion de cabinet dentaire
- **Module** : Agenda / Gestion des Rendez-vous
- **Stack cible** : Next.js / Supabase (PostgreSQL) / Vercel
- **Modules liés** : `Module Patient` (dossier patient), `Module Traitement` (fiche traitement, séance médicale)
- **Type de gestion** : 100% manuelle, interne au cabinet. Aucun acteur externe (patient) n'a de compte ni d'action directe dans le système.

---

## 2. ACTEURS

| Acteur | Code | Permissions sur le module Agenda |
|---|---|---|
| Assistante | `ASSISTANT` | Toutes les actions du module (création, confirmation, annulation, clôture) |
| Médecin | `DOCTOR` | Identiques à `ASSISTANT` sur ce module — **aucune action n'est restreinte à un rôle en particulier dans le module Agenda** |
| Patient | — | **N'est jamais un acteur système.** Aucun compte, aucune action, aucun accès. Tout contact (confirmation, annulation) passe par un canal externe (téléphone, visite physique) relayé manuellement par `ASSISTANT` ou `DOCTOR`. |

**Règle de permission globale (hors périmètre Agenda)** : `DOCTOR` a un niveau d'autorisation supérieur à `ASSISTANT` dans l'application au sens large (autres modules), mais cette hiérarchie n'introduit **aucune restriction ni privilège différencié** à l'intérieur du module Agenda. Les deux rôles sont fonctionnellement équivalents ici.

⚠️ **Ne pas générer de contrôle d'accès différencié entre `ASSISTANT` et `DOCTOR` sur les endpoints/actions du module Agenda.**

---

## 3. ENTITÉ : Rendez-vous (RDV)

### 3.1 Deux variantes de RDV (même entité, complétude des données différente)

| Variante | Déclencheur | Données minimales requises | Lien patient |
|---|---|---|---|
| `RDV_STANDARD` | Patient déjà présent dans la base | Patient sélectionné (référence FK), date, heure | FK obligatoire vers `Patient` |
| `RDV_MINIMAL` | Patient inconnu / non-fiché | Nom, téléphone, date, heure | Aucune FK vers `Patient` (champ nullable) |

**Règle métier** : un `RDV_MINIMAL` doit pouvoir être créé sans qu'aucune fiche `Patient` n'existe en base. Ce n'est pas un cas d'erreur — c'est un parcours nominal et fréquent (premier appel téléphonique d'un nouveau patient).

### 3.2 Champs (vue logique, à adapter au schéma Supabase existant)

```
RendezVous {
  id: UUID
  patient_id: UUID | NULL          // NULL si RDV_MINIMAL non converti
  nom_minimal: string | NULL        // requis si patient_id est NULL
  telephone_minimal: string | NULL  // requis si patient_id est NULL
  date_heure_debut: timestamp
  date_heure_fin: timestamp | NULL
  statut: enum(STATUT_RDV)          // voir section 4
  origine_annulation: enum(ORIGINE_ANNULATION) | NULL  // renseigné uniquement si statut = ANNULE
  cree_par: UUID (FK -> Utilisateur)  // ASSISTANT ou DOCTOR
  cree_le: timestamp
  modifie_par: UUID (FK -> Utilisateur)
  modifie_le: timestamp
}
```

⚠️ **Contrainte d'intégrité à générer** : `patient_id IS NOT NULL OR (nom_minimal IS NOT NULL AND telephone_minimal IS NOT NULL)` — un RDV doit toujours avoir soit un patient lié, soit les infos minimales.

---

## 4. MACHINE À ÉTATS — STATUT_RDV

### 4.1 États (4, exhaustifs — ne pas en ajouter)

| État | Code | Définition fonctionnelle exacte |
|---|---|---|
| Planifié | `PLANIFIE` | État initial automatique à la création. Le créneau est réservé mais aucun contact de confirmation n'a encore été effectué avec le patient. |
| Confirmé | `CONFIRME` | Le patient a confirmé sa venue via un contact externe (téléphone/visite) relayé manuellement par un utilisateur cabinet. |
| Terminé | `TERMINE` | La séance a eu lieu. **Déclenche la création automatique d'une fiche Traitement dans le Module Traitement.** |
| Annulé | `ANNULE` | Rendez-vous annulé, avant la séance. Champ `origine_annulation` à renseigner. |

### 4.2 Transitions autorisées (table exhaustive)

| De | Vers | Déclencheur | Acteur autorisé | Contrainte |
|---|---|---|---|---|
| (création) | `PLANIFIE` | Création d'un nouveau RDV | `ASSISTANT` ou `DOCTOR` | Toujours automatique, jamais un autre statut initial |
| `PLANIFIE` | `CONFIRME` | Contact externe positif avec le patient | `ASSISTANT` ou `DOCTOR` | Action manuelle, aucune validation médecin requise |
| `PLANIFIE` | `ANNULE` | Annulation avant la séance | `ASSISTANT` ou `DOCTOR` | `origine_annulation` obligatoire |
| `CONFIRME` | `ANNULE` | Annulation avant la séance | `ASSISTANT` ou `DOCTOR` | `origine_annulation` obligatoire. **Autorisé à tout moment avant la séance, sans délai de blocage.** |
| `CONFIRME` | `TERMINE` | Fin de la séance | `ASSISTANT` ou `DOCTOR` | Déclenche la création de la fiche Traitement (voir 4.3) |
| `PLANIFIE` | `TERMINE` | Fin de la séance (cas où le RDV n'a jamais été marqué confirmé) | `ASSISTANT` ou `DOCTOR` | Non explicitement exclu par la documentation source — **à confirmer avant implémentation, voir section 7** |

### 4.3 Transitions INTERDITES (ne pas générer ces chemins)

- `TERMINE → *` : aucune transition sortante depuis `TERMINE`. C'est un état terminal.
- `ANNULE → *` : aucune transition sortante depuis `ANNULE`. C'est un état terminal.
- Aucun saut direct `(création) → CONFIRME` ou `(création) → TERMINE` : l'état initial est **toujours** `PLANIFIE`.

### 4.4 Effets de bord par transition (side-effects à coder)

| Transition | Effet de bord obligatoire |
|---|---|
| `* → TERMINE` | Création automatique d'une fiche `Traitement` (Module Traitement), liée à ce RDV. **Règle métier non négociable, déjà existante.** |
| `* → TERMINE` (si le RDV est de variante `RDV_MINIMAL`) | Déclenchement de la proposition de conversion (voir section 5) |
| `* → ANNULE` | Le champ `origine_annulation` devient obligatoire dans le même appel/transaction |

---

## 5. RÈGLE : Conversion RDV_MINIMAL → Fiche Patient

### 5.1 Comportement attendu

- Le système **propose** la conversion — ce n'est **jamais automatique et silencieux**.
- L'utilisateur (`ASSISTANT` ou `DOCTOR`) doit explicitement accepter ou refuser.
- **Déclencheur retenu (hypothèse de travail, voir section 7)** : la proposition apparaît au moment de la transition `* → TERMINE`, dans le même flux que la saisie de fin de séance.

### 5.2 Algorithme de conversion (pseudo-code)

```
ON transition_to(TERMINE):
  IF rdv.patient_id IS NULL:  // c'est un RDV_MINIMAL
    candidats = rechercher_patients_existants(rdv.nom_minimal, rdv.telephone_minimal)
    IF candidats.length > 0:
      afficher_choix(candidats, option_creer_nouveau=true)
      // l'utilisateur choisit un patient existant à rattacher OU crée un nouveau
    ELSE:
      proposer_creation_fiche_patient(nom=rdv.nom_minimal, telephone=rdv.telephone_minimal)

    IF utilisateur_accepte:
      patient = creer_ou_rattacher_patient(...)
      rdv.patient_id = patient.id
    ELSE:
      // le RDV reste autonome, patient_id reste NULL
      ne_rien_faire()
```

### 5.3 Contrainte anti-doublon (à implémenter)

⚠️ **Avant toute création de fiche patient depuis un RDV_MINIMAL, exécuter une recherche de correspondance** sur `nom` et `telephone` dans la table `Patient`. Ne jamais créer en aveugle.

---

## 6. RÈGLES TRANSVERSALES (non négociables, conserver telles quelles)

1. Un RDV peut toujours être créé sans fiche patient préexistante (`RDV_MINIMAL`).
2. Aucun acteur patient/public n'a accès au système — toute action est posée par `ASSISTANT` ou `DOCTOR`.
3. `ASSISTANT` et `DOCTOR` ont des permissions identiques sur ce module — ne pas générer de garde de rôle différenciée ici.
4. La transition vers `TERMINE` déclenche **toujours** la création d'une fiche Traitement (Module Traitement), sans exception.
5. L'annulation est possible depuis `PLANIFIE` ou `CONFIRME`, à tout moment avant la séance, sans délai de blocage.
6. Le calendrier doit supporter 3 vues : jour, semaine, mois (lecture seule pour la navigation, pas de règle métier additionnelle).
7. Chaque bloc RDV affiché doit être cliquable et ouvrir une vue rapide (popup/tiroir) avec lien direct vers le dossier patient — uniquement si `patient_id` n'est pas NULL.

---

## 7. POINTS NON TRANCHÉS — NE PAS SUPPOSER, DEMANDER CONFIRMATION

> Un agent IA qui implémente ce module doit **interrompre l'implémentation et demander clarification** sur les points suivants plutôt que de choisir une interprétation par défaut.

1. **Timing exact de la proposition de conversion** (section 5.1) : ancré ici à la transition vers `TERMINE` par hypothèse de cohérence UX, mais non confirmé formellement. Une alternative valide serait de l'ancrer à l'arrivée du patient (avant la séance).
2. **Transition `PLANIFIE → TERMINE` directe** (sans passer par `CONFIRME`) : non explicitement exclue ni confirmée. À trancher : doit-on forcer `CONFIRME` avant `TERMINE`, ou la clôture directe depuis `PLANIFIE` est-elle un cas métier valide (ex. patient venu sans confirmation préalable) ?
3. **Comportement si `candidats` multiples** lors de la recherche anti-doublon (section 5.3) : l'algorithme propose un choix, mais l'UX exacte (liste, fusion, etc.) n'est pas spécifiée.
4. **Format exact de `origine_annulation`** : seules deux valeurs métier sont mentionnées dans la documentation source (« patient » / « cabinet ») — confirmer si d'autres valeurs sont nécessaires (ex. no-show distinct d'une annulation explicite).

---

## 8. CE QUI N'EST PAS DANS LE PÉRIMÈTRE (ne pas générer)

- Pas de compte/authentification patient.
- Pas de notification automatique (SMS, email) au patient — tout contact est manuel et externe au système.
- Pas de règle de permission différenciée entre `ASSISTANT` et `DOCTOR` sur ce module.
- Pas de délai de blocage sur l'annulation (ex. "interdit d'annuler moins de 24h avant").
- Pas de nouveau statut RDV au-delà des 4 listés en section 4.1.

---

## 9. RÉSUMÉ EXÉCUTABLE (pour génération rapide de schéma/types)

```typescript
type StatutRDV = "PLANIFIE" | "CONFIRME" | "TERMINE" | "ANNULE";
type OrigineAnnulation = "PATIENT" | "CABINET";
type RoleUtilisateur = "ASSISTANT" | "DOCTOR"; // permissions identiques sur ce module

interface RendezVous {
  id: string;
  patientId: string | null;       // null si RDV_MINIMAL non converti
  nomMinimal?: string;             // requis si patientId est null
  telephoneMinimal?: string;       // requis si patientId est null
  dateHeureDebut: string;          // ISO 8601
  dateHeureFin?: string;
  statut: StatutRDV;
  origineAnnulation?: OrigineAnnulation; // requis si statut === "ANNULE"
  creePar: string;                 // userId
  creeLe: string;
  modifiePar: string;
  modifieLe: string;
}

const TRANSITIONS_AUTORISEES: Record<StatutRDV, StatutRDV[]> = {
  PLANIFIE: ["CONFIRME", "ANNULE", "TERMINE"], // TERMINE direct = point ouvert, voir section 7.2
  CONFIRME: ["TERMINE", "ANNULE"],
  TERMINE: [],  // état terminal
  ANNULE: [],   // état terminal
};
```

---

*Fin de spécification. Pour le diagramme visuel du flux (format Mermaid), voir le fichier `workflow_rdv_optimise.mmd` fourni séparément.*
