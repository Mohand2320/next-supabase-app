# 👋 COMMENCEZ ICI

Bienvenue dans **DentiPro** - Gestion de cabinet dentaire avec Next.js + Supabase.

## ⚡ 3 étapes pour démarrer (5 min)

### ✅ Étape 1: Installation des packages
```bash
npm install
```

### ✅ Étape 2: Activer l'environnement DEV
```bash
npm run env:dev
```

### ✅ Étape 3: Lancer le serveur
```bash
npm run dev
# Ouvrez http://localhost:3000
```

**C'est tout!** 🎉

---

## 📚 Vous avez 3 minutes? Lisez ceci

👉 **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Les 3 commandes essentielles

---

## 📚 Vous avez plus de temps?

### Je suis nouveau(elle)
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (5 min)
2. [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md) (1-2 h)

### Je dois configurer Supabase
👉 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### Je dois comprendre l'architecture
👉 [ARCHITECTURE.md](./ARCHITECTURE.md)

### Je dois configurer DEV et PROD
👉 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

### Tout est fait, montrez-moi l'index
👉 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 🎯 À faire MAINTENANT

- [ ] **Créer 2 projets Supabase** (DentiPro-DEV et DentiPro-PROD)
- [ ] **Remplir `.env.development`** avec vos clés DEV
- [ ] **Remplir `.env.production`** avec vos clés PROD
- [ ] **Lancer** `npm install && npm run dev`

---

## 🔑 Vos clés Supabase

Vous les trouverez dans:  
**Supabase Dashboard** → Your Project → **Settings** → **API**

Vous avez besoin de:
- `Project URL`
- `Anon Key` (la clé publique avec "sb_publishable_...")
- `Service Role Key` (la clé secrète)

Remplissez-les comme ceci dans `.env.development`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Et pareil dans `.env.production` avec vos clés PROD.

---

## 💻 Commandes utiles

```bash
npm run dev              # Mode développement
npm run env:dev         # Basculer vers DEV
npm run env:prod        # Basculer vers PROD
npm run env:show        # Voir l'env actuel
npm run build           # Compiler
npm start               # Production local
npm run lint            # Vérifier le code
```

---

## 📚 Documentation

**11 fichiers de documentation disponibles:**

- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Essentials ⚡
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Setup complet 🔧
- [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md) - Checklist 📋
- [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) - Triggers expliqués 🔄
- [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md) - Tests ✅
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture 🏗️
- [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md) - Maintenance 🔧
- [TEAM_EXECUTION_GUIDE.md](./TEAM_EXECUTION_GUIDE.md) - Pour l'équipe 👥
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Index complet 📚
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Synthèse ✨
- [INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md) - Status final ✔️

---

## 🚀 Prochaines étapes

1. ✅ Créer 2 projets Supabase
2. ✅ Remplir `.env.development` et `.env.production`
3. ✅ Lancer `npm run dev`
4. 📖 Lire [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md)
5. 🧪 Tester avec [TESTING_TRIGGERS.md](./TESTING_TRIGGERS.md)

---

## ❓ Des questions?

| Question | Réponse |
|----------|---------|
| Comment démarrer? | Vous êtes ici! ✅ |
| Où sont les commandes? | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Ça ne marche pas | [QUICK_REFERENCE.md#-troubleshooting](./QUICK_REFERENCE.md#-problèmes-courants) |
| Documentation complète? | [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) |

---

## 🎉 Vous êtes prêt(e)!

```bash
npm run dev
```

Bon développement! 🏥💻
