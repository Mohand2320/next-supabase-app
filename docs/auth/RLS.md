# Row Level Security (RLS)

PostgreSQL Row Level Security (RLS) est la dernière ligne de défense de l'application. 
Elle garantit que même si une API est compromise, l'accès aux données reste restreint.

## Fonctions d'Aide RLS

Deux fonctions SQL sécurisées (Security Definer) sont utilisées dans les politiques :
- `current_user_role()` : Retourne le rôle de l'utilisateur connecté depuis `user_profiles`.
- `current_dentiste_id()` : Retourne l'ID du dentiste de l'utilisateur connecté (si applicable).

## Politiques (Policies)

### `user_profiles`
- **SELECT** : Un utilisateur peut lire son propre profil. L'administrateur peut lire tous les profils.
- **UPDATE** : Seul l'administrateur peut modifier un profil (notamment pour (dés)activer `is_active`).

### `patients` & `rendez_vous`
- **SELECT** : Tout utilisateur authentifié (admin, dentiste, assistant).
- **INSERT** / **UPDATE** : Dentistes, Assistants et Admins.
- **DELETE** : Dentistes et Admins uniquement.

### `seances` & `actes_medicaux`
- **SELECT** : Tout utilisateur authentifié.
- **INSERT** / **UPDATE** / **DELETE** : Dentistes et Admins uniquement.

## Contournement du RLS (Bypass)

Le client `supabaseAdmin` (utilisant `SERVICE_ROLE_KEY`) est utilisé exclusivement dans les Server Actions d'administration (ex: `admin.service.ts`) pour créer des utilisateurs et assigner le rôle initial, car un utilisateur non encore créé ne peut pas avoir de droits RLS.
