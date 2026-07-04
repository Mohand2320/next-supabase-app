# Cycle de Vie d'un Utilisateur

## 1. Invitation (Création)
Seul un **Administrateur** peut créer un nouvel utilisateur via le module Utilisateurs.
1. L'admin saisit le nom, l'email et le rôle souhaité.
2. Le service admin appelle `supabaseAdmin.auth.admin.createUser()` (création du compte Auth).
3. Le service admin insère le rôle dans `user_profiles` et crée l'entité métier correspondante (`assistants` ou `dentistes`).

## 2. Activation / Désactivation
- L'administrateur peut "suspendre" un compte sans le supprimer en basculant le statut `is_active` à `false` dans `user_profiles`.
- Le middleware vérifie ce flag en temps réel : un utilisateur désactivé est immédiatement déconnecté.

## 3. Modification du Profil
- Les utilisateurs peuvent modifier leurs propres informations métiers (nom, spécialité) via la page Profil (`updateUserProfile`).
- Ils ne peuvent pas modifier leur propre rôle ou statut d'activation.

## 4. Suppression
La suppression définitive d'un compte se fait via Supabase Dashboard. En raison des clés étrangères (historique des séances, rdv modifiés), la suppression "logique" (Désactivation via `is_active = false`) est privilégiée par rapport à la suppression physique en base de données.
