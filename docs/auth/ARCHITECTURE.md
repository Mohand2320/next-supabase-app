# Architecture du Système d'Authentification

L'architecture de sécurité de DentiPro est hybride, combinant la robustesse de **Supabase Auth** pour l'identité et **Next.js App Router** pour le contrôle d'accès côté serveur (SSR).

## Composants de l'Architecture

```mermaid
graph TD
    Client[Navigateur Client] --> |Requête HTTP| Middleware[Next.js Edge Middleware]
    Middleware --> |JWT Session| API[API Routes / Server Actions]
    Middleware --> |Vérification Session| SupabaseAuth[Supabase Auth API]
    API --> |Guard (requireRoles)| AuthGuard[Module d'Autorisation]
    AuthGuard --> |Validation Rôle| SupabaseDB[(Supabase PostgreSQL)]
    API --> |Requête SQL + RLS| SupabaseDB
```

### 1. Supabase Auth (Fournisseur d'Identité)
Supabase gère :
- La création de comptes (`auth.users`)
- Le stockage sécurisé des mots de passe (hachage bcrypt)
- La génération et la rotation des JWT
- La délivrance de cookies sécurisés

### 2. Middleware Next.js (`src/middleware.ts`)
Le middleware s'exécute à la périphérie (Edge) sur chaque requête :
- **Authentification** : Vérifie la validité du JWT via `supabase.auth.getUser()`
- **Statut du compte** : Vérifie la colonne `is_active` dans la base de données
- **Redirection** : Renvoie les utilisateurs non-authentifiés vers `/login` et les utilisateurs connectés hors des pages publiques.

### 3. Contrôle d'Accès Côté Serveur (Guards)
Les Server Actions et API Routes utilisent la fonction `requireRoles` (`src/lib/auth/guards.ts`) pour s'assurer que l'utilisateur a non seulement une session valide, mais également le rôle requis pour l'action demandée (RBAC).

### 4. Supabase Clients (`src/lib/supabase`)
Le projet implémente trois clients distincts pour garantir la séparation des privilèges :
- `createClientBrowser` (`client.ts`) : Pour les composants côté client. (Utilise `ANON_KEY`)
- `createClientServer` (`server.ts`) : Pour les composants côté serveur et API. Gère la transmission des cookies. (Utilise `ANON_KEY`)
- `supabaseAdmin` (`admin.ts`) : Utilise la `SERVICE_ROLE_KEY` pour contourner le RLS. Réservé aux actions administratives (ex: création d'utilisateurs).
