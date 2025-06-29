# Système d'Administration des Rôles

## Vue d'ensemble

Le système d'administration des rôles de Toit's Map permet au Super Administrateur de gérer les utilisateurs et leurs rôles de manière sécurisée.

## Super Administrateur

### Identifiant
- **Email**: `tresorgatsobeau@gmail.com`
- **Rôle**: `super_admin`
- **Permissions**: Toutes les permissions du système

### Caractéristiques spéciales
- **Protégé**: Le Super Administrateur ne peut pas :
  - Modifier son propre rôle
  - Se désactiver lui-même
  - Se supprimer lui-même
- **Privilégié**: Le Super Administrateur peut :
  - Modifier les rôles de tous les autres utilisateurs
  - Supprimer tous les autres utilisateurs
  - Créer d'autres Super Administrateurs

## Rôles disponibles

### 1. Super Administrateur (`super_admin`)
- **Description**: Accès complet à toutes les fonctionnalités du système
- **Permissions**: Toutes les permissions
- **Attribution**: Seul le Super Administrateur existant peut créer d'autres Super Administrateurs

### 2. Modérateur (`moderator`)
- **Description**: Valide les contributions et gère les signalements
- **Permissions**:
  - Voir les utilisateurs
  - Modérer le contenu
  - Valider les contributions
  - Gérer les signalements
  - Voir les analyses

### 3. Représentant Municipal (`municipal_rep`)
- **Description**: Gère les informations officielles des toilettes publiques
- **Permissions**:
  - Voir les utilisateurs
  - Modérer le contenu
  - Valider les contributions
  - Gérer les signalements
  - Voir et exporter les analyses
  - Mettre à jour les infos officielles
  - Modifier les données de carte
  - Mettre à jour et ajouter des toilettes

### 4. Citoyen (`citizen`)
- **Description**: Utilisateur standard de l'application
- **Permissions**:
  - Ajouter des contributions
  - Évaluer les toilettes
  - Commenter

## Fonctions utilitaires

### Vérification des permissions

```typescript
import { 
  isSuperAdmin, 
  canModifyUserRole, 
  canDeleteUser, 
  getAvailableRoles,
  hasPermission 
} from '@/lib/roles';

// Vérifier si un utilisateur est Super Admin
const isAdmin = isSuperAdmin(userEmail);

// Vérifier si un utilisateur peut modifier le rôle d'un autre
const canModify = canModifyUserRole(currentUserEmail, targetUserEmail);

// Vérifier si un utilisateur peut supprimer un autre
const canDelete = canDeleteUser(currentUserEmail, targetUserEmail);

// Obtenir les rôles disponibles pour un utilisateur
const roles = getAvailableRoles(userEmail);

// Vérifier une permission spécifique
const hasManageUsers = hasPermission(userRole, 'manage_users');
```

## Interface d'administration

### Accès
- **URL**: `/admin`
- **Accès**: Seul le Super Administrateur peut accéder à cette page
- **Navigation**: Lien "Admin" visible uniquement pour le Super Administrateur

### Fonctionnalités

#### 1. Vue des utilisateurs
- **Mode grille**: Affichage en cartes avec informations détaillées
- **Mode tableau**: Affichage en tableau avec actions rapides
- **Recherche**: Filtrage par nom, email ou rôle

#### 2. Gestion des rôles
- **Modification**: Changement de rôle via menu déroulant
- **Protection**: Le Super Admin ne peut pas modifier son propre rôle
- **Validation**: Seul le Super Admin peut créer d'autres Super Admins

#### 3. Gestion du statut
- **Activation/Désactivation**: Bascule pour activer/désactiver les utilisateurs
- **Protection**: Le Super Admin ne peut pas se désactiver

#### 4. Suppression d'utilisateurs
- **Confirmation**: Dialogue de confirmation avant suppression
- **Protection**: Le Super Admin ne peut pas se supprimer
- **Irréversible**: Action définitive

### Indicateurs visuels

#### Super Administrateur
- **Icône couronne** : À côté du nom
- **Badge spécial** : Rôle mis en évidence
- **Arrière-plan** : Dégradé jaune/orange
- **Icône bouclier** : À côté du badge de rôle

#### Actions protégées
- **Boutons désactivés** : Pour les actions non autorisées
- **Placeholder "Protégé"** : Dans les menus déroulants
- **Messages d'erreur** : Toast notifications explicites

## Sécurité

### Vérifications côté client
- Toutes les actions sont vérifiées avant exécution
- Messages d'erreur explicites pour les actions non autorisées
- Interface adaptée selon les permissions

### Vérifications côté serveur (recommandé)
- **Firebase Security Rules** : À implémenter pour sécuriser les opérations
- **Validation des permissions** : Vérification avant chaque modification
- **Audit trail** : Logging des actions d'administration

## Exemple d'utilisation

```typescript
// Dans un composant React
import { useAuthStore } from '@/store/useAuthStore';
import { isSuperAdmin, canModifyUserRole } from '@/lib/roles';

const AdminComponent = () => {
  const { user } = useAuthStore();
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    
    if (!canModifyUserRole(user?.email, targetUser?.email)) {
      toast.error('Vous n\'avez pas les permissions pour modifier ce rôle');
      return;
    }
    
    // Procéder à la modification
    await updateUserRole(userId, newRole);
  };
  
  return (
    <div>
      {isSuperAdmin(user?.email) && (
        <Link href="/admin">Administration</Link>
      )}
    </div>
  );
};
```

## Tests

Le système inclut des tests automatisés pour vérifier le bon fonctionnement :

```bash
npx tsx scripts/test-admin-system.ts
```

Ces tests vérifient :
- L'identification du Super Administrateur
- Les permissions de modification des rôles
- Les permissions de suppression d'utilisateurs
- La disponibilité des rôles selon les permissions
- Les permissions spécifiques de chaque rôle 