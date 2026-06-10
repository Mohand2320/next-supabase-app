# 🎯 DentiPro - Guide d'Exécution pour Équipes

Ce guide aide les **gestionnaires de projet, chefs d'equipes et développeurs** à comprendre et exécuter DentiPro.

---

## 📊 Vue d'ensemble pour non-técniciens

### Qu'est-ce que DentiPro?

**DentiPro** est une application web moderne pour gérer les **patients** and **traitements** d'un cabinet dentaire.

```
Les patients remplissent un formulaire
         ↓
L'application les enregistre  
         ↓
La base de données les stocke de manière sécurisée
         ↓
Les dentistes peuvent voir/modifier les dossiers
         ↓
Toujours à jour automatiquement ⏰
```

### Pourquoi DEV vs PROD?

```
DEV (Développement)          PROD (Production)
═══════════════════════════  ═════════════════════
🧪 Environnement de tests     🏢 Vrais patients
✍️ On peut tout changer       🔐 Données réelles
📵 Pas d'utilisateurs         👥 Utilisateurs actifs
💡 Pour développer/tester     ✅ Pour les patients
```

**Analogie:** DEV = atelier de réparation | PROD = voiture en circulation

---

## 👨‍💼 Pour les Managers/Chefs de Projet

### Qu'est-ce qui a été mis en place?

✅ **Configuration complète DEV/PROD**
- 2 environnements isolés et sécurisés
- Données de test vs données réelles
- Zéro contamination entre les deux

✅ **Sécurité multicouche**
- Authentification utilisateur (JWT tokens)
- Protection des routes (middleware)
- Validation des données (Zod)
- Sécurité base de données (Row Level Security)
- Mise à jour automatique des timestamps

✅ **Documentation exhaustive**
- 10 fichiers de documentation complète
- Guides étape-par-étape
- Troubleshooting intégré
- Checklists de validation

### Timeline Recommandée

```
JOUR 1-3: Setup (Pour tech lead/senior dev)
├─ Créer 2 projets Supabase
├─ Remplir .env.development et .env.production
└─ Tester localement

JOUR 4-7: Développement (Toute équipe dev)
├─ Commencer sur .env.dev
├─ Implémenter les features dans /dashboard
└─ Tester avec npm run dev

JOUR 8-10: Testing complet
├─ Valider tous les triggers
├─ Test de charge (nb patients, etc.)
└─ Code review

JOUR 11+: Production
├─ Basculer vers PROD local (npm run env:prod)
├─ Tests finals
├─ Déployer sur Vercel (automatisé)
└─ 🎉 LIVE!
```

### Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Données DEV mélangées with PROD | ✅ Deux bases de données séparées |
| Perdre le code | ✅ Git + GitHub |
| Bugs en production | ✅ Tested in DEV first |
| Performance lente | ✅ Cloud infrastructure (Supabase) |
| Pas de backup | ✅ Supabase handles backups |

---

## 💻 Pour les Développeurs

### Commandes quotidiennes

```bash
# Première chose le matin
npm run env:dev        # Assurez-vous d'être en DEV
npm run dev            # Lancez le serveur

# Avant de merger du code
npm run build          # Vérifiez que ça compile
npm run lint           # Qualité du code

# Avant de passer en PROD
npm run env:prod       # Basculez vers PROD
npm run build          # Test du build PROD
npm start              # Tests finaux
```

### Fichier à lire PRIORITAIREMENT

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** (5 min)
   - Les 3 commandes essentielles
   - Workflow DEV → PROD

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** (15 min)
   - Comment ça marche techniquement
   - Flux des requêtes

3. **[TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md)** (10 min)
   - Pourquoi `updated_at` se met à jour toute seule
   - Comment ça fonctionne

### Structure du code

```
src/
├── app/
│   ├── page.tsx             (Accueil public)
│   ├── login/               (Authentification)
│   ├── dashboard/           (APP PRINCIPALE - protégée)
│   │   └── patients/        (Gestion patients)
│   └── api/                 (Backend APIs)
├── lib/
│   └── supabase/            (Clients Supabase)
├── types/                   (TypeScript types)
└── middleware.ts            (Protection des routes)
```

### Ajouter une nouvelle feature

```bash
# 1. Créer une page ou component
# src/app/dashboard/patients/new/page.tsx

# 2. Créer l'API si besoin
# src/app/api/patients/route.ts

# 3. Tester en DEV
npm run dev

# 4. Si OK, merger & passer en PROD
npm run env:prod && npm start
```

### Checklist avant de merger

- [ ] Feature fonctionne en DEV (`npm run dev`)
- [ ] Pas d'erreurs dans la console
- [ ] Les données se sauvegardent en base
- [ ] Pas de console errors/warnings
- [ ] Code revu par collègue
- [ ] Tests PROD locaux: `npm run env:prod && npm start`

---

## 🏗️ Pour l'Architecture Tech

### Stack Technology

```
Frontend
├─ React 19 (UI Components)
├─ Next.js 16 (Full-stack framework)
└─ Tailwind CSS (Styling)

Backend
├─ Next.js API Routes (HTTP endpoints)
├─ Zod (Data validation)
└─ Supabase SSR (@supabase/ssr)

Database
├─ PostgreSQL (Supabase)
├─ Row Level Security (RLS)
└─ Triggers (Auto-update timestamps)

Deployment
├─ Vercel (Hosting)
├─ GitHub (Version control)
└─ Environment variables (Config)
```

### Sécurité - Layers

