# Gestion des rôles et autorisations

Ce document résume comment les rôles sont gérés dans l'application DentiPro, depuis l'authentification Supabase jusqu'aux règles RLS de la base de données.

## 1. Vue d'ensemble

L'application distingue deux niveaux de contrôle :

- l'authentification, qui vérifie si l'utilisateur est connecté via Supabase Auth ;
- l'autorisation, qui détermine ce que l'utilisateur a le droit de voir ou de modifier.

L'autorisation repose sur trois couches :

- le middleware Next.js, qui protège les routes UI ;
- les routes API, qui vérifient la session avant d'accéder à la base ;
- la RLS Supabase/PostgreSQL, qui bloque ou autorise les opérations au niveau table.

## 2. Rôles métier

La base de données définit deux rôles métier dans la table `user_profiles` :

- `dentiste`
- `assistant`

La table `user_profiles` fait le lien entre `auth.users` et les entités métier du cabinet.

Structure logique :

- un utilisateur Supabase Auth est identifié par `user_id` ;
- ce `user_id` est relié à un profil métier ;
- le profil contient soit `dentiste_id`, soit `assistant_id`, selon le rôle.

Une contrainte impose qu'un profil n'ait qu'un seul rôle actif à la fois.

## 3. Vérification du rôle côté serveur

Deux fonctions SQL servent de point central pour les permissions :

- `current_user_role()` : retourne le rôle métier de l'utilisateur connecté ;
- `current_dentiste_id()` : retourne l'identifiant du dentiste connecté.

Ces fonctions sont utilisées dans les politiques RLS pour savoir si l'utilisateur a le droit d'effectuer une action.

## 4. Protection des routes côté Next.js

Le middleware serveur protège l'application sur le plan navigation :

- un utilisateur non connecté ne peut pas accéder à `/dashboard` ;
- un utilisateur connecté est redirigé depuis `/` ou `/login` vers `/dashboard` ;
- les routes publiques restent accessibles sans session.

Cette couche empêche surtout l'accès à l'interface, mais ne remplace pas la sécurité base de données.

## 5. Sécurité au niveau API

Les routes API patients vérifient toujours la session avant d'appeler Supabase.

Le flux général est le suivant :

- récupérer le client serveur Supabase ;
- appeler `supabase.auth.getUser()` ;
- refuser la requête si aucun utilisateur valide n'est trouvé ;
- exécuter ensuite les opérations CRUD.

Cela évite d'exposer les données aux requêtes anonymes.

## 6. RLS sur les tables principales

Les politiques RLS définissent qui peut faire quoi.

### Patients

- lecture : tout utilisateur authentifié ;
- création : seulement `dentiste` ou `assistant` ;
- modification : seulement `dentiste` ou `assistant` ;
- suppression : seulement `dentiste`.

### Profils médicaux

- lecture : tout utilisateur authentifié ;
- opérations d'écriture : `dentiste` ou `assistant`.

### Séances

- lecture : tout utilisateur authentifié ;
- création : seulement `dentiste` ;
- modification : seulement le dentiste propriétaire ;
- suppression : seulement le dentiste propriétaire.

### Rendez-vous

- lecture : tout utilisateur authentifié ;
- création et modification : `dentiste` ou `assistant` ;
- suppression : seulement `dentiste`.

### Catalogues et actes

- lecture : tout utilisateur authentifié ;
- modification : réservée au dentiste.

## 7. Pourquoi l'erreur RLS apparaît

Si l'application affiche une erreur du type :

- `new row violates row-level security policy for table "patients"`

cela signifie généralement que :

- l'utilisateur est bien authentifié ;
- mais son `user_id` n'est pas encore relié à `user_profiles` ;
- ou bien son rôle métier n'est pas `dentiste` ni `assistant`.

Dans ce cas, la requête est bloquée par PostgreSQL, même si le login Supabase est valide.

## 8. Contrôles à faire en cas de blocage

Si une action est refusée, vérifier dans cet ordre :

1. l'utilisateur est-il bien connecté dans Supabase Auth ;
2. existe-t-il une ligne dans `user_profiles` pour ce `user_id` ;
3. le rôle est-il `dentiste` ou `assistant` ;
4. la politique RLS de la table autorise-t-elle l'opération demandée ;
5. le payload envoyé par le front correspond-il aux champs attendus par l'API.

## 9. Correspondance front / API

Le formulaire patient envoie des champs comme :

- `first_name`
- `last_name`
- `date_of_birth`
- `gender`
- `phone`
- `email`
- `address`
- `allergies`
- `medical_history`

La couche API les convertit ensuite vers le schéma de base de données :

- `first_name` -> `nom`
- `last_name` -> `prenom`
- `date_of_birth` -> `date_naissance`
- `gender` -> `sexe`
- `phone` -> `telephone`
- `address` -> `adresse`

Cette conversion est importante pour éviter des inserts ou updates invalides.

## 10. Résumé pratique

En pratique, la gestion des rôles fonctionne ainsi :

- le middleware protège l'accès aux pages privées ;
- l'API refuse les requêtes sans session ;
- Supabase Auth identifie l'utilisateur ;
- `user_profiles` donne le rôle métier ;
- la RLS décide si l'opération SQL est autorisée.

Donc, si une action échoue malgré une connexion réussie, le problème vient presque toujours du profil métier ou de la politique RLS, pas du formulaire de login.
