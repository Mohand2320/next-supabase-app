# 🏗️ Architecture DentiPro

## 📊 Vue d'ensemble globale

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigateur (Client)                       │
│  (React Components, State Management, UI)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Server (App Router)                     │
├─────────────────────────────────────────────────────────────┤
│  Server Components   │  Route Handlers  │  Middleware        │
│  ✅ SSR Secure       │  ✅ API Auth    │  ✅ Session Check   │
└────────────┬─────────┴────────┬─────────┴─────────┬──────────┘
             │                  │                    │
             ▼                  ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│          Supabase Client (SSR Pattern)                       │
│  └─ Cookie-based Sessions                                    │
│  └─ Token Refresh Transparent                                │
└────────────┬─────────────────────────────────────────────────┘
             │ PostgreSQL Protocol
             ▼
┌──────────────────────────────────────────────────────────────┐
│           PostgreSQL Database (Supabase)                     │
├──────────────────────────────────────────────────────────────┤
│  Tables          │  Row Level Security  │  Triggers         │
│  ├─ patients     │  ├─ SELECT          │  └─ update_       │
│  ├─ treatments   │  ├─ INSERT          │    updated_at      │
│  ├─ users        │  ├─ UPDATE          │                   │
│  └─ sessions     │  └─ DELETE          │  (Auto timestamps)│
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Couches de sécurité

```
┌─────────────────────────────────────────────────────────────┐
│ Couche 1: Authentification & Sessions                       │
│ • Supabase Auth (Google, Email, etc.)                       │
│ • JWT Tokens stockés dans cookies sécurisés                 │
│ • Auto-refresh transparent                                  │
└─────────────────────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Couche 2: Middleware Global                                 │
│ • Vérifie session sur chaque requête                        │
│ • Redirige /dashboard vers /login si non-auth              │
│ • Bloque l'accès aux pages protégées                       │
└─────────────────────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Couche 3: API Routes & Validation                           │
│ • Zod valide tous les inputs                               │
│ • Vérification d'auth sur chaque endpoint                  │
│ • Sanitization des données d'entrée                        │
└─────────────────────────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Couche 4: Row Level Security (RLS)                          │
│ • Politiques SQL strictes au niveau base de données         │
│ • Utilisateur ne voit que ses propres données              │
│ • Impossible de bypass (sécurité au niveau BD)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌍 Environnements DEV et PROD

```
LOCAL DEVELOPMENT                  PRODUCTION (Vercel)
═══════════════════════════════════════════════════════

.env.development              .env.production
       │                            │
       ▼                            ▼
   .env.local                   env vars Vercel
       │                            │
       ▼                            ▼
┌──────────────┐            ┌──────────────┐
│ Supabase DEV │            │ Supabase     │
│ (DentiPro-   │  ← Dev     │ PROD         │
│  DEV)        │  ← Testing │ (DentiPro-   │
│              │            │  PROD)       │
│ • Fresh DB   │            │              │
│ • Test Data  │            │ • Real Data  │
│ • Triggers ✅ │            │ • Triggers ✅ │
│ • RLS ✅      │            │ • RLS ✅     │
└──────────────┘            └──────────────┘
```

---

## 📋 Structure des fichiers clés

```
next-supabase-app/
│
├── 📁 src/
│   ├── app/
│   │   ├── page.tsx              (Page d'accueil publique)
│   │   ├── login/
│   │   │   └── page.tsx          (Login)
│   │   ├── dashboard/
│   │   │   ├── page.tsx          (Dashboard protégé)
│   │   │   └── patients/
│   │   │       ├── page.tsx      (Liste des patients)
│   │   │       ├── [id]/
│   │   │       │   ├── page.tsx  (Détails patient)
│   │   │       │   └── edit/     (Modifier patient)
│   │   │       └── new/          (Créer patient)
│   │   │
│   │   └── api/                  (API Routes)
│   │       └── patients/
│   │           ├── route.ts      (GET/POST patients)
│   │           └── [id]/
│   │               ├── route.ts  (GET/PUT/DELETE patient)
│   │               └── treatments/
│   │                   └── route.ts
│   │
│   ├── lib/           (Utilitaires)
│   │   ├── supabase/
│   │   │   ├── client.ts         (Client-side Supabase)
│   │   │   └── server.ts         (Server-side Supabase)
│   │   └── validations/
│   │       └── patient.ts        (Zod schemas)
│   │
│   ├── types/         (TypeScript interfaces)
│   │   └── patient.ts
│   │
│   └── middleware.ts  (Middleware global)
│
├── 📄 create_tables.sql         (Schéma DB)
├── 📄 supabase_rls_setup.sql    (Politiques RLS)
└── 📄 package.json              (Dépendances)
```

---

## 🔄 Flux d'une requête (Exemple: Créer un patient)

```
1. Utilisateur clique "Créer"
                │
                ▼
2. Formulaire valide localement (Zod)
                │
                ▼
3. POST /api/patients avec les données
                │
                ▼
4. Middleware vérifie la session
    ├─ Session valide? NON → Redirection /login
    └─ Session valide? OUI → Continue
                │
                ▼
5. API Route handler s'exécute
    ├─ Valide à nouveau avec Zod (Défense en profondeur)
    ├─ Récupère l'auth user_id de la session
    ├─ Appelle: supabase.from('patients').insert({...})
    │   (Supabase client côté serveur)
    └─
                │
                ▼
6. Supabase Server-Side Client envoie la requête
    ├─ Ajoute le JWT token à l'header Authorization
    └─ Envoie la requête au serveur Supabase
                │
                ▼
7. Base de données PostgreSQL reçoit la requête
    ├─ Applique les Politiques RLS
    │  (Vérification: user_id === auth.uid())
    ├─ Insère la nouvelle ligne
    │
    ├─ 🔄 TRIGGER s'active!
    │   (update_patients_updated_at)
    │   └─ La colonne 'updated_at' = now()
    │
    └─ Retourne la nouvelle ligne créée
                │
                ▼
8. Supabase retourne la réponse au serveur
                │
                ▼
9. Next.js retourne JSON au client
                │
                ▼
10. React updates l'UI avec le nouveau patient ✅
```

---

## 🗄️ Schéma Base de Données

```
┌──────────────────────────────────────┐
│              PATIENTS                 │
├──────────────────────────────────────┤
│ id (UUID, PK)                        │
│ name (TEXT)                          │
│ email (TEXT, UNIQUE)                 │
│ phone (TEXT)                         │
│ date_of_birth (DATE)                 │
│ address (TEXT)                       │
│ user_id (UUID, FK → auth.users)      │
│ created_at (TIMESTAMP)               │
│ updated_at (TIMESTAMP) ← AUTO UPDATE │
│                                      │
│ RLS Policies:                        │
│ └─ Users see only their patients     │
│                                      │
│ Trigger:                             │
│ └─ update_patients_updated_at        │
│    (Met à jour updated_at à each)    │
└──────────────────────────────────────┘
       │
       │ 1 : N
       ▼
┌──────────────────────────────────────┐
│            TREATMENTS                 │
├──────────────────────────────────────┤
│ id (UUID, PK)                        │
│ patient_id (UUID, FK → PATIENTS.id)  │
│ treatment_name (TEXT)                │
│ cost (DECIMAL)                       │
│ date (DATE)                          │
│ user_id (UUID, FK → auth.users)      │
│ created_at (TIMESTAMP)               │
│ updated_at (TIMESTAMP)               │
│                                      │
│ RLS Policies:                        │
│ └─ Users see treatment of their      │
│    patients only                     │
└──────────────────────────────────────┘
```

---

## 🔄 Cycle de vie d'une mise à jour (Trigger)

```
Modification en cours de 'patients' table
                │
                ▼
    BEFORE UPDATE trigger s'active
                │
                ▼
  Fonction: update_updated_at_column()
                │
                ├─ Récupère la nouvelle ligne (NEW)
                │
                ├─ Définit: NEW.updated_at = now()
                │
                └─ Retourne la ligne modifiée (NEW)
                │
                ▼
    La ligne est mise à jour avec updated_at nouveau
                │
                ▼
    Base de données retourne la nouvelle ligne
```

**Résultat:** Aucune modification de code Next.js nécessaire! ✨

---

## 🛡️ Sécurité - Couches multiples

```
Layer 1: Client-Side
├─ Validation Zod
├─ CSRF Protection (Next.js)
└─ HTTPS only

Layer 2: Network
├─ TLS Encryption
└─ Secure Cookies (httpOnly, Secure)

Layer 3: API Server
├─ Authentication (JWT)
├─ Input Validation (Zod)
├─ Rate Limiting (Optionnel)
└─ Request Logging

Layer 4: Database
├─ Row Level Security (RLS)
├─ Encrypted Passwords
└─ Audit Logs (Optionnel)
```

---

## 📈 Performance & Scalability

```
Local Development:
├─ npm run dev         (Hot reload, Fast iteration)
└─ .env.development   (DEV Supabase)

Production:
├─ npm run build      (Static generation where possible)
├─ npm run start      (Production server)
└─ Vercel CDN         (Global edge infrastructure)

Database:
├─ Connection pooling (Supabase handles)
├─ Indexes on FK      (Optimized queries)
└─ RLS cached         (PostgreSQL optimizations)
```

---

## 🚀 Déploiement

```
GitHub Repo
     │
     ▼
Vercel (connected)
     │
     ├─ Compile & Build
     ├─ Récupère env vars
     │  (NEXT_PUBLIC_SUPABASE_URL, etc.)
     │
     └─ Deploy sur CDN global
           │
           ▼
     Accessible via dentipro.vercel.app
```

---

Pour comprendre les triggers en détail, voir [TRIGGERS_GUIDE.md](./TRIGGERS_GUIDE.md) 📖
Pour le workflow DEV/PROD, voir [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) 🔧
