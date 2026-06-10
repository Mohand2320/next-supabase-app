# 🔧 Scripts de gestion des environnements

Ce dossier contient les scripts d'automatisation pour DentiPro.

## `switch-env.js` - Gestion DEV/PROD

Script pour basculer facilement entre les bases de données DEV et PROD.

### 🎯 Utilisation

```bash
# Basculer vers DEV
npm run env:dev
node scripts/switch-env.js dev

# Basculer vers PROD
npm run env:prod
node scripts/switch-env.js prod

# Afficher l'environnement actuel
npm run env:show
node scripts/switch-env.js show
```

### ⚡ Raccourcis npm

Les commandes suivantes sont disponibles dans `package.json` :

```json
{
  "scripts": {
    "env:dev": "node scripts/switch-env.js dev",
    "env:prod": "node scripts/switch-env.js prod",
    "env:show": "node scripts/switch-env.js show"
  }
}
```

### 📝 Workflow recommandé

```bash
# 1. Installer les dépendances
npm install

# 2. Basculer vers DEV
npm run env:dev

# 3. Lancer le serveur de développement
npm run dev

# 4. Quand vous êtes prêt pour PROD
npm run env:prod
npm run build
npm start
```

### 🔐 Sécurité

- Le script crée `.env.local` depuis `.env.development` ou `.env.production`
- `.env.local` est ignoré par `.gitignore` (jamais commité)
- Vos clés SECRET restent protégées localement
