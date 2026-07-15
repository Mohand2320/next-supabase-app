# Analyse : "Ajouter un acte" + Odontogramme (Feuille de soins)

## Architecture globale

```
Page serveur (nouvelle-seance/page.tsx)          Client (NouvelleSeanceForm.tsx)
─────────────────────────────                     ─────────────────────────────
1. Auth + profil utilisateur                      4. Combobox "Acte médical"
2. Récupération patient                           5. Champ "Quantité"
3. getCatalogueActes()  ────────── catalogue ──>  6. Champ "Prix Appliqué (DA)"
                                                   7. OdontogramSelector
                                                   8. Bouton "Ajouter à la séance"
                                                   9. Enregistrement → RPC SQL
```

---

## 1. Chargement du catalogue (côté serveur)

**Fichier :** `src/components/seance-form/seance.service.ts` — `getCatalogueActes(supabase, dentisteId)`

```
1. SELECT * FROM actes_medicaux          → 20 actes de base (libellé, prix_defaut, couleur)
2. SELECT id FROM catalogues_actes
   WHERE dentiste_id = ?                 → catalogue personnalisé du dentiste (si existe)
3. SELECT acte_id, prix_personnalise
   FROM catalogue_actes_items
   WHERE catalogue_id = ?                → prix sur-mesure pour certains actes
4. Fusion : prix = prix_personnalise ?? prix_defaut
5. Déduplication par libellé (insensible à la casse)
6. Tri alphabétique
   → Retourne CatalogueActeItem[]
```

**Structure résultante :**
```ts
{ acteId: "uuid", libelle: "Détartrage simple", prix: 28.50, couleur: "#0891B2" }
```

---

## 2. Le Combobox "Ajouter un acte"

**Fichier :** `src/components/seance-form/NouvelleSeanceForm.tsx`

### États gérés

| State | Type | Rôle |
|-------|------|------|
| `acteChoisiId` | `string` | UUID de l'acte sélectionné |
| `rechercheActe` | `string` | Texte saisi dans le champ |
| `dropdownOuvert` | `boolean` | Affichage de la liste déroulante |

### Fonctionnement pas à pas

```
1. Clic sur l'input       → onFocus  → dropdownOuvert = true
2. Saisie de texte        → onChange :
                             - setRechercheActe(valeur)
                             - setDropdownOuvert(true)
                             - si acte sélectionné → réinitialise acteChoisiId
3. Filtrage instantané    → useMemo :
                             actesFiltres = catalogueActes.filter(
                               a => a.libelle.toLowerCase().includes(rechercheActe.toLowerCase())
                             )
4. Clic sur une option    → onMouseDown (preventDefault pour éviter le blur) :
                             - selectionnerActe(acteId)
                             - setActeChoisiId(acteId)
                             - setPrixUnitaire(acte.prix.toString())  → préremplit le prix
                             - setQuantite(1)
                             - setRechercheActe(acte.libelle)  → affiche le libellé dans l'input
                             - setDropdownOuvert(false)
5. Perte de focus         → onBlur → setTimeout(200ms) → dropdownOuvert = false
                             (délai pour laisser le onMouseDown s'exécuter)
```

### Règles
- Si la recherche ne trouve rien → message "Aucun acte trouvé"
- L'acte sélectionné affiche une pastille de couleur + son libellé sous l'input
- Le bouton "Ajouter à la séance" est désactivé tant qu'aucun acte n'est choisi

---

## 3. L'Odontogramme

**Fichier :** `src/components/seance-form/OdontogramSelector.tsx`

**Composant externe :** `react-odontogram` v0.5.6

```tsx
import dynamic from 'next/dynamic';
const Odontogram = dynamic(() => import('react-odontogram'), { ssr: false });

<Odontogram 
  notation="FDI"                        // Notation FDI standard (11, 12… 48)
  showLabels={true}
  defaultSelected={selectedTeethIds}
  maxTeeth={typeDenture === 'ENFANT' ? 5 : 8}  // Enfant: 5 / Adulte: 8
  onChange={onChange}
/>
```

