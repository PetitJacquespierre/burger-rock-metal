import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// GESTIÓN DE CLIENTES
// ==========================================

window.loadClients = async function() {
    DOM.clientsUl.innerHTML = '<li style="color:gray">Cargando...</li>';
    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        DOM.clientsUl.innerHTML = '';
        
        if (querySnapshot.empty) {
            DOM.clientsUl.innerHTML = '<li style="color:gray">No hay clientes aún</li>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="font-weight: bold;">👩🏼‍💻 ${data.nombre || data.businessName || docSnap.id}</span>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 3px;">
                    Estado: <span style="color: ${data.estado === 'ACTIVO' ? '#10b981' : '#ef4444'}">${data.estado || 'INACTIVO'}</span> | Deuda: $${data.deuda || 0}
                </div>
            `;
            li.onclick = () => window.openClientManager(docSnap.id, data, li);
            DOM.clientsUl.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando clientes:", error);
        DOM.clientsUl.innerHTML = '<li style="color:red">Error de conexión</li>';
    }
}

DOM.btnNewClient.addEventListener('click', async () => {
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    DOM.btnNewClient.classList.add('active');
    
    const id = prompt("Ingresa el ID único del cliente (ej. la_flaca, foodpoint):");
    if (!id) return;
    

    const name = prompt("Nombre comercial del cliente (ej. Pasteles La Flaca):");
    if (!name) return;

    const whatsapp = prompt("Número de WhatsApp del cliente con código de país (ej. 584120000000):") || "";
    const instagram = prompt("Link o @ de Instagram del cliente (Opcional, ej: @laflaca):") || "";
    const url = prompt("Link de la tienda en Vercel (Opcional, ej: https://laflaca.vercel.app):") || "";

    try {
        await setDoc(doc(db, "clientes", id), {
            businessName: name,
            estado: "ACTIVO",
            tiendaAbierta: "AUTO",
            whatsapp: whatsapp,
            instagram: instagram,
            url: url,
            productos: []
        });
        window.loadClients();
    } catch (e) {
        alert("Error creando cliente: " + e.message);
    }
});

// ==========================================
