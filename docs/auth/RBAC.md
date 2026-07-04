# Role-Based Access Control (RBAC)

DentiPro utilise une matrice de rôles pour attribuer les permissions de manière centralisée.
Ces rôles sont définis dans `src/lib/auth/permissions.ts`.

## Les Rôles

1. `admin` : Administrateur du système (gestion des utilisateurs)
2. `dentiste` : Praticien (accès médical complet)
3. `assistant` : Personnel administratif (gestion de l'agenda et dossiers de base)

## Matrice des Permissions (CRUD)

| Ressource | Admin | Dentiste | Assistant |
|-----------|-------|----------|-----------|
| **Patients** | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture |
| **Agenda (RDV)** | Lecture/Écriture | Lecture/Écriture | Lecture/Écriture |
| **Séances & Soins** | Lecture/Écriture | Lecture/Écriture | Lecture uniquement |
| **Catalogue Actes** | Lecture/Écriture | Lecture/Écriture | Lecture uniquement |
| **Utilisateurs** | Lecture/Écriture | Lecture uniquement | Aucun accès |
| **Paramètres** | Lecture/Écriture | Lecture/Écriture | Lecture uniquement |

## Implémentation

La structure de permissions est exportée sous forme de constante et peut être utilisée pour des vérifications conditionnelles plus fines dans l'UI ou les actions complexes :

```typescript
export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    patients: ['create', 'read', 'update', 'delete', 'manage'],
    // ...
  }
};
```