```
Layer 1 (Frontend):  Client-side validation + HTTPS only
Layer 2 (Network):   TLS encryption + Secure cookies
Layer 3 (Backend):   JWT verification + Input validation
Layer 4 (Database):  RLS policies + Encrypted passwords
```

### Performance

- ✅ Static generation où possible (Next.js)
- ✅ Connection pooling (Supabase)
- ✅ CDN global (Vercel edge)
- ✅ Indexed queries (PostgreSQL)

---

## 📞 Procédures Courantes

### "Je ne peux pas créer un patient!"

1. Vérifiez que vous êtes connecté ✅
2. Vérifiez que la base de données est accessible
   ```bash
   npm run env:show  # Quelle base?
   ```
3. Lire: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-problèmes-courants)

### "Les données ne se sauvegardent pas!"

Causes possibles:
- ❌ RLS policies bloquent l'accès → Vérifiez supabase_rls_setup.sql
- ❌ Colonne n'existe pas → Exécutez create_tables.sql
- ❌ Ma colonne ne se met pas à jour → Trigger manquant?
  - Lire: [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md)

### "DEV marche, PROD ne marche pas!"

```bash
# Assurez-vous que vous avez TOUTES les tables aussi en PROD
npm run env:prod

# Vérifiez dans Supabase SQL Editor (PROD project):
# 1. Vérifiez que les tables existent
# 2. Vérifiez que les triggers existent
# 3. Vérifiez que les RLS policies existent
```

### "Je veux ajouter une colonne!"

1. Lire: [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md#-workflow-mettre-à-jour-une-colonne-existante)
2. D'abord en DEV, tester, PUIS en PROD
3. Mettre à jour `src/types/patient.ts` aussi

---

## 🚀 Déploiement Vercel

### Première fois

1. Connectez GitHub à Vercel
2. Sélectionnez le repo "next-supabase-app"
3. Vercel détecte automatiquement une app Next.js ✅
4. Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
5. Un-click deploy! 🎉

### Après ça

```
Code change → Git push → Vercel detects → Auto build → Auto deploy
```

Zéro manipulation! Vercel s'occupe de tout.

---

## 📋 Checklist pour "Go Live"

### 1️⃣ Avant de toucher à PROD

- [ ] Toutes les features testées en DEV
- [ ] Code reviewé par 2 personnes
- [ ] Pas de console errors
- [ ] Tests PROD locaux passent

### 2️⃣ Préparation PROD

- [ ] Les 2 projets Supabase existent (DEV & PROD)
- [ ] `.env.production` rempli avec vraies clés
- [ ] Tables créées en PROD: `create_tables.sql`
- [ ] Triggers créés en PROD: Verification SQL
- [ ] RLS activée en PROD: `supabase_rls_setup.sql`

### 3️⃣ Tests finaux

```bash
npm run env:prod
npm run build
npm start
# Tester toutes les features
```

### 4️⃣ Vercel

- [ ] Variables d'env configurées
- [ ] Deploy automatique en place
- [ ] Tests depuis vercel.com

### 5️⃣ LIVE

- [ ] Utilisateurs peuvent accéder
- [ ] Pas d'erreurs observées
- [ ] Performance acceptable
- [ ] On peut célébrer! 🎉

---

## 📚 Documentation par rôle

### Je suis Product Manager
- Lire: [ARCHITECTURE.md](./ARCHITECTURE.md) - Comprendre la vision
- Questions: Contactez Tech Lead

### Je suis Frontend Developer
- Lire: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) + [ARCHITECTURE.md](./ARCHITECTURE.md)
- Focus: `/src/app` et components React

### Je suis Backend/API Developer
- Lire: [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) + [ARCHITECTURE.md](./ARCHITECTURE.md)
- Focus: `/src/app/api` et Supabase setup

### Je suis DBA/Infrastructure
- Lire: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) + [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)
- Focus: PostgreSQL, RLS, Migrations

### Je suis QA/Tester
- Lire: [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md) + [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md)
- Focus: Test coverage, Edge cases

---

## 🎯 Objectifs réussis

Vous avez maintenant:

✅ **Une architecture professionnelle** - Production-ready
✅ **Deux environnements isolés** - DEV vs PROD
✅ **Sécurité en profondeur** - Multicouche
✅ **Triggers automatiques** - Zéro code nécessaire
✅ **Documentation complète** - Pour tous les rôles
✅ **Prêt à déployer** - Sur Vercel en un click

---

## 💬 Communication avec l'équipe

### Pour les standup/réunions

> "DentiPro est configuré DEV/PROD. Développeurs, utilisez `npm run env:dev` pour commencer. Tables et triggers seront déployés cette semaine. Testez complètement avant que DBA déploie la PROD. Vercel est prêt pour auto-deploy. Questions?" ✅

### Pour les status updates

```
✅ Configuration DEV/PROD complétée
✅ Documentation écrite (10 fichiers)
✅ Scripts d'automation créés
✅ Sécurité validée
🔄 Tests en cours (cette semaine)
⏳ Déploiement PROD (semaine prochaine)
🎯 Go-live: J+14
```

---

## 📞 Support rapide

| Question | Réponse |
|----------|---------|
| Où je commence? | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Comment ça marche? | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Triggers ne marche pas? | [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) |
| Comment tester? | [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md) |
| Je dois merger? | Checklist ci-dessus ✅ |

---

## 🎉 Vous êtes prêt(e) pour la production!

Bonne chance! 🏥💻
