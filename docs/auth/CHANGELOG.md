# Journal des Modifications (Changelog)

Ce fichier retrace les évolutions majeures du système d'authentification et d'autorisation.

## [1.1.0] - Audit et Sécurisation (Actuel)
- **Sécurité** : Remplacement de `getSession()` par `getUser()` dans les Server Actions pour prévenir le spoofing.
- **Autorisation (RBAC)** : Création de `lib/auth/permissions.ts` et du guard `requireRoles`.
- **Autorisation (API)** : Sécurisation de toutes les API Routes (`/api/patients`, `/api/rdv`, `/api/dentistes`) avec validation des rôles.
- **Base de Données (RLS)** : Inclusion du rôle `admin` dans les politiques RLS existantes pour lui redonner l'accès aux écritures.
- **Base de Données (RLS)** : Sécurisation de la table `user_profiles` par des politiques RLS.
- **Nettoyage** : Suppression des logs de session en production.
- **Architecture** : Suppression du client admin dupliqué dans `server.ts`.
- **Documentation** : Création complète de la documentation d'architecture de sécurité.

## [1.0.0] - Implémentation Initiale
- Mise en place de Supabase Auth avec email/password.
- Création du `middleware.ts` pour la protection des routes.
- Ajout de la table `user_profiles` pour lier les comptes Auth aux entités métier.
- Ajout de la gestion des utilisateurs (rôle admin).
