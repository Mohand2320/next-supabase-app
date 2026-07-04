// Définition des rôles du système
export type Role = 'admin' | 'dentiste' | 'assistant';

// Mapping hiérarchique optionnel (si nécessaire plus tard)
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  dentiste: 2,
  assistant: 1
};

// Liste des ressources de l'application
export type Resource = 
  | 'patients'
  | 'rdv'
  | 'seances'
  | 'utilisateurs'
  | 'parametres';

// Actions possibles sur les ressources
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Vérification de permission basique basée sur le rôle
export function hasRole(userRole: string | null | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as Role);
}

// Les permissions spécifiques par ressource et par rôle (RBAC)
export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    patients: ['create', 'read', 'update', 'delete', 'manage'],
    rdv: ['create', 'read', 'update', 'delete', 'manage'],
    seances: ['create', 'read', 'update', 'delete', 'manage'],
    utilisateurs: ['create', 'read', 'update', 'delete', 'manage'],
    parametres: ['create', 'read', 'update', 'delete', 'manage'],
  },
  dentiste: {
    patients: ['create', 'read', 'update', 'delete'],
    rdv: ['create', 'read', 'update', 'delete'],
    seances: ['create', 'read', 'update', 'delete'],
    utilisateurs: ['read'],
    parametres: ['read', 'update'],
  },
  assistant: {
    patients: ['create', 'read', 'update'],
    rdv: ['create', 'read', 'update'],
    seances: ['read'],
    utilisateurs: [],
    parametres: ['read'],
  }
};
