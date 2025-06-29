import { isSuperAdmin } from '../lib/roles';

console.log('=== Test de la logique d\'affichage du lien Admin ===\n');

// Test avec différents emails
const testEmails = [
  'tresorgatsobeau@gmail.com',
  'autre@email.com',
  'admin@test.com',
  null,
  undefined
];

testEmails.forEach(email => {
  const isAdmin = isSuperAdmin(email);
  console.log(`Email: ${email} -> Super Admin: ${isAdmin}`);
});

console.log('\n=== Résultat attendu ===');
console.log('Email: tresorgatsobeau@gmail.com -> Super Admin: true');
console.log('Email: autre@email.com -> Super Admin: false');
console.log('Email: admin@test.com -> Super Admin: false');
console.log('Email: null -> Super Admin: false');
console.log('Email: undefined -> Super Admin: false');

console.log('\n=== Test terminé ==='); 