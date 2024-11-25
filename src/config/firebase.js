// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc,collection,deleteDoc,getDocs,limit,orderBy,query,getDoc} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCxC5szU2_EhzF1ihiTBW80unDvWOmOEgg",
  authDomain: "ecommerce-a8bf0.firebaseapp.com",
  projectId: "ecommerce-a8bf0",
  storageBucket: "ecommerce-a8bf0.firebasestorage.app",
  messagingSenderId: "841860124930",
  appId: "1:841860124930:web:284673197b21e6c3d7721b",
  measurementId: "G-S57XJ98LVG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Export necessary modules
export { auth, db,getDoc,limit,orderBy,query, createUserWithEmailAndPassword, signInWithEmailAndPassword, setDoc, doc,collection,deleteDoc,getDocs };
