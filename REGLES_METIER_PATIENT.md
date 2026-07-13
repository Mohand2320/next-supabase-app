# Règles Métier — Module Patient (DentiPro)

## 1. Schéma de données

### 1.1 Tables principales

```
patients                          profils_medicaux
├── id UUID PK                    ├── id UUID PK
├── nom TEXT NOT NULL              ├── patient_id UUID UNIQUE FK → patients
├── prenom TEXT NOT NULL           ├── antecedents TEXT[] NOT NULL DEFAULT '{}'
├── date_naissance DATE NOT NULL   ├── allergies TEXT[] NOT NULL DEFAULT '{}'
├── sexe sexe_enum NOT NULL        ├── diabete BOOLEAN NOT NULL DEFAULT false
├── adresse TEXT                   ├── groupe_sanguin TEXT
├── telephone TEXT                 └── created_at / updated_at
├── email TEXT
├── num_assurance TEXT                  (Relation 1-1 avec patients)
├── groupe_sanguin TEXT
└── created_at / updated_at
```

### 1.2 Tables liées (séances / actes)

```
seances                           seance_actes
├── id UUID PK                    ├── seance_id UUID FK → seances
├── patient_id UUID FK            ├── acte_id UUID FK → actes_medicaux
├── dentiste_id UUID FK           ├── quantite INTEGER > 0 DEFAULT 1
├── date_heure TIMESTAMPTZ        ├── prix_applique NUMERIC(10,2) NOT NULL
├── prix NUMERIC(10,2) CHECK ≥0   └── localisation TEXT[] (dents traitées)
├── observations TEXT
├── type_denture ENUM              actes_medicaux
├── localisation TEXT[]            ├── id UUID PK
└── imagerie TEXT[]                ├── libelle TEXT NOT NULL
                                   ├── categorie ENUM
catalogues_actes                   ├── prix_defaut NUMERIC(10,2) ≥ 0
├── dentiste_id UUID UNIQUE FK     └── couleur TEXT
└── personnalise BOOLEAN

catalogue_actes_items
├── catalogue_id UUID FK
├── acte_id UUID FK
├── prix_personnalise NUMERIC(10,2)
└── UNIQUE(catalogue_id, acte_id)
```

### 1.3 Types énumérés (PostgreSQL)

| Enum | Valeurs |
|------|---------|
| `sexe_enum` | `'M'`, `'F'` |
| `type_denture_enum` | `'ENFANT'`, `'ADULTE'` |
| `categorie_acte_enum` | `'CONSERVATEUR'`, `'ENDODONTIE'`, `'PROTHESE'`, `'PARODONTOLOGIE'`, `'CHIRURGIE'`, `'ESTHETIQUE'`, `'CONSULTATION'` |

---

## 2. Sécurité et contrôle d'accès

### 2.1 Rôles

| Rôle | Accès patients |
|------|----------------|
| **Admin** (`is_admin = true`) | CRUD complet + gestion utilisateurs + bypass RLS via `supabaseAdmin` |
| **Dentiste** | Créer, lire, modifier, supprimer tout patient |
| **Assistant** | Créer, lire, modifier (pas de suppression) |

### 2.2 Row Level Security (PostgreSQL)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `patients` | authentifié | dentiste/assistant | dentiste/assistant | **dentiste** ou admin |
| `profils_medicaux` | authentifié | dentiste/assistant | dentiste/assistant | dentiste/assistant |
| `seances` | authentifié | **dentiste** | dentiste (propriétaire) | dentiste (propriétaire) |
| `seance_actes` | authentifié | **dentiste** | dentiste | dentiste |
| `actes_medicaux` | authentifié | dentiste | dentiste | dentiste |

Fonctions helper RLS :
- `current_user_role()` → `role` depuis `user_profiles`
- `current_dentiste_id()` → `dentiste_id` de l'utilisateur courant
- `current_user_is_admin()` → booléen

### 2.3 Garde applicative (API)

`requireRoles(['admin', 'dentiste', 'assistant'])` dans `src/lib/auth/guards.ts` :
1. Vérifie la session Supabase (JWT)
2. Charge le profil `user_profiles`
3. Vérifie `is_active` (compte désactivé → refusé)
4. Vérifie le rôle

---

## 3. Règles par flux métier

### 3.1 Création d'un patient

**Déclencheur :** Formulaire "Nouveau Patient" → `POST /api/patients`

**Règles :**
1. Authentification requise (rôle `dentiste` ou `assistant`)
2. Champs obligatoires : `first_name`, `last_name`, `date_of_birth`, `gender`
3. Validation Zod (`patientSchema`) :
   - `first_name` / `last_name` : string non vide, trim
   - `email` : format email valide ou vide
   - `phone` : >= 5 caractères ou vide
   - `date_of_birth` : format `YYYY-MM-DD`
   - `gender` : `'M'` ou `'F'`
