# Documentation Authentification & Autorisation

Bienvenue dans la documentation du système d'authentification et d'autorisation de l'application **DentiPro**. 
Cette section décrit les mécanismes de sécurité, la gestion des sessions, le contrôle d'accès basé sur les rôles (RBAC) et la politique de sécurité des données (RLS).

## Index de la Documentation

- [1. Architecture et Flux de données](./ARCHITECTURE.md)
- [2. Authentification](./AUTHENTICATION.md)
- [3. Autorisation et Permissions](./AUTHORIZATION.md)
- [4. Role-Based Access Control (RBAC)](./RBAC.md)
- [5. Row Level Security (RLS)](./RLS.md)
- [6. Gestion des Sessions](./SESSION_MANAGEMENT.md)
- [7. Sécurité & Audit](./SECURITY.md)
- [8. Cycle de vie Utilisateur](./USER_LIFECYCLE.md)
- [9. Journal des Modifications](./CHANGELOG.md)

## Technologies Utilisées

- **Next.js 15 (App Router)**
- **Supabase Auth** (Fournisseur d'identité)
- **Supabase PostgreSQL** (Base de données)
- **JSON Web Tokens (JWT)** (Session et sécurité)

## Rôles Supportés

Le système repose sur trois rôles principaux :
1. **Administrateur** (`admin`) : Gestion globale du système et des accès.
2. **Chirurgien-dentiste** (`dentiste`) : Accès complet aux dossiers médicaux et consultations.
3. **Assistant(e)** (`assistant`) : Gestion de l'agenda et des dossiers administratifs.
