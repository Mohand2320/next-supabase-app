# Autorisation et Permissions

L'autorisation dans DentiPro détermine "qui a le droit de faire quoi". 
Elle s'articule autour de deux mécanismes complémentaires : **RBAC (Role-Based Access Control) dans Next.js** et **RLS (Row Level Security) dans Supabase**.

## 1. Guards Côté Serveur (Next.js)

Le fichier `src/lib/auth/guards.ts` centralise la logique de protection des API Routes et Server Actions.

### Fonction `requireRoles`

```typescript
import { requireRoles } from '@/lib/auth/guards';

export async function GET(request: Request) {
  // Seuls les administrateurs et dentistes sont autorisés
  const { isAuthorized, user, error } = await requireRoles(['admin', 'dentiste']);
  
  if (!isAuthorized) {
    return NextResponse.json({ error }, { status: 403 });
  }
  
  // Exécution de l'action...
}
```

La fonction `requireRoles` effectue les vérifications suivantes :
1. L'utilisateur a-t-il une session valide ?
2. Son profil existe-t-il dans `user_profiles` ?
3. Son compte est-il actif (`is_active === true`) ?
4. Son rôle correspond-il à l'un des rôles demandés ?

## 2. Protection Côté Base de Données (RLS)

Même si un utilisateur parvient à contourner les Guards Next.js, les politiques **Row Level Security (RLS)** de PostgreSQL bloquent les accès non autorisés directement au niveau de la base de données.

*Voir la section [Row Level Security](./RLS.md) pour le détail des politiques.*

## 3. Protection Côté Client (UI)

La protection côté client sert uniquement à l'expérience utilisateur (UX) en masquant les fonctionnalités inaccessibles.

- **Navigation conditionnelle** : Le layout (`src/app/dashboard/layout.tsx`) filtre les menus (ex: le menu "Utilisateurs" n'est affiché qu'aux administrateurs).
- **Composants conditionnels** : L'accès en lecture ou modification est géré par la récupération du profil de l'utilisateur (`getCurrentUserProfile()`).