4. Mapping `apiToDb` (camelCase → snake_case French) :
   - `first_name` → `prenom` | `last_name` → `nom`
   - `date_of_birth` → `date_naissance` | `gender` → `sexe`
   - `address` → `adresse` | `phone` → `telephone`
   - Le type TS `Gender` accepte `'Other'` mais la DB ne supporte que `'M'`/`'F'` → fallback `'F'`
5. Création atomique : `INSERT INTO patients` + `UPSERT profils_medicaux` (si allergies/antécédents)
6. Trigger `trg_patients_updated_at` → `updated_at` automatique
7. `id` = `uuid_generate_v4()`

**Cas particulier :** Pré-remplissage via query params `?nom=...&prenom=...&telephone=...` (conversion RDV minimal).

### 3.2 Modification d'un patient

**Déclencheur :** Formulaire "Modifier" → `PUT /api/patients/[id]`

**Règles :**
1. Mêmes règles d'authentification
2. Champs optionnels (`patientSchema.partial()`)
3. Fusion partielle — seuls les champs envoyés sont mis à jour
4. Upsert sur `profils_medicaux` (garantit la relation 1-1 même si création tardive du profil)
5. Trigger `updated_at` automatique

### 3.3 Suppression d'un patient

**Déclencheur :** Bouton "Supprimer" avec confirmation → `DELETE /api/patients/[id]`

**Règles :**
1. Rôle **`dentiste`** uniquement (ou admin)
2. Contraintes `ON DELETE` :
   - `profils_medicaux` : **CASCADE** — supprimé automatiquement
   - `seances` : **RESTRICT** — impossible si des séances existent
   - `rendez_vous` : **RESTRICT** — impossible si des RDV existent
3. En cas de séances ou RDV associés, la requête échoue (erreur 500)

### 3.4 Liste et recherche

**Déclencheur :** Page "Patients" → `GET /api/patients`

| Paramètre | Comportement |
|-----------|--------------|
| `search` | ILIKE sur `nom`, `prenom`, `telephone`, `email` (`%...%`) |
| `gender` | Filtre `sexe = 'M'` ou `'F'` |
| `createdPreset` | `today` / `week` / `month` / `custom` → filtre `created_at` |
| `birthFrom/birthTo` | Filtre `date_naissance` |
| `sort` | `name_asc`, `name_desc`, `newest` (défaut), `oldest` |
| `page/limit` | Pagination `range()` (défaut 20, max 100) |

**Règles :**
1. Semaine commence le lundi
2. Les dates `createdFrom/createdTo` ne sont actives que si `createdPreset = 'custom'`
3. Résultat inclut `count: 'exact'` pour la pagination
4. Données mappées via `dbToApi` (snake_case → camelCase)
5. Filtres synchronisés dans l'URL (query params) via `usePatientFilters` → URL partageable, retour arrière navigateur fonctionnel
6. Recherche avec debounce de 500ms avant déclenchement côté client
7. **Rate Limit Serveur :** L'API limite à 60 requêtes/minute par utilisateur pour protéger contre l'abus (throttling)

### 3.5 Détail d'un patient

**Déclencheur :** Page profil → `GET /api/patients/[id]` + `GET /api/patients/[id]/treatments`

**Règles d'affichage :**
1. Fiche patient = `patients` + `profils_medicaux` (allergies, antécédents)
2. L'historique des traitements interroge directement la vue SQL dédiée `v_historique_seances` qui agrège les données :
   - Une séance = une ligne dans l'historique
   - Type de soin = concaténation `Nx Libellé, ...` (fait via `STRING_AGG` en SQL)
   - Dent(s) = concaténation unique des localisations (fait via `array_agg(DISTINCT ...)` en SQL)
   - Coût = `prix` total de la séance
3. Affichage adaptatif : tableau (desktop) / cards (mobile)

### 3.6 Feuille de soins (création de séance)

**Déclencheur :** Bouton "Ajouter" depuis le profil → `GET /dashboard/patients/[id]/nouvelle-seance`

**Règles :**
1. **Dentiste :** Si l'utilisateur est un assistant (ou pas de `dentiste_id`), le premier dentiste de la table `dentistes` est utilisé
2. **Catalogue actes :** Fusion `prix_defaut` / `prix_personnalise` — le prix personnalisé prime
3. **Denture automatique :** Si âge < 13 ans → `ENFANT`, sinon `ADULTE`
4. **Saisie des actes :** Quantité > 0, prix librement modifiable (filtre numérique + virgule française, parsé symétriquement via `parseMontant()`)
5. **Odontogramme :** Sélection visuelle des dents (notation FDI) via `react-odontogram`
6. **Enregistrement atomique (RPC `enregistrer_feuille_de_soins`) :**
   - Insère ou met à jour la séance
   - Supprime les anciens actes (si mise à jour)
   - Insère chaque acte avec `prix_applique`, `quantite`, `localisation`
   - Calcule `prix = SUM(prix_applique × quantite)`
   - Vérifie ≥ 1 acte (sinon exception SQL)
