# 🔄 Guide de Maintenance et Mises à Jour

## 📌 Objectif

Ce guide vous aide à:
- ✅ Ajouter de nouvelles tables/colonnes
- ✅ Mettre à jour les triggers
- ✅ Synchroniser DEV et PROD
- ✅ Gérer les migrations

---

## 🚀 Workflow: Ajouter une nouvelle table

### Étape 1: Planifier en DEV
```bash
npm run env:dev
npm run dev
```

### Étape 2: Créer la table en DEV
Dans Supabase SQL Editor (DEV):
```sql
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Ajouter le trigger de mise à jour automatique
CREATE TRIGGER update_new_feature_updated_at
BEFORE UPDATE ON new_feature
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Ajouter RLS (si besoin)
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON new_feature FOR ALL
  USING (user_id = auth.uid());
```

### Étape 3: Tester en DEV
```bash
npm run dev
# Testez votre nouvelle feature
```

### Étape 4: Documenter dans SQL
Ajoutez le code SQL à `create_tables.sql`:
```sql
-- Nouvelle table new_feature (lignes XYZ-ABC)
CREATE TABLE new_feature (
  ...
);
```

### Étape 5: Appliquer à PROD
```bash
npm run env:prod
```

Dans Supabase SQL Editor (PROD):
```sql
-- Même code que en DEV
CREATE TABLE new_feature (
  ...
);
```

### Étape 6: Vérifier
```bash
npm run env:prod
npm run build
npm start
# Testez que la nouvelle feature marche en PROD local
```

---

## 🔄 Workflow: Mettre à jour une colonne existante

### Ejemplo: Ajouter un champ à `patients`

#### DEV:
```sql
-- Ajouter la colonne
ALTER TABLE patients ADD COLUMN specialty TEXT;

-- Vérifier
SELECT * FROM patients LIMIT 1;
```

#### PROD:
```sql
-- Même commande
ALTER TABLE patients ADD COLUMN specialty TEXT;
```

#### Mettre à jour votre type TypeScript 
`src/types/patient.ts`:
```typescript
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  specialty?: string;  // ← Nouvelle colonne
  created_at: string;
  updated_at: string;
}
```

---

## 🔐 Workflow: Ajouter des RLS Policies

### Pattern général

```sql
-- Pour les tables multi-utilisateurs
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own data"
  ON your_table FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON your_table FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own data"
  ON your_table FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own data"
  ON your_table FOR DELETE
  USING (user_id = auth.uid());
```

### Tester les RLS
```sql
-- Vérifier que RLS est activée
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'your_table';

-- Voir les policies
SELECT * FROM information_schema.role_set_enable_clause 
WHERE table_name = 'your_table';
```

---

## 🆘 Revert / Rollback

### Si quelque chose break en DEV

```bash
npm run env:dev
```

Dans Supabase SQL Editor (DEV):
```sql
-- Supprimer la mauvaise table
DROP TABLE IF EXISTS bad_table CASCADE;

-- Ou restaurer une colonne
ALTER TABLE patients DROP COLUMN IF EXISTS bad_column;

-- Redémarrer les triggers si besoin
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Puis tester à nouveau
```bash
npm run dev
# Vérifiez que tout marche
```

---

## 📦 Workflow: Synchroniser DEV et PROD

### Scénario: Vous avez fait des changements en DEV

#### Option 1: Documenter et reproduire manuellement (Recommandé)

1. Documentez tous les changements SQL
2. Exécutez les mêmes commandes en PROD SQL Editor
3. Testez en `npm run env:prod && npm start`

#### Option 2: Export Schema (Avancé)

```bash
# DEV: Export la définition de la table
pg_dump -h votre-dev.supabase.co \
  -U postgres \
  -t "public.patients" \
  --schema-only > schema_dev.sql

# PROD: Vérifier les différences
# (Besoin d'outils PostgreSQL installés localement)
```

---

## 🧪 Checklist avant de Vercel

Avant de déployer à Vercel:

- [ ] Tous les `npm run env:dev` et `npm run dev` marche
- [ ] `npm run env:prod` et `npm run start` marche
- [ ] Testez les triggers: [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md)
- [ ] Testez la RLS: Connectez-vous en tant qu'utilisateurs différents
- [ ] Pas d'erreurs dans la console
- [ ] Les nouvelles colonnes sont dans `src/types/patient.ts`
- [ ] Les variables d'env PROD sont dans Vercel

---

## 📋 Commandes utiles PostgreSQL

```sql
-- Voir toutes les tables
\dt public.*

-- Voir le schéma d'une table
\d public.patients

-- Voir tous les triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Voir toutes les fonctions
SELECT * FROM information_schema.routines WHERE routine_schema = 'public';

-- Voir les politiques RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Compter les lignes
SELECT count(*) FROM patients;

-- Voir les statistiques
ANALYZE;
```

---

## 🚨 Erreurs courantes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `No such table` | Table n'existe pas | Exécutez `create_tables.sql` |
| `Permission denied` | RLS bloque l'accès | Vérifiez les policies RLS |
| `Function not found` | Fonction manquante | Exécutez la création de la fonction |
| `Trigger not found` | Trigger n'existe pas | Exécutez la création du trigger |
| `Column not found` | Colonne n'existe pas | Ajoutez la colonne avec ALTER TABLE |

---

## 📚 Ressources

- [create_tables.sql](./create_tables.sql) - Définition des tables
- [supabase_rls_setup.sql](./supabase_rls_setup.sql) - Politiques RLS
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/managing-schemas)

---

## 💡 Best Practices

1. **Toujours tester en DEV d'abord** - Ne jamais directement en PROD
2. **Documentez les changements** - Dans `create_tables.sql`
3. **Synchronisez DEV et PROD** - Gardez-les en sync
4. **Vérifiez les triggers** - Après chaque création de table
5. **Testez les RLS** - Avant de déployer
6. **Créez les backups** - Avant les gros changements
7. **Versionnez votre SQL** - Dans git

---

Pour toute question, consultez [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) 📖
