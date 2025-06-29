export type UserRole = "super_admin" | "moderator" | "municipal_rep" | "citizen"

export interface Permission {
  id: string
  name: string
  description: string
}

export interface RoleDefinition {
  id: UserRole
  name: string
  description: string
  permissions: string[]
}

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",

  // Role Management
  ASSIGN_ROLES: "assign_roles",

  // Content Moderation
  MODERATE_CONTENT: "moderate_content",
  VALIDATE_CONTRIBUTIONS: "validate_contributions",
  MANAGE_REPORTS: "manage_reports",

  // Analytics
  VIEW_ANALYTICS: "view_analytics",
  EXPORT_ANALYTICS: "export_analytics",

  // Payments
  MANAGE_PAYMENTS: "manage_payments",
  VIEW_PAYMENTS: "view_payments",
  PROCESS_REFUNDS: "process_refunds",

  // Map Data
  EDIT_MAP_DATA: "edit_map_data",
  ADD_TOILETS: "add_toilets",
  UPDATE_TOILETS: "update_toilets",
  DELETE_TOILETS: "delete_toilets",
  UPDATE_OFFICIAL_INFO: "update_official_info",

  // Contributions
  ADD_CONTRIBUTIONS: "add_contributions",
  RATE_TOILETS: "rate_toilets",
  COMMENT: "comment",

  // System
  AUDIT_LOG_ACCESS: "audit_log_access",
}

export const PERMISSIONS_LIST: Permission[] = [
  {
    id: PERMISSIONS.MANAGE_USERS,
    name: "Gérer les utilisateurs",
    description: "Créer, modifier et supprimer des comptes utilisateurs",
  },
  { id: PERMISSIONS.VIEW_USERS, name: "Voir les utilisateurs", description: "Consulter la liste des utilisateurs" },
  {
    id: PERMISSIONS.ASSIGN_ROLES,
    name: "Attribuer des rôles",
    description: "Attribuer et modifier les rôles des utilisateurs",
  },
  {
    id: PERMISSIONS.MODERATE_CONTENT,
    name: "Modérer le contenu",
    description: "Approuver ou rejeter le contenu soumis par les utilisateurs",
  },
  {
    id: PERMISSIONS.VALIDATE_CONTRIBUTIONS,
    name: "Valider les contributions",
    description: "Valider les contributions des utilisateurs",
  },
  {
    id: PERMISSIONS.MANAGE_REPORTS,
    name: "Gérer les signalements",
    description: "Traiter les signalements d'abus ou de problèmes",
  },
  {
    id: PERMISSIONS.VIEW_ANALYTICS,
    name: "Voir les analyses",
    description: "Accéder aux tableaux de bord analytiques",
  },
  { id: PERMISSIONS.EXPORT_ANALYTICS, name: "Exporter les analyses", description: "Exporter les données analytiques" },
  { id: PERMISSIONS.MANAGE_PAYMENTS, name: "Gérer les paiements", description: "Gérer tous les aspects des paiements" },
  { id: PERMISSIONS.VIEW_PAYMENTS, name: "Voir les paiements", description: "Consulter les informations de paiement" },
  { id: PERMISSIONS.PROCESS_REFUNDS, name: "Traiter les remboursements", description: "Effectuer des remboursements" },
  {
    id: PERMISSIONS.EDIT_MAP_DATA,
    name: "Modifier les données de carte",
    description: "Modifier toutes les données sur la carte",
  },
  {
    id: PERMISSIONS.ADD_TOILETS,
    name: "Ajouter des toilettes",
    description: "Ajouter de nouvelles toilettes sur la carte",
  },
  {
    id: PERMISSIONS.UPDATE_TOILETS,
    name: "Mettre à jour les toilettes",
    description: "Mettre à jour les informations des toilettes",
  },
  {
    id: PERMISSIONS.DELETE_TOILETS,
    name: "Supprimer des toilettes",
    description: "Supprimer des toilettes de la carte",
  },
  {
    id: PERMISSIONS.UPDATE_OFFICIAL_INFO,
    name: "Mettre à jour les infos officielles",
    description: "Mettre à jour les informations officielles",
  },
  {
    id: PERMISSIONS.ADD_CONTRIBUTIONS,
    name: "Ajouter des contributions",
    description: "Ajouter des contributions (toilettes, mises à jour)",
  },
  { id: PERMISSIONS.RATE_TOILETS, name: "Évaluer les toilettes", description: "Donner des évaluations aux toilettes" },
  { id: PERMISSIONS.COMMENT, name: "Commenter", description: "Laisser des commentaires" },
  {
    id: PERMISSIONS.AUDIT_LOG_ACCESS,
    name: "Accéder aux journaux d'audit",
    description: "Consulter les journaux d'audit du système",
  },
]

