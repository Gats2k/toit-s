# Guide de Dépannage - Système d'Administration

## Problème : Le lien "Admin" n'apparaît pas pour le Super Administrateur

### Vérifications à effectuer

#### 1. Vérifier l'email de connexion
- Assurez-vous que vous vous connectez avec l'email exact : `tresorgatsobeau@gmail.com`
- Vérifiez qu'il n'y a pas d'espaces avant ou après l'email

#### 2. Vérifier la console du navigateur
Ouvrez les outils de développement (F12) et regardez la console. Vous devriez voir :
```javascript
Header Debug: {
  userData: { email: "tresorgatsobeau@gmail.com", role: "super_admin", ... },
  userDataEmail: "tresorgatsobeau@gmail.com",
  firebaseUserEmail: "tresorgatsobeau@gmail.com",
  isSuperAdminResult: true,
  navItems: [...]
}
```

#### 3. Vérifier les données utilisateur dans Firestore
- Allez dans la console Firebase
- Vérifiez que l'utilisateur existe dans la collection `users`
- Vérifiez que le champ `email` est exactement `tresorgatsobeau@gmail.com`
- Vérifiez que le champ `role` est `super_admin`

#### 4. Vérifier l'authentification Firebase
- Assurez-vous que l'utilisateur est bien connecté
- Vérifiez que `firebaseUser` n'est pas `null`

### Solutions possibles

#### Solution 1 : Réinitialiser les données utilisateur
Si les données sont corrompues, supprimez l'utilisateur de Firestore et reconnectez-vous.

#### Solution 2 : Vérifier la configuration Firebase
Assurez-vous que les règles Firestore permettent la lecture des données utilisateur.

#### Solution 3 : Vider le cache
- Déconnectez-vous complètement
- Videz le cache du navigateur
- Reconnectez-vous

### Test de diagnostic

Exécutez ce script pour vérifier la logique :
```bash
npx tsx scripts/test-admin-logic.ts
```

### Logs de debug

Les logs de debug dans la console du navigateur vous aideront à identifier :
- Si `userData` est chargé correctement
- Si `firebaseUser` contient les bonnes données
- Si la fonction `isSuperAdmin` retourne le bon résultat
- Si `navItems` contient le lien Admin

### Contact

Si le problème persiste, vérifiez :
1. Les logs de la console
2. Les données dans Firestore
3. L'état de l'authentification Firebase 