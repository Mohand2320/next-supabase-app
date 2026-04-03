# 🏥 DentiPro - Checklist Installation DEV/PROD

## 📋 Pré-requis

- [ ] Node.js 18+ installé
- [ ] Compte Supabase créé
- [ ] Deux projets Supabase créés (DentiPro-DEV et DentiPro-PROD)

---

## 🎯 PHASE 1: Installation de base

### Étape 1: Cloner/récupérer le projet
```bash
cd d:\AMOURA\application\ gestion\ cabinet\ dentaire\next-supabase-app
npm install
```
- [ ] ✅ Les dépendances sont installées

### Étape 2: Configurer les fichiers d'environnement

#### Pour DEV:
```bash
npm run env:dev
# ou
node scripts/switch-env.js dev
```

Modifiez `.env.development` avec **vos vraies clés DEV**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx_dev
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...xxx_dev
```
- [ ] ✅ `.env.development` configuré

#### Pour PROD:
Modifiez `.env.production` avec **vos vraies clés PROD**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx_prod
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...xxx_prod
```
- [ ] ✅ `.env.production` configuré

---

## 🗄️ PHASE 2: Configuration Supabase (DEV & PROD)

### Pour chaque environnement (DEV puis PROD):

#### A) Créer les tables
1. Ouvrez votre projet dans [Supabase Dashboard](https://app.supabase.com)
2. Allez dans **SQL Editor** → **New Query**
3. Copez tout le contenu de `create_tables.sql`
4. Cliquez **Run**
- [ ] ✅ Tables créées en DEV
- [ ] ✅ Tables créées en PROD

#### B) Activer la Row Level Security (RLS)
1. Dans **SQL Editor** → **New Query**
2. Copez tout le contenu de `supabase_rls_setup.sql`
3. Cliquez **Run**
- [ ] ✅ RLS activée en DEV
- [ ] ✅ RLS activée en PROD

#### C) Vérifier les triggers
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```
Vous devriez voir: `update_patients_updated_at`
- [ ] ✅ Triggers créés en DEV
- [ ] ✅ Triggers créés en PROD

---

## 🚀 PHASE 3: Tests

### Test 1: Développement local

```bash
npm run env:dev
npm run dev
```

Ouvrez http://localhost:3000 et testez:
- Se connecter
- Créer un patient
- Modifier un patient → vérifier que `updated_at` se met à jour

- [ ] ✅ App fonctionne en DEV
- [ ] ✅ Les patients se créent
- [ ] ✅ Les patients se modifient
- [ ] ✅ `updated_at` se met à jour automatiquement

### Test 2: Build production (local)

```bash
npm run env:prod
npm run build
npm start
```

Ouvrez http://localhost:3000 et testez:
- L'app charge correctement
- Vous vous connectez à la base PROD
- Les fonctionnalités marchent

- [ ] ✅ Build réussit
- [ ] ✅ Connexion à PROD fonctionne
- [ ] ✅ Les patients se modifient en PROD

---

## 📦 PHASE 4: Déploiement Vercel (optionnel)

### Sur Vercel Dashboard:

1. Reliez votre repo GitHub
2. Allez dans **Settings** → **Environment Variables**
3. Ajoutez les variables PROD:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://votre-prod.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx_prod
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...xxx_prod
   ```
4. Déployez!

- [ ] ✅ Variables d'env ajoutées dans Vercel
- [ ] ✅ Déploiement réussi
- [ ] ✅ App accessible en ligne

---

## 📊 Commandes utiles après installation

```bash
# Voir l'env actuel
npm run env:show

# Basculer vers DEV
npm run env:dev

# Basculer vers PROD
npm run env:prod

# Lancer en développement
npm run dev

# Builder
npm run build

# Lancer version produit
npm start

# Linter
npm run lint
```

---

## 🆘 En cas de problème

### "❌ Missing SUPABASE_SERVICE_ROLE_KEY"
→ Votre fichier `.env` n'a pas la variable
→ Vérifiez `.env.development` ou `.env.production`

### "❌ Could not connect to Supabase"
→ L'URL Supabase est incorrecte
→ Vérifiez sur le dashboard: Settings → API

### "❌ Authentication failed"
→ La clé ANON_KEY est incorrecte ou expirée
→ Régénérez-la depuis Supabase

### "updated_at ne se met pas à jour"
→ Les triggers ne sont pas créés
→ Exécutez `create_tables.sql` en entier dans SQL Editor

---

## 📚 Documentation complète

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Guide détaillé des environnements
- [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) - Explication des triggers
- [scripts/README.md](./scripts/README.md) - Guide des scripts
- [.env.example](./.env.example) - Template des variables

---

## ✨ Prêt? 

Commencez par:
```bash
npm run env:dev
npm run dev
```

Et validez la checklist au fur et à mesure! 🎉