7. **Devise :** DA (Dinar Algérien) — formatage via `formatMontant()` centralisé

### 3.7 Prix : trois niveaux

| Concept | Table | Description |
|---------|-------|-------------|
| **Prix défaut** | `actes_medicaux.prix_defaut` | Tarif de référence national / catalogue de base |
| **Prix personnalisé** | `catalogue_actes_items.prix_personnalise` | Tarif spécifique à un dentiste |
| **Prix appliqué** | `seance_actes.prix_applique` | Tarif réellement facturé (modifiable librement) |

Règle de fusion : `prix_personnalise ?? prix_defaut` comme valeur initiale dans le formulaire.

---

## 4. Vues SQL

```sql
v_fiche_patient → patients + profils_medicaux + nb_seances + nb_rdv_a_venir + derniere_seance
```

---

## 5. Contraintes d'intégrité

| Contrainte | Table | Règle |
|------------|-------|-------|
| `date_naissance NOT NULL` | patients | Obligatoire |
| `sexe NOT NULL` | patients | Obligatoire (M/F) |
| `prix_applique NOT NULL` | seance_actes | Peut être 0 (acte gratuit) |
| `quantite > 0` | seance_actes | Minimum 1 |
| `prix >= 0` | seances | Total jamais négatif |
| `prix_defaut >= 0` | actes_medicaux | Prix catalogue jamais négatif |

---

## 6. Index de performance

| Index | Table | Colonne |
|-------|-------|---------|
| `idx_patients_nom` / `prenom` | patients | `nom`, `prenom` |
| `idx_patients_email` / `telephone` | patients | `email`, `telephone` |
| `idx_patients_created_at` | patients | `created_at DESC` |
| `idx_patients_*_trgm` (GIN trigram) | patients | `nom`, `prenom`, `telephone`, `email` |
| `idx_seances_patient` | seances | `patient_id` |
| `idx_seances_date` | seances | `date_heure DESC` |

---

## 7. Flux de bout en bout

### Création d'un patient
```
1. Remplissage formulaire → validation Zod client
2. POST /api/patients → requireRoles() → validation Zod serveur
3. apiToDb() (camelCase → snake_case)
4. INSERT INTO patients + UPSERT profils_medicaux
5. RLS vérifie rôle (dentiste/assistant)
6. Trigger updated_at automatique
7. Réponse JSON mappée via dbToApi()
```

### Ajout d'une séance
```
1. Navigation vers /dashboard/patients/[id]/nouvelle-seance
2. Page serveur : auth → dentiste → patient → catalogue actes
3. Client : odontogramme + sélection actes + prix + quantité
4. Submit → RPC enregistrer_feuille_de_soins() (SECURITY DEFINER)
5. SQL atomique : INSERT/UPDATE seance → DELETE → INSERT seance_actes → UPDATE prix
6. Redirection vers profil patient
```

### Consultation historique
```
1. Page profil → 2 appels parallèles
   GET /api/patients/[id] (patient + profil médical)
   GET /api/patients/[id]/treatments (seances → seance_actes → actes_medicaux)
2. Chaque séance → ligne traitement (type concaténé, localisation, prix)
3. Affichage : tableau (desktop) / cards (mobile)
```

---

## 8. Notes importantes (et TODOs)

- **Mappers obligatoires :** Colonnes DB = `snake_case` français (`nom`, `prenom`, `date_naissance`). API = `camelCase` anglais (`first_name`, `last_name`, `date_of_birth`). **Ne pas renommer les colonnes** — les mappers `src/lib/mappers/patient.ts` gèrent la conversion
- **Aucun test automatisé** — toute modification nécessite une vérification manuelle du cycle CRUD complet
- **`'Other'` en gender :** Le type TS l'accepte, la DB seulement `'M'`/`'F'`. Le mapper force `'F'` en fallback
- **TODO - Anonymisation (RGPD) :** Actuellement, la suppression d'un patient est impossible si des séances ou RDV existent (contrainte `RESTRICT` pour conserver le dossier médical). *À faire plus tard :* Créer un mécanisme d'anonymisation au lieu de la suppression si un patient invoque son droit à l'effacement.
- **TODO - Imagerie et Confidentialité :** Le champ `imagerie TEXT[]` (séances) est prévu pour stocker des liens. *À faire plus tard :* Implémenter des URLs signées avec expiration (Supabase Storage privé) plutôt que des URLs publiques, afin de garantir le secret médical.
- **RPC Security Definer :** `enregistrer_feuille_de_soins()` contourne RLS — le contrôle d'accès est fait par l'application avant l'appel
