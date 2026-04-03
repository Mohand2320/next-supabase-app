# 📚 DentiPro - Documentation Complète

## 🏥 Bienvenue dans DentiPro!

Bienvenue dans la gestion de base de données pour votre cabinet dentaire. Cette documentation vous guidera à travers:
- ✅ Configuration DEV/PROD
- ✅ Déploiement des tables et triggers
- ✅ Tests et validation
- ✅ Gestion des environnements

---

## 📖 Documents principaux

### 🚀 **Commencer rapidement**
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡
  - Les 3 commandes essentielles
  - Structure des fichiers d'environnement
  - Workflow DEV → PROD
  - Troubleshooting courants

### ⚙️ **Configuration complète**
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** 🔧
  - Comment créer deux projets Supabase
  - Récupérer vos clés API
  - Remplir `.env.development` et `.env.production`
  - Ordre de chargement des variables
  - Configuration pour Vercel

### 🗄️ **Gestion des Triggers**
- **[TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md)** 🔄
  - Explication détaillée des triggers
  - Comment les déployer dans DEV et PROD
  - Vérification que tout fonctionne
  - Troubleshooting des triggers

### 🧪 **Tests et Validation**
- **[TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md)** ✅
  - 4 tests pour vérifier les triggers
  - Via SQL Editor
  - Via l'application
  - Troubleshooting spécifique

### 📋 **Checklist d'installation**
- **[INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md)** 📝
  - Checklist complète en 4 phases
  - Pré-requis
  - Configuration étape-par-étape
  - Tests avant déploiement

### 🛠️ **Scripts disponibles**
- **[scripts/README.md](./scripts/README.md)** 📄
  - Documentation du script `switch-env.js`
  - Comment basculer entre DEV et PROD
  - Workflow recommandé

---

## 🎯 Par cas d'usage

### Je suis nouveau(elle) - Par où je commence?
1. Lire [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (5 min)
2. Suivre [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md) (30 min)
3. Tester avec [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md) (10 min)

### Je veux configurer DEV et PROD
1. Consulter [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
2. Créer deux projets Supabase
3. Remplir `.env.development` et `.env.production`
4. Utiliser `npm run env:dev` et `npm run env:prod`

### Je dois déployer les tables et triggers
1. Lire [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - section "Déployer les triggers"
2. Utiliser [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) comme guide pas-à-pas
3. Valider avec [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md)

### Quelque chose ne fonctionne pas!
1. Commencer par [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-problèmes-courants)
2. Puis [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md#-troubleshooting)
3. Pour les envs: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md#-sécurité---points-importants)

### Je dois basculer entre DEV et PROD
Voir [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-les-3-commandes-essentielles):
```bash
npm run env:dev   # Pour développement
npm run env:prod  # Pour production
npm run env:show  # Pour voir l'actuel
```

---

## 📁 Fichiers de configuration

```
next-supabase-app/
├── .env.development        ← Clés DEV
├── .env.production         ← Clés PROD
├── .env.local              ← Copy actuelle (NON commité)
├── .env.example            ← Template de documentation
├── create_tables.sql       ← Création des tables
├── supabase_rls_setup.sql ← Row Level Security
├── package.json            ← Scripts npm
└── scripts/
    └── switch-env.js       ← Utilitaire pour basculer env
```

---

## 🎓 Comprendre l'architecture

### Variables d'environnement
```
┌─────────────────────────────────────┐
│ 1. .env.development (DEV local)     │
│ 2. .env.production (PROD local)     │
│ 3. .env.local (copy active)         │
│ 4. Variables Vercel (online PROD)   │
└─────────────────────────────────────┘
     ↓
Next.js charge la première trouvée
     ↓
Application utilise cet environnement
```

### Triggers PostgreSQL
```
Table "patients" est modifiée
     ↓
Trigger "update_patients_updated_at" s'active
     ↓
Fonction "update_updated_at_column()" exécutée
     ↓
Colonne "updated_at" mise à jour automatiquement
     ↓
Vous n'avez rien à faire! 🎉
```

---

## ✅ Checklist de démarrage

- [ ] Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Run `npm install`
- [ ] Configure `.env.development` with DEV credentials
- [ ] Configure `.env.production` with PROD credentials
- [ ] Both Supabase projects created (DEV & PROD)
- [ ] Tables created in both Supabase projects
- [ ] Triggers deployed in both projects
- [ ] RLS enabled in both projects
- [ ] Run tests from [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md)
- [ ] Deployed to Vercel (optional)

---

## 📞 Support rapide

| Besoin | Solution |
|--------|----------|
| Commandes rapides | → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Configure un env | → [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) |
| Triggers ne marche pas | → [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) |
| Tester les triggers | → [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md) |
| Installation complète | → [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md) |
| Scripts npm | → [scripts/README.md](./scripts/README.md) |

---

## 🚀 Roadmap typique

```
Week 1: Setup & Development
├── npm install
├── npm run env:dev
├── npm run dev
└── Commencez à développer

Week 2: Configuration Supabase
├── Créez 2 projets Supabase
├── Déployez les tables (create_tables.sql)
├── Déployez les triggers
├── Testez avec TESTING_TRIGGERS.md
└── Vérifiez que tout marche

Week 3: Production
├── npm run env:prod
├── npm run build
├── npm start
├── Test en local avec PROD
└── Prêt à déployer!

Week 4+: Vercel Deployment
├── Push vers GitHub
├── Connectez à Vercel
├── Ajoutez variables d'env PROD
└── Déploiement automatique 🎉
```

---

## 💡 Tips importants

1. **Commencez par DEV** - Développez localement d'abord
2. **Test avant de basculer** - Testez tout en DEV avant PROD
3. **Les triggers c'est magique** - Vous n'avez rien à faire pour updated_at
4. **Documentation c'est votre ami** - Les 6 fichiers couvrent tout
5. **Vercel est simple** - Une fois configuré, c'est automatique

---

## 📚 Ressources externes

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🎉 Vous êtes prêt!

Commencez avec:
```bash
npm run env:dev
npm run dev
```

Puis consultez [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) pour les commandes essentielles.

Bon développement! 🏥💻
