import { 
  SUPER_ADMIN_EMAIL, 
  isSuperAdmin, 
  canModifyUserRole, 
  canDeleteUser, 
  getAvailableRoles,
  hasPermission 
} from '../lib/roles';

console.log('=== Test du système d\'administration des rôles ===\n');

// Test 1: Vérification de l'email du super admin
console.log('1. Email du Super Admin:', SUPER_ADMIN_EMAIL);

// Test 2: Vérification de la fonction isSuperAdmin
console.log('\n2. Tests de la fonction isSuperAdmin:');
console.log('- tresorgatsobeau@gmail.com:', isSuperAdmin('tresorgatsobeau@gmail.com'));
console.log('- autre@email.com:', isSuperAdmin('autre@email.com'));
console.log('- null:', isSuperAdmin(null));

// Test 3: Vérification de la fonction canModifyUserRole
console.log('\n3. Tests de la fonction canModifyUserRole:');
console.log('- Super admin modifiant un citoyen:', canModifyUserRole('tresorgatsobeau@gmail.com', 'citoyen@email.com'));
console.log('- Super admin modifiant lui-même:', canModifyUserRole('tresorgatsobeau@gmail.com', 'tresorgatsobeau@gmail.com'));
console.log('- Citoyen modifiant un autre:', canModifyUserRole('citoyen@email.com', 'autre@email.com'));

// Test 4: Vérification de la fonction canDeleteUser
console.log('\n4. Tests de la fonction canDeleteUser:');
console.log('- Super admin supprimant un citoyen:', canDeleteUser('tresorgatsobeau@gmail.com', 'citoyen@email.com'));
console.log('- Super admin se supprimant lui-même:', canDeleteUser('tresorgatsobeau@gmail.com', 'tresorgatsobeau@gmail.com'));
console.log('- Citoyen supprimant un autre:', canDeleteUser('citoyen@email.com', 'autre@email.com'));

// Test 5: Vérification de la fonction getAvailableRoles
console.log('\n5. Tests de la fonction getAvailableRoles:');
console.log('- Rôles disponibles pour super admin:', getAvailableRoles('tresorgatsobeau@gmail.com'));
console.log('- Rôles disponibles pour citoyen:', getAvailableRoles('citoyen@email.com'));

// Test 6: Vérification de la fonction hasPermission
console.log('\n6. Tests de la fonction hasPermission:');
console.log('- Super admin avec permission MANAGE_USERS:', hasPermission('super_admin', 'manage_users'));
console.log('- Citoyen avec permission MANAGE_USERS:', hasPermission('citizen', 'manage_users'));
console.log('- Modérateur avec permission MODERATE_CONTENT:', hasPermission('moderator', 'moderate_content'));

console.log('\n=== Tests terminés ==='); 