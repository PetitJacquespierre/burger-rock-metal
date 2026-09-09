import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// AUTENTICACIÓN
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario Logueado
        DOM.loginScreen.style.display = 'none';
        DOM.dashboardScreen.style.display = 'flex';
        DOM.userEmailDisplay.innerText = user.email;
        window.loadClients();
        if (window.correrRobotCobrador) window.correrRobotCobrador();
    } else {
        // No logueado
        DOM.loginScreen.style.display = 'flex';
        DOM.dashboardScreen.style.display = 'none';
        state.currentClientId = null;
    }
});

DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Cambiamos el texto del botón temporalmente
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = "Cargando...";
    btnSubmit.disabled = true;

    try {
        try { await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence); } catch(e) { console.warn("Persistence error", e); }
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Firebase Login Error:", error);
        alert("Error al iniciar sesión: " + error.message);
        DOM.loginError.innerText = "Error: " + error.message;
        DOM.loginError.style.display = 'block';
    } finally {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
});

DOM.btnLogout.addEventListener('click', () => {
    signOut(auth);
});

const btnForgotPassword = document.getElementById('btn-forgot-password');
btnForgotPassword.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        alert("Por favor, ingresa tu correo electrónico primero en la casilla de arriba para enviarte el link de recuperación.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("¡Enlace de recuperación enviado! Revisa tu bandeja de entrada (y la carpeta de SPAM).");
    } catch (error) {
        alert("Error al enviar el correo. Verifica que el correo esté bien escrito y exista.");
    }
});

