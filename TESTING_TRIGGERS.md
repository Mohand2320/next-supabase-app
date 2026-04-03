# 🧪 Testing Guide - Vérifier que les Triggers fonctionnent

## 🎯 Objectif

S'assurer que votre colonne `updated_at` se met à jour **automatiquement** quand vous modifiez un patient.

---

## ✅ TEST 1: Vérifier via Supabase SQL Editor

### Étape 1: Créer un patient test
```sql
INSERT INTO patients (
  id, 
  name, 
  email, 
  phone, 
  date_of_birth,
  address,
  created_at, 
  updated_at
)
VALUES (
  'test-' || gen_random_uuid()::text,
  'Ahmed Ben Salim',
  'ahmed@dentipro.com',
  '+33612345678',
  '1985-05-15',
  '123 Rue de Paris, 75000 Paris',
  now(),
  now()
);
```

### Étape 2: Récupérer le patient et noter l'heure de `updated_at`
```sql
SELECT id, name, phone, created_at, updated_at 
FROM patients 
WHERE name = 'Ahmed Ben Salim'
ORDER BY created_at DESC 
LIMIT 1;
```

**Important**: Notez l'heure exacte de `updated_at` ⏰

### Étape 3: Attendre 5 secondes, puis modifier le patient
```sql
UPDATE patients 
SET phone = '+33698765432'
WHERE name = 'Ahmed Ben Salim';
```

### Étape 4: Vérifier que `updated_at` a changé
```sql
SELECT id, name, phone, created_at, updated_at 
FROM patients 
WHERE name = 'Ahmed Ben Salim'
ORDER BY created_at DESC 
LIMIT 1;
```

### ✅ Résultat attendu
- ✅ `updated_at` a une heure **plus récente** qu'avant
- ✅ Vous n'aviez rien à faire dans le code - le trigger l'a fait!

```
AVANT:  2026-04-03 14:30:25.123456
APRÈS:  2026-04-03 14:30:30.654321  ← Different!
                    ↑ Le trigger a changé ça
```

---

## ✅ TEST 2: Vérifier via l'Application Next.js

### Étape 1: Lancer l'app
```bash
npm run env:dev  # ou prod
npm run dev
```

### Étape 2: Aller à http://localhost:3000

### Étape 3: Se connecter avec vos credentials

### Étape 4: Créer un nouveau patient
- Cliquez "Nouveau patient"
- Remplissez les informations
- Cliquez "Créer"

### Étape 5: Modifier immédiatement ce patient
- Cliquez sur "Modifier"
- Changez le numéro de téléphone
- Cliquez "Enregistrer"

### Étape 6: Vérifier dans Supabase

1. Allez dans Supabase Dashboard → Table `patients`
2. Trouvez votre patient
3. Regardez les colonnes `created_at` et `updated_at`

### ✅ Résultat attendu
```
created_at: 2026-04-03 14:35:00  (quand créé)
updated_at: 2026-04-03 14:35:05  (quand modifié - PLUS RÉCENT!)
                                 ↑ Le trigger l'a changé!
```

---

## ✅ TEST 3: Vérifier que le trigger existe

### SQL pour vérifier
```sql
-- Voir tous les triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Voir les détails du trigger spécifique
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'update_patients_updated_at';

-- Voir la fonction du trigger
SELECT prosrc FROM pg_proc 
WHERE proname = 'update_updated_at_column';
```

### ✅ Résultat attendu
- Vous voyez `update_patients_updated_at` listée
- Son action est: `BEFORE UPDATE`
- Sa table est: `public.patients`

---

## ✅ TEST 4: Vérifier que RLS fonctionne

### Problème potentiel
"Pourquoi je ne peux pas modifier le patient?" → Probablement la RLS

### Tester la RLS
```sql
-- À exécuter EN TANT QU'UTILISATEUR (pas admin)
-- Depuis l'interface Supabase → Authentication

UPDATE patients SET phone = '+33612345678' WHERE id = 'xxx';
```

Si vous revenez une erreur "permission denied" → RLS marche! ✅

---

## 🐛 Troubleshooting

### Problème 1: Trigger n'existe pas
```
Error: UPDATE trigger 'update_patients_updated_at' not found
```

**Solution:**
```sql
-- Exécutez le contenu de create_tables.sql à nouveau
-- Cherchez les lignes du trigger:
-- CREATE TRIGGER update_patients_updated_at...
```

### Problème 2: `updated_at` ne change pas
**Cause possible 1:** Le trigger n'est pas créé
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'update_patients_updated_at';
-- Doit retourner 1 ligne
```

**Cause possible 2:** Vous modifiez juste la même valeur
```sql
UPDATE patients SET phone = phone;  -- ❌ Ça ne changerait rien
UPDATE patients SET phone = 'new';  -- ✅ Ça changerait et activerait le trigger
```

### Problème 3: Erreur "Function not found"
```
Error: Function update_updated_at_column() does not exist
```

**Solution:** Le trigger essaie d'appeler une fonction inexistante
```sql
-- Créez la fonction d'abord (voir create_tables.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Tableau de vérification

| Test | Objectif | ✅ Réussi? |
|------|----------|-----------|
| SQL: Créer patient | Vérifier que les inserts marchent | [ ] |
| SQL: Modifier patient | Vérifier que `updated_at` se met à jour | [ ] |
| SQL: Vérifier trigger existe | S'assurer que le trigger est créé | [ ] |
| App: Créer & modifier | Vérifier que tout marche depuis l'UI | [ ] |
| RLS: Permission check | Vérifier que les permissions marchent | [ ] |

---

## 🎬 Workflow de test complet (5 min)

```bash
# 1. Lancer l'app
npm run env:dev
npm run dev

# 2. Se connecter & créer un patient

# 3. Modifier ce patient immédiatement

# 4. Vérifier dans Supabase que updated_at s'est mis à jour

# 5. Exécuter SQL pour vérifier le trigger
#    SELECT * FROM information_schema.triggers...

# ✅ Si tout ça marche = Triggers fonctionnent!
```

---

## 📝 Notes après les tests

Une fois que vous avez confirmé que les triggers marchent:

```markdown
✅ DEV Environment
- Trigger create
- Trigger update
- RLS policies all work

✅ PROD Environment
- Trigger create
- Trigger update
- RLS policies all work

✅ Application
- Can create patients
- Can modify patients
- updated_at auto-updates

Ready for deployment! 🚀
```

---

## 💡 Conseils

1. **Testez d'abord en DEV** → Puis check que même l'effet se produit en PROD
2. **Attendez quelques secondes** → Entre la création et la modification pour bien voir le changement
3. **Vérifiez les timestamps** → Comparez les heure exacts
4. **Documentez vos tests** → Prenez des screenshots pour votre équipe

---

Pour plus de détails sur les triggers, consultez [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) 📖
