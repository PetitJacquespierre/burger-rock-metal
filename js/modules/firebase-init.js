
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    projectId: "grow-studio-menus",
    appId: "1:152582182898:web:cf17e88b6b1f861cdc7d6b",
    storageBucket: "grow-studio-menus.firebasestorage.app",
    apiKey: "AIzaSyAv7GDSLS3Kwb-aMAhyQE3YgnPkCNg8cvg",
    authDomain: "grow-studio-menus.firebaseapp.com",
    messagingSenderId: "152582182898",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence };
export { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc };
