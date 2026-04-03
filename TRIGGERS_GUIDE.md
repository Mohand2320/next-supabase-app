# 🗄️ Triggers & Data Integrity avec DEV et PROD

## 📌 Contexte: Les triggers dans vos deux environnements

Vos fichiers SQL (`create_tables.sql` et `supabase_rls_setup.sql`) définissent des **triggers** importants.  
Ces triggers **doivent être identiques** dans l'environnement DEV et PROD.

---

## 🔄 Le Trigger `update_patients_updated_at`

### Ce qu'il fait

```sql
-- Fonction: Met à jour la colonne updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: S'active avant chaque modification
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Avantages

```
✅ Pas besoin de mettre à jour updated_at dans votre code Next.js
✅ Même si vous oubliez, la base de données le fait automatiquement
✅ Garantit une cohérence des données (DEV comme PROD)
✅ Fonctionne même si quelqu'un modifie la base via l'interface Supabase
```

---

## 🚀 Déployer les triggers dans vos deux environnements

### ÉTAPE 1: Créer les tables + triggers en DEV

1. Ouvrez **votre projet DentiPro-DEV** dans Supabase
2. Allez sur **SQL Editor**
3. Créez une nouvelle requête
4. Copez-collez le contenu de `create_tables.sql` **entièrement**
5. Cliquez **Run** ✅

### ÉTAPE 2: Ajouter la RLS en DEV

1. Toujours dans SQL Editor
2. Copez-collez le contenu de `supabase_rls_setup.sql`
3. Cliquez **Run** ✅

### ÉTAPE 3: Répéter exactement la même chose en PROD

1. Ouvrez **votre projet DentiPro-PROD** dans Supabase
2. Allez sur **SQL Editor**
3. Exécutez `create_tables.sql`
4. Exécutez `supabase_rls_setup.sql`

---

## ⚠️ Points importants

### 1. Les triggers doivent être identiques partout

```
❌ BAD: Trigger DEV ≠ Trigger PROD
✅ GOOD: Trigger DEV = Trigger PROD
```

### 2. Testez les triggers en DEV d'abord

```bash
# En DEV (npm run env:dev && npm run dev)
npm run env:dev
npm run dev

# Modifiez un patient
# Vérifiez que updated_at se met à jour automatiquement
```

### 3. Verification en Supabase

Pour vérifier que les triggers fonctionnent :

```sql
-- 1. Voir tous les triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- 2. Modifier un patient
UPDATE patients SET phone = '+33612345678' WHERE id = 'some-id';

-- 3. Vérifier que updated_at a changé
SELECT id, name, phone, updated_at FROM patients WHERE id = 'some-id';
```

---

## 💾 Votre flux de travail recommandé

```
┌─────────────────────────────────────────┐
│ 1. Développement LOCAL                   │
│ npm run env:dev && npm run dev           │
│ → Utilise DentiPro-DEV + ses triggers   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. Tests + Validation                   │
│ Vérifiez que updated_at se met à jour   │
│ Testez les modifications de patients    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. Basculez vers PROD LOCAL             │
│ npm run env:prod && npm run build       │
│ → Utilise DentiPro-PROD + ses triggers  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. Tests finals                         │
│ npm start                               │
│ Tous les triggers doivent marcher pareil│
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. Déployer sur Vercel                  │
│ Variables d'env PROD déjà configurées   │
│ → Production 🟢                         │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Problème: `updated_at` ne se met pas à jour

**Cause:** Le trigger n'est pas créé

**Solution:**
```sql
-- Vérifiez que le trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'update_patients_updated_at';

-- Si vide: Exécutez à nouveau create_tables.sql
```

### Problème: Erreur "Permission denied" lors de la création

**Cause:** Vous n'utilisez pas le rôle correct

**Solution:**
```sql
-- Connectez-vous avec le compte ADMIN de Supabase
-- Pas le compte de l'app
```

### Problème: Les triggers fonctionnent en DEV mais pas en PROD

**Cause:** Les tables n'existent pas en PROD

**Solution:** Exécutez `create_tables.sql` entièrement en PROD

---

## 📚 Documentation de référence

- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Your create_tables.sql](../create_tables.sql)
- [Your RLS setup](../supabase_rls_setup.sql)
