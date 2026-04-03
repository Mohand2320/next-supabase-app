# ⚡ Quick Reference - Gestion DEV/PROD

## 📌 Les 3 commandes essentielles

```bash
# 1. Voir l'environnement actuel
npm run env:show

# 2. Basculer vers DEV (développement)
npm run env:dev
npm run dev

# 3. Basculer vers PROD (test local)
npm run env:prod
npm run build && npm start
```

---

## 🗂️ Structure des fichiers d'environnement

```
next-supabase-app/
├── .env.development    ← Variables DEV (commité)
├── .env.production     ← Variables PROD (commité)
├── .env.local          ← Copy active (NON commité) ⚠️
└── .env.example        ← Template de documentation
```

---

## 🔧 Comment changer d'environnement?

### Depuis CLI (Terminal)

```bash
# DEV
npm run env:dev

# PROD
npm run env:prod

# Afficher actuel
npm run env:show
```

### Ou manuellement

Copez `.env.development` → `.env.local` (pour DEV)
Copez `.env.production` → `.env.local` (pour PROD)

---

## 🎯 Workflow type: DEV → PROD

```bash
# Jour 1-7: Développement
npm run env:dev        # ← Basculer vers DEV
npm run dev            # ← Lancer le serveur

# Tests locaux
# Modifiez des patients
# Vérifiez que tout marche

# Jour 8: Prêt pour PROD?
npm run env:prod       # ← Basculer vers PROD
npm run build          # ← Compiler
npm start              # ← Tester PROD localement

# Si tout marche:
# Déployer sur Vercel (variables PROD déjà là)
```

---

## 🔑 Où récupérer vos clés Supabase?

Pour chaque projet (DEV et PROD):

1. Dashboard Supabase → [Votre projet]
2. Settings → API
3. Copez:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📋 Checklist avant de déployer en PROD

- [ ] ✅ `npm run env:prod` exécuté
- [ ] ✅ `npm run build` sans erreur
- [ ] ✅ `npm start` fonctionne localement
- [ ] ✅ Vous pouvez créer/modifier des patients
- [ ] ✅ `updated_at` se met à jour automatiquement
- [ ] ✅ Pas d'erreurs dans la console

---

## 🆘 Problèmes courants

| Problème | Solution |
|----------|----------|
| Erreur: `Missing SUPABASE_SERVICE_ROLE_KEY` | Vérifiez votre `.env.development` ou `.env.production` |
| Impossible de se connecter | L'URL Supabase est mauvaise ou les credentials sont incorrects |
| `updated_at` ne se met pas à jour | Vérifiez les triggers dans Supabase SQL Editor |
| Erreur lors du build | Vérifiez que les variables d'env sont toutes présentes |

---

## 📚 Pour en savoir plus

- **Setup détaillé** → [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Triggers expliqués** → [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md)
- **Scripts disponibles** → [scripts/README.md](./scripts/README.md)
- **Checklist complète** → [INSTALLATION_CHECKLIST.md](./INSTALLATION_CHECKLIST.md)

---

## 💾 Variables d'environnement expliquées

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Clé pour les clients (applications) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Clé admin pour API Backend ⚠️ |
| `SUPABASE_DB_URL` | Secret | Connexion directe PostgreSQL (optionnel) |

> **⚠️ Important**: Les variables avec `NEXT_PUBLIC_` sont visibles publiquement. Les autres doivent rester secrètes!

---

## 🧪 Tester rapidement

```bash
# 1. Basculer env
npm run env:dev

# 2. Lancer
npm run dev

# 3. Aller à http://localhost:3000

# 4. Vérifier dans navigateur Console (F12)
# Ne doit pas y avoir d'erreurs Supabase
```

---

Besoin de clarifications? Consultez les fichiers de documentation détaillés! 📖