export const ROLES: RoleDefinition[] = [
  {
    id: "super_admin",
    name: "Super Administrateur",
    description: "Accès complet à toutes les fonctionnalités du système",
    permissions: Object.values(PERMISSIONS),
  },
  {
    id: "municipal_rep",
    name: "Représentant Municipal",
    description: "Gère les informations officielles des toilettes publiques",
    permissions: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.MODERATE_CONTENT,
      PERMISSIONS.VALIDATE_CONTRIBUTIONS,
      PERMISSIONS.MANAGE_REPORTS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.EXPORT_ANALYTICS,
      PERMISSIONS.UPDATE_OFFICIAL_INFO,
      PERMISSIONS.EDIT_MAP_DATA,
      PERMISSIONS.UPDATE_TOILETS,
      PERMISSIONS.ADD_TOILETS,
    ],
  },
  {
    id: "moderator",
    name: "Modérateur",
    description: "Valide les contributions et gère les signalements",
    permissions: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.MODERATE_CONTENT,
      PERMISSIONS.VALIDATE_CONTRIBUTIONS,
      PERMISSIONS.MANAGE_REPORTS,
      PERMISSIONS.VIEW_ANALYTICS,
    ],
  },
  {
    id: "citizen",
    name: "Citoyen",
    description: "Utilisateur standard de l'application",
    permissions: [PERMISSIONS.ADD_CONTRIBUTIONS, PERMISSIONS.RATE_TOILETS, PERMISSIONS.COMMENT],
  },
]

export function hasPermission(userRole: UserRole, permission: string): boolean {
  if (!userRole) return false

  const role = ROLES.find((r) => r.id === userRole)
  if (!role) return false

  return role.permissions.includes(permission)
}

export function getRoleByName(roleName: string): RoleDefinition | undefined {
  return ROLES.find((role) => role.id === roleName)
}

// Constante pour l'email du super administrateur
export const SUPER_ADMIN_EMAIL = 'tresorgatsobeau@gmail.com'

// Fonction pour vérifier si un utilisateur est le super administrateur
export function isSuperAdmin(userEmail: string | null | undefined): boolean {
  return userEmail === SUPER_ADMIN_EMAIL
}

// Fonction pour vérifier si un utilisateur peut modifier les rôles
export function canModifyRoles(userEmail: string | null | undefined): boolean {
  return isSuperAdmin(userEmail)
}

// Fonction pour vérifier si un utilisateur peut modifier un rôle spécifique
export function canModifyUserRole(
  currentUserEmail: string | null | undefined, 
  targetUserEmail: string | null | undefined
): boolean {
  // Seul le super admin peut modifier les rôles
  if (!isSuperAdmin(currentUserEmail)) {
    return false
  }
  
  // Le super admin ne peut pas modifier son propre rôle
  if (targetUserEmail === SUPER_ADMIN_EMAIL) {
    return false
  }
  
  return true
}

// Fonction pour vérifier si un utilisateur peut supprimer un autre utilisateur
export function canDeleteUser(
  currentUserEmail: string | null | undefined, 
  targetUserEmail: string | null | undefined
): boolean {
  // Seul le super admin peut supprimer des utilisateurs
  if (!isSuperAdmin(currentUserEmail)) {
    return false
  }
  
  // Le super admin ne peut pas se supprimer lui-même
  if (targetUserEmail === SUPER_ADMIN_EMAIL) {
    return false
  }
  
  return true
}

// Fonction pour obtenir les rôles disponibles selon les permissions de l'utilisateur
export function getAvailableRoles(currentUserEmail: string | null | undefined): UserRole[] {
  if (isSuperAdmin(currentUserEmail)) {
    return ['super_admin', 'moderator', 'municipal_rep', 'citizen']
  }
  
  // Les autres utilisateurs ne peuvent pas modifier les rôles
  return []
}
