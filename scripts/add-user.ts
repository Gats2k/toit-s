import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuration Firebase (copiée depuis firebase/client.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAs6cZDpBKWiASCmkE2EQf0bHRf6S-tqFY",
  authDomain: "toit-s.firebaseapp.com",
  projectId: "toit-s",
  storageBucket: "toit-s.firebasestorage.app",
  messagingSenderId: "501753752554",
  appId: "1:501753752554:web:21df41c99e782443712093",
  measurementId: "G-DYLX4JNR7C"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'moderator' | 'municipal_rep' | 'citizen';
  isActive: boolean;
  photoURL: string | null;
  createdAt: Date;
  lastLogin: Date;
}

async function addUser(email: string, password: string, displayName: string, role: UserData['role'] = 'citizen') {
  try {
    console.log(`Création de l'utilisateur: ${displayName} (${email})`);
    
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Utilisateur créé dans Firebase Auth:', user.uid);
    
    // Préparer les données utilisateur pour Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName,
      role: role,
      isActive: true,
      photoURL: null,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    // Ajouter les données utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), userData);
    
    console.log('✅ Données utilisateur ajoutées dans Firestore');
    console.log('✅ Utilisateur créé avec succès!');
    console.log('\nDétails de l\'utilisateur:');
    console.log('- UID:', user.uid);
    console.log('- Email:', userData.email);
    console.log('- Nom:', userData.displayName);
    console.log('- Rôle:', userData.role);
    console.log('- Statut:', userData.isActive ? 'Actif' : 'Inactif');
    console.log('- Date de création:', userData.createdAt.toLocaleString('fr-FR'));
    
    return user;
  } catch (error: any) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 L\'email existe déjà. Vérifiez dans la console Firebase.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 Le mot de passe est trop faible. Utilisez au moins 6 caractères.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 L\'email n\'est pas valide.');
    }
    
    throw error;
  }
}

// Fonction principale
async function main() {
  console.log('=== Script d\'ajout d\'utilisateur ===\n');
  
  try {
    // Ajouter David Ntsama
    await addUser(
      'david@gmail.com',
      'Davide2009',
      'David Ntsama',
      'citizen'
    );
    
    console.log('\n=== Utilisateur ajouté avec succès! ===');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log('- Email: david@gmail.com');
    console.log('- Mot de passe: Davide2009');
    
  } catch (error) {
    console.error('\n❌ Échec de la création de l\'utilisateur');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
} 