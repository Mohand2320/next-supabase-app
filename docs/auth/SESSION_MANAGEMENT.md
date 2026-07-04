# Gestion des Sessions

DentiPro utilise une gestion de session basée sur les JWT de Supabase et stockée dans les cookies sécurisés du navigateur.

## Flux de Session

1. **Connexion** : `signInWithPassword()` génère un JWT (Access Token) et un Refresh Token.
2. **Stockage** : Le client Supabase enregistre ces tokens dans les cookies du navigateur.
3. **Transmission** : À chaque requête vers Next.js, les cookies sont envoyés automatiquement.
4. **Validation (Edge)** : Le `middleware.ts` lit les cookies, valide la session via `supabase.auth.getUser()`, et rafraîchit automatiquement le JWT si nécessaire.
5. **Utilisation (Serveur)** : Les API et Server Actions utilisent `createClientServer()` pour accéder à la session de manière sécurisée.

## Sécurité des Cookies

- `HttpOnly` : Empêche l'accès aux cookies via JavaScript (protection XSS).
- `Secure` : Force l'utilisation de HTTPS.
- `SameSite=Lax` : Protège contre les attaques CSRF courantes.

## Déconnexion Forcée

Si un administrateur désactive un compte (`is_active = false`), le middleware interceptera la prochaine requête de cet utilisateur, appellera `supabase.auth.signOut()` et le redirigera vers la page de login, invalidant ainsi sa session active.
