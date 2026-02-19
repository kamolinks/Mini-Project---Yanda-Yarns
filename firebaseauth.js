// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, setDoc, doc, collection, getDocs, query, where, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

  
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBsK_97sDdx7aDskN8LDhlqVvnuGgl7H3Y",
    authDomain: "mini-project-837cf.firebaseapp.com",
    projectId: "mini-project-837cf",
    storageBucket: "mini-project-837cf.firebasestorage.app",
    messagingSenderId: "371109293625",
    appId: "1:371109293625:web:3d6357320a3e8f6e2427e8",
    measurementId: "G-PDJGJW9H98"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  //function to get products from db
  export async function getProducts() {
    const q = query(collection(db, "Products"), where("top-seller", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot;
  }

  // Export functions globally so they can be used in other scripts
  window.auth = auth;
  window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
  window.signInWithEmailAndPassword = signInWithEmailAndPassword;
  window.setDoc = setDoc;
  window.doc = doc;
  window.db = db;
  window.onAuthStateChanged = onAuthStateChanged;
  window.signOut = signOut;
  window.getDoc = getDoc;
  

  //Save user cart to Firestore
  export async function saveUserCart(userId, cart) {
    try {
      await setDoc(doc(db, "users", userId), 
        {cart: cart},
        {merge: true}
      );
      console.log("Cart saved to firestore!");
    } catch (error) {
      console.error("Error saving cart: ", error);
    }
  }
