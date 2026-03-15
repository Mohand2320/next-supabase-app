# Next.js 16 + Supabase Security App

Une application Next.js 16 moderne, performante et ultra-sécurisée utilisant Supabase pour l'authentification et la base de données.

## 🛡️ Architecture de Sécurité

Cette application implémente une stratégie de sécurité multicouche ("Defense in Depth") :

### 1. Authentification & Sessions (SSR)
- **Supabase SSR (`@supabase/ssr`)** : Utilisation de la dernière bibliothèque de Supabase pour une gestion robuste des sessions côté serveur via les cookies.
- **Dual-Client Pattern** :
  - `src/lib/supabase/client.ts` : Client dédié pour le code s'exécutant dans le navigateur (Client Components).
  - `src/lib/supabase/server.ts` : Client sécurisé pour le code serveur (Server Components, Route Handlers).

### 2. Protection des Routes (Middleware)
- **Middleware Global (`src/middleware.ts`)** : 
  - Intercepte toutes les requêtes pour vérifier la session.
  - Protège automatiquement le répertoire `/dashboard`.
  - Redirige les utilisateurs non-authentifiés vers `/login`.
  - Rafraîchit les tokens de session de manière transparente.

### 3. API & Validation des Données
- **Validation avec Zod** : Toutes les routes API utilisent `Zod` pour valider les schémas de données, sanitizer les inputs et prévenir les injections.
- **Vérification d'Auth Serveur** : Chaque point de terminaison API vérifie l'identité de l'utilisateur avant toute interaction avec la base de données.

### 4. BDD - Row Level Security (RLS)
- **Isolation des données** : Politiques SQL strictes définies dans `supabase_rls_setup.sql`.
- Un utilisateur ne peut voir, modifier ou supprimer que ses propres données (Patients et Traitements).

### 5. Headers de Sécurité HTTP
Configuration avancée dans `next.config.mjs` :
- **CSP (Content Security Policy)** : Protection contre les attaques XSS.
- **HSTS** : Force les connexions HTTPS.
- **X-Frame-Options** : Protection contre le Clickjacking.
- **Referrer-Policy** & **MIME Sniffing Prevention**.

---

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd next-supabase-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Variables d'environnement**
   Créez un fichier `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key (Serveur uniquement)
   ```

4. **Configuration de la Base de Données**
   - Exécutez `create_tables.sql` dans votre dashboard Supabase.
   - **Important** : Exécutez `supabase_rls_setup.sql` pour activer la sécurité des données.

5. **Lancer le serveur**
   ```bash
   npm run dev
   ```

## 🛠️ Stack Technique
- **Framework** : Next.js 16 (App Router)
- **Auth/Database** : Supabase
- **Validation** : Zod
- **Style** : Tailwind CSS
- **Icons/Animations** : Lucide React, Framer Motion