**Import dynamique** (`ssr: false`) → pas de rendu serveur (évite les erreurs d'hydratation).

### Denture automatique
```
Âge < 13 ans → ENFANT (maxTeeth=5 → dents de lait)
Âge ≥ 13 ans → ADULTE (maxTeeth=8 → dents permanentes)
```
Calcul fait deux fois : page serveur (bandeau) + client via `determinerDentureInitiale()`.

### Intégration
| Prop | Détail |
|------|--------|
| `selectedTeethIds` | passé via `useMemo` → évite les re-rendus inutiles |
| `onChange` | callback `handleChangeTeeth` avec `setTimeout(0)` (contourne un bug de react-odontogram qui appelle onChange en phase de rendu) |

### Contournement du warning React
```tsx
const handleChangeTeeth = React.useCallback((teeth: ToothDetail[]) => {
  setTimeout(() => {
    setDentsSelectionnees((prev) => {
      if (prev.length === teeth.length && prev.every((t, i) => t.id === teeth[i].id)) return prev;
      return teeth;
    });
  }, 0);
}, []);
```
Le `setTimeout(0)` diffère la mise à jour d'état hors de la phase de rendu de la bibliothèque.

---

## 4. Ajout d'un acte à la séance

**Fichier :** `NouvelleSeanceForm.tsx` — `handleAjouterLigne()`

```ts
const nouvelleLigne: LigneActeSaisie = {
  cleTemporaire: crypto.randomUUID(),                    // ID unique côté client
  acteId: acte.acteId,
  libelle: acte.libelle,
  quantite: quantite,                                     // Nombre saisi par l'utilisateur
  prixApplique: parseMontant(prixUnitaire),               // String → Number (gère virgule)
  dentsFdi: dentsSelectionnees.map(d => d.id),            // IDs FDI des dents sélectionnées
  couleur: acte.couleur
};
```

**`parseMontant()`** dans `types.ts` :
```ts
export function parseMontant(valeur: string): number {
  if (!valeur) return 0;
  const cleaned = valeur.replace(/,/g, '.').replace(/\s/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
// "1 500,50" → 1500.5
```

### Reset du formulaire après ajout
```ts
setActeChoisiId('');      // Aucun acte sélectionné
setPrixUnitaire('');       // Prix vide
setQuantite(1);            // Quantité à 1
setDentsSelectionnees([]); // Aucune dent
setRechercheActe('');      // Champ de recherche vide
```

### Calcul du total en temps réel
```ts
const totalSeance = useMemo(() => {
  return lignes.reduce((acc, ligne) => acc + (ligne.prixApplique * ligne.quantite), 0);
}, [lignes]);
```

---

## 5. Enregistrement (RPC PostgreSQL)

**Fichier :** `seance.service.ts` — `enregistrerFeuilleDeSoins()`

Prépare un payload JSON et appelle la fonction RPC :

```ts
supabase.rpc('enregistrer_feuille_de_soins', {
  p_seance_id: input.seanceId || null,  // NULL = nouvelle séance
  p_patient_id: input.patientId,
  p_dentiste_id: input.dentisteId,
  p_date_heure: input.dateHeure,
  p_observations: input.observations,
  p_type_denture: input.typeDenture,
  p_localisation: localisationGlobale,  // TEXT[] de toutes les dents
  p_actes: [                           // JSONB array
    { acte_id, quantite, prix_applique, localisation }
  ]
});
```

### Ce que fait la RPC (SQL, `09_module_feuille_soins.sql`)

```
1. Vérifie que p_actes n'est pas vide → sinon RAISE EXCEPTION
2. Si p_seance_id IS NULL :
     → INSERT INTO seances (patient_id, dentiste_id, date_heure, observations, type_denture, localisation, prix=0)
   Sinon :
     → UPDATE seances SET observations, type_denture, localisation, date_heure, dentiste_id
     → DELETE FROM seance_actes WHERE seance_id = p_seance_id
3. Boucle sur chaque acte dans le JSONB :
     → INSERT INTO seance_actes (seance_id, acte_id, quantite, prix_applique, localisation)
     → Accumule v_total += (prix_applique * quantite)
4. UPDATE seances SET prix = v_total
5. RETURN v_seance_id
```

### Important
- **SECURITY DEFINER** → la fonction contourne RLS. Le contrôle d'accès est fait côté application avant l'appel
- **Atomique** → tout passe ou tout échoue (transaction implicite)

---

## 6. Flux complet résumé

```
1. Server Component charge auth, patient, catalogue → passe en props
2. Client Component affiche :

┌─ Colonne gauche (col-span-3) ─────────┐  ┌─ Colonne droite (col-span-2) ─────┐
│                                       │  │                                   │
│  Odontogramme (react-odontogram)      │  │  Input "Acte médical"             │
│  avec notation FDI                     │  │  ↓ combobox filtré côté client    │
│  Enfant: 5 dents / Adulte: 8 dents    │  │  Quantité | Prix Appliqué (DA)    │
│                                       │  │  ↓ "Ajouter à la séance"          │
│  Badges des dents sélectionnées       │  │  Liste des actes ajoutés          │
│                                       │  │  (pastille couleur, Nx libellé,   │
│  Textarea "Observations médicales"    │  │   dents, sous-total, supprimer)    │
│                                       │  │                                   │
│                                       │  │  Total Séance                     │
│                                       │  │  ↓ "Enregistrer la séance"        │
└───────────────────────────────────────┘  └───────────────────────────────────┘

3. Enregistrement → RPC atomique PostgreSQL → redirection /dashboard/patients/[id]
```

---

## 7. Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `src/app/dashboard/patients/[id]/nouvelle-seance/page.tsx` | Page serveur : auth, patient, catalogue |
| `src/components/seance-form/NouvelleSeanceForm.tsx` | Form client : combobox, prix, liste actes |
| `src/components/seance-form/OdontogramSelector.tsx` | Wrapper react-odontogram (import dynamique) |
| `src/components/seance-form/seance.service.ts` | getCatalogueActes() + enregistrerFeuilleDeSoins() |
| `src/components/seance-form/types.ts` | Types + parseMontant + calculAge + denture |
| `database/schema/09_module_feuille_soins.sql` | RPC `enregistrer_feuille_de_soins` |
