import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// REPORTES Y ESTADÍSTICAS
// ==========================================
window.generarReporteWhatsapp = function() {
    if (!state.currentClientData) return;
    
    const telefono = state.currentClientData.whatsapp || state.currentClientData.telefono || "";
    const visitas = state.currentClientData.visitas || 0;
    const nombre = state.currentClientData.nombre || state.currentClientData.businessName || "Cliente";
    
    if (!telefono) {
        alert("El cliente no tiene un número de WhatsApp registrado.");
        return;
    }
    
    let tlf = telefono.replace(/\D/g, ''); 
    
    const mensaje = `¡Hola ${nombre}! 📊 Aquí tienes tu reporte mensual de Grow Studio.\n\nEste mes tu Menú Digital ha recibido *${visitas} visitas*.\n\n¡Tus clientes están amando tu menú digital! Gracias por confiar en nosotros. 🚀`;
    const url = `https://web.whatsapp.com/send?phone=${tlf}&text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
};


// Robot Cobrador (Llamado en auth)
window.correrRobotCobrador = async function() {
    console.log("Corriendo Robot Automático...");
    try {
        const snap = await getDocs(collection(db, "clientes"));
        const hoy = new Date();
        
        snap.forEach(async (docSnap) => {
            const data = docSnap.data();
            if (!data.fechaVencimiento) return;
            
            const fechaV = new Date(data.fechaVencimiento);
            const diffTime = fechaV - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let estadoActual = data.estado || "ACTIVO";
            
            // Si la fecha de vencimiento ya pasó (diffDays <= 0) y el cliente sigue ACTIVO, lo suspendemos.
            if (diffDays <= 0 && estadoActual === "ACTIVO") {
                console.log(`Suspendiendo automáticamente a ${docSnap.id} por falta de pago.`);
                await updateDoc(doc(db, "clientes", docSnap.id), {
                    estado: "SUSPENDIDO"
                });
            }
        });
    } catch (e) {
        console.error("Error en Robot Automático:", e);
    }
};

// ==========================================
