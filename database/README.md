# Base de Données — Cabinet Dentaire (Supabase)

Ce répertoire contient la définition complète et consolidée du schéma PostgreSQL de l'application, organisée de manière modulaire.

## Structure

L'ordre des fichiers dans le dossier `schema/` est conçu pour pouvoir être exécuté séquentiellement sans erreurs de dépendances :

1. **`01_extensions.sql`** : Activation des extensions PostgreSQL (`uuid-ossp`, `pgcrypto`, `pg_trgm`).
2. **`02_enums.sql`** : Définition des types énumérés métier.
3. **`03_tables.sql`** : Création des tables et de leurs relations (clés étrangères).
4. **`04_indexes.sql`** : Création des index pour l'optimisation des requêtes.
5. **`05_functions.sql`** : Fonctions utilitaires, helpers RLS et fonctions métier (ex: conversion de RDV en Séance).
6. **`06_triggers.sql`** : Mise en place des déclencheurs (ex: auto-update des dates `updated_at`).
7. **`07_views.sql`** : Vues SQL consolidées pour faciliter l'accès aux données.
8. **`08_rls_policies.sql`** : Règles de sécurité d'accès aux lignes (Row Level Security).

Le dossier `seed/` contient les données initiales :
- **`seed.sql`** : Insertion du catalogue des actes médicaux de base.

## Notes sur la Sécurité et l'Administration (RLS)

- Les utilisateurs s'authentifient via Supabase Auth (table `auth.users`).
- Une entrée correspondante est gérée dans la table métier `user_profiles`.
- Un utilisateur peut avoir le `role` `'dentiste'` ou `'assistant'`.
- Les droits administrateurs sont gérés de manière transversale via la colonne booléenne `is_admin`.
- Toutes les politiques RLS intègrent la vérification `current_user_is_admin()` pour s'assurer que les administrateurs ont accès aux ressources indépendamment de leur rôle clinique.
