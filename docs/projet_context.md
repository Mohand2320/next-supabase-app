Viewed schema-clean.sql:316-334

Voici un bloc de texte complet et structuré, spécialement conçu pour être copié-collé et donner un contexte maximal à un Agent IA. Ce prompt lui permettra de comprendre l'architecture, la stack technique, et les règles métiers pour travailler efficacement et sans casser l'existant.

```text
# CONTEXTE DU PROJET — APPLICATION DE GESTION DE CABINET DENTAIRE

## 1. Description Générale
L'application est un SaaS B2B destiné à la gestion complète d'un cabinet dentaire (patients, agenda, rendez-vous, séances de soins, catalogue d'actes, gestion des finances, et gestion des accès utilisateurs). Elle gère plusieurs niveaux d'utilisateurs avec des droits stricts.

## 2. Stack Technique
- **Framework Front/Back :** Next.js (App Router)
- **Langage :** TypeScript (strict)
- **Styling :** Tailwind CSS + icônes Lucide React
- **Backend as a Service (BaaS) :** Supabase
  - **Base de données :** PostgreSQL (fortement typée avec clés étrangères, contraintes CHECK et triggers)
  - **Authentification :** Supabase Auth
  - **Sécurité des données :** Row Level Security (RLS) très strict
- **Méthode de fetch/mutation :** Server Actions (Next.js) et Supabase SSR

## 3. Architecture du Code source
- `/src/app/` : Structure des routes (App Router). Ex: `/login`, `/dashboard/*`.
- `/src/components/` : Composants UI réutilisables.
- `/src/lib/supabase/` : Clients d'initialisation de Supabase :
  - `client.ts` : Client navigateur (`createClientBrowser`).
  - `server.ts` : Client serveur avec cookies (`createClientServer`).
  - `admin.ts` : Client avec privilèges complets bypassant le RLS (`createClientAdmin` utilisant `SERVICE_ROLE_KEY` - à utiliser UNIQUEMENT pour la gestion des utilisateurs/auth).
- `/src/services/` : Contient toutes les Server Actions qui interagissent avec Supabase (ex: `user.service.ts`, `admin.service.ts`).
- `/src/types/` : Typages TypeScript stricts.
- `/sql/` : Scripts de base de données (Schéma complet, migrations, manuels SQL).

## 4. Modèle d'Authentification et Rôles (RBAC)
Le système d'accès est doublement sécurisé (Next.js Middleware + Supabase RLS).
- **auth.users :** Géré par Supabase.
- **user_profiles :** Table liée à auth.users(id) qui définit le rôle.
- **Rôles disponibles (1 seul rôle possible par compte) :**
  - `dentiste` : Accès métier complet (ajout, modif, suppression de patients/RDV, gestion des soins et catalogue). Possède un `dentiste_id`.
  - `assistant` : Accès métier limité (ne peut pas supprimer, ne gère pas le catalogue/actes). Possède un `assistant_id`.
  - `admin` : Aucun accès métier, mais gère la table `user_profiles` et invite les utilisateurs.
- **Désactivation :** La colonne `is_active` (boolean) dans `user_profiles` gère l'activation. Le Middleware Next.js déconnecte automatiquement un profil inactif.

## 5. Règles STRICTES pour l'Agent IA
1. **NE JAMAIS SUPPRIMER DE CODE EXISTANT SANS RAISON :** Conserver la logique de layout, le middleware, et les clients Supabase tels quels.
2. **Server Actions First :** Toute opération d'écriture (INSERT, UPDATE, DELETE) doit se faire via une Server Action (avec `'use server'`) dans le dossier `/src/services/`.
3. **Sécurité RLS :** Supabase rejette silencieusement (renvoie un tableau vide) ou bloque avec une erreur (42501) toute requête qui viole le RLS. Toujours interroger la base via `createClientServer()` pour respecter le RLS du compte connecté, SAUF pour la gestion des accès où `createClientAdmin()` est requis.
4. **Typage TypeScript :** Ne pas utiliser de `any`. Toujours s'appuyer sur les interfaces définies dans `/src/types/`. Si le schéma DB change, mettre à jour TypeScript.
5. **UI / UX :** Garder l'esthétique existante basée sur Tailwind CSS (designs propres, cartes blanches, bordures légères `slate-200`, boutons modernes, responsive).
6. **Langue :** L'interface utilisateur, la base de données (tables, colonnes), et les commentaires du code doivent obligatoirement être en Français.
```