# Sécurité & Audit

Cette section détaille les mesures de protection mises en place contre les vulnérabilités courantes.

## Protections Implémentées

### 1. Injections SQL
Toutes les requêtes vers la base de données passent par l'ORM de Supabase (PostgREST), qui utilise des requêtes paramétrées en coulisse, rendant les injections SQL impossibles.

### 2. XSS (Cross-Site Scripting)
- React échappe automatiquement les variables lors du rendu.
- Une politique **Content Security Policy (CSP)** stricte est configurée dans `next.config.mjs`, interdisant l'exécution de scripts non approuvés.

### 3. CSRF (Cross-Site Request Forgery)
- Les cookies de session Supabase utilisent `SameSite=Lax`.
- Les API Routes requièrent l'authentification par JWT dans les cookies, qui ne sont pas envoyés lors de requêtes cross-origin non sollicitées.

### 4. Authentification et Autorisation
- `getUser()` est utilisé au lieu de `getSession()` côté serveur pour forcer la vérification cryptographique du JWT à chaque action critique.
- Le système RBAC (`requireRoles`) garantit que les Server Actions et API Routes ne font jamais confiance aux données envoyées par le client concernant le rôle.

### 5. Protection des Données (Row Level Security)
Le RLS garantit que, même en cas de faille applicative dans Next.js, la base de données elle-même bloquera toute tentative d'accès non autorisée.

## Recommandations pour l'avenir

- Implémenter un système de **Rate Limiting** sur la route de Login pour contrer le bruteforce.
- Ajouter la **MFA (Authentification Multi-Facteurs)** via Supabase pour les comptes Administrateurs.
