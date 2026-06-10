# 🔧 Guide des Environnements DEV et PROD

## 📋 Structure

```
next-supabase-app/
├── .env.local        # Priorité maximale (ignoré par git) ⚠️
├── .env.development  # Environnement DEV (npm run dev)
├── .env.production   # Environnement PROD (npm run build/start)
└── .env.example      # Template - COMMITÉ pour documentation
```

## 🎯 Comment ça fonctionne

### 1️⃣ Ordre de chargement de Next.js
Next.js charge les variables d'environnement dans cet ordre (première trouvée = utilisée) :

```
1. .env.local                    ← Plus haute priorité
2. .env.$NODE_ENV (.dev/.prod)   ← DEV ou PROD selon le contexte
3. .env                          ← Base commune
4. .env.local.development
5. .env.local.production
```

### 2️⃣ Utiliser chaque environnement

#### 🚀 Pour le DÉVELOPPEMENT :
```bash
npm run dev
```
✅ Charge automatiquement `.env.development`

#### 🏭 Pour la PRODUCTION (local) :
```bash
npm run build && npm start
```
✅ Charge automatiquement `.env.production`

#### 📦 Pour la PRODUCTION (Vercel/autres) :
```bash
npm run build
```
✅ Utilise les variables d'environnement du dashboard CI/CD

---

## 📝 Configuration étape par étape

### ÉTAPE 1: Créer deux projets Supabase

1. Accédez à [supabase.com](https://supabase.com)
2. Créez **2 projets** :
   - **DentiPro-DEV** : Pour développement local
   - **DentiPro-PROD** : Pour production

### ÉTAPE 2: Récupérer vos coordonnées

Pour chaque projet Supabase (DEV et PROD) :

1. Allez sur **Settings** → **API**
2. Notez ces 2 clés :
   ```
   🔑 Project URL
   🔑 Anon Key (public - peut être exposée)
   🔑 Service Role Key (secret - à protéger!)
   ```

### ÉTAPE 3: Remplir les fichiers .env

#### **`.env.development`** (DEV)
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_votre_dev_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (votre clé DEV)
```

#### **`.env.production`** (PROD)
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_votre_prod_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (votre clé PROD)
```

### ÉTAPE 4: Tester

```bash
# Tester DEV
npm run dev          # Devrait utiliser DB DEV

# Tester PROD localement
npm run build
npm start           # Devrait utiliser DB PROD

# Vérifier quelle clé est utilisée
echo $NEXT_PUBLIC_SUPABASE_URL  # Affiche l'URL active
```

---

## ⚠️ Sécurité - Points importants

- ✅ **À COMMITTER** : `.env.example`
- ❌ **À IGNORER** : `.env*` (déjà dans .gitignore)
- 🔐 La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être exposée au client
- 🔒 Sur Vercel/production : définissez les variables via le dashboard (jamais dans git)

---

## 🧪 Vérifier l'environnement actif

Ajoutez ce code temporaire dans votre app pour déboguer :

```tsx
// src/app/page.tsx (à titre temporaire)
export default function Home() {
  const env = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDev = env?.includes('-dev');
  
  return (
    <div>
      <h1>Environnement: {isDev ? '🟢 DEV' : '🔴 PROD'}</h1>
      <p>URL: {env}</p>
    </div>
  );
}
```

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
