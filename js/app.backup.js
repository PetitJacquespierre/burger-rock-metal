import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ConfiguraciÃƒÆ’Ã‚Â³n de Firebase (Generada automÃƒÆ’Ã‚Â¡ticamente)
const firebaseConfig = {
    projectId: "grow-studio-menus",
    appId: "1:152582182898:web:cf17e88b6b1f861cdc7d6b",
    storageBucket: "grow-studio-menus.firebasestorage.app",
    apiKey: "AIzaSyAv7GDSLS3Kwb-aMAhyQE3YgnPkCNg8cvg",
    authDomain: "grow-studio-menus.firebaseapp.com",
    messagingSenderId: "152582182898",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmailDisplay = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');
const clientsUl = document.getElementById('clients-ul');
const btnNewClient = document.getElementById('btn-new-client');
const clientManager = document.getElementById('client-manager');
const managerTitle = document.getElementById('manager-title');
const clientStatus = document.getElementById('client-status');
const storeStatus = document.getElementById('store-status');
const clientWhatsapp = document.getElementById('client-whatsapp');
const btnSaveWhatsapp = document.getElementById('btn-save-whatsapp');
const clientUrl = document.getElementById('client-url');
const btnSaveUrl = document.getElementById('btn-save-url');
const clientLink = document.getElementById('client-link');
const productsTbody = document.getElementById('products-tbody');
const btnAddProduct = document.getElementById('btn-add-product');
const btnDeleteClient = document.getElementById('btn-delete-client');

let currentClientId = null;
let clientsData = {};

// ==========================================
// AUTENTICACIÃƒÆ’Ã¢â‚¬Å“N
// ==========================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario Logueado
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        userEmailDisplay.innerText = user.email;
        loadClients();
        if (window.correrRobotCobrador) window.correrRobotCobrador();
    } else {
        // No logueado
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
        currentClientId = null;
    }
});

loginForm.addEventListener('submit', async (e) => {
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
        loginError.innerText = "Error: " + error.message;
        loginError.style.display = 'block';
    } finally {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

const btnForgotPassword = document.getElementById('btn-forgot-password');
btnForgotPassword.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        alert("Por favor, ingresa tu correo electrÃƒÆ’Ã‚Â³nico primero en la casilla de arriba para enviarte el link de recuperaciÃƒÆ’Ã‚Â³n.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Ãƒâ€šÃ‚Â¡Enlace de recuperaciÃƒÆ’Ã‚Â³n enviado! Revisa tu bandeja de entrada (y la carpeta de SPAM).");
    } catch (error) {
        alert("Error al enviar el correo. Verifica que el correo estÃƒÆ’Ã‚Â© bien escrito y exista.");
    }
});

// ==========================================
// GESTIÃƒÆ’Ã¢â‚¬Å“N DE CLIENTES
// ==========================================

async function loadClients() {
    clientsUl.innerHTML = '<li style="color:gray">Cargando...</li>';
    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        clientsUl.innerHTML = '';
        
        if (querySnapshot.empty) {
            clientsUl.innerHTML = '<li style="color:gray">No hay clientes aÃƒÆ’Ã‚Âºn</li>';
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
            li.onclick = () => openClientManager(docSnap.id, data, li);
            clientsUl.appendChild(li);
        });
    } catch (error) {
        console.error("Error cargando clientes:", error);
        clientsUl.innerHTML = '<li style="color:red">Error de conexiÃƒÆ’Ã‚Â³n</li>';
    }
}

btnNewClient.addEventListener('click', async () => {
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    btnNewClient.classList.add('active');
    
    const id = prompt("Ingresa el ID ÃƒÆ’Ã‚Âºnico del cliente (ej. la_flaca, foodpoint):");
    if (!id) return;
    

    const name = prompt("Nombre comercial del cliente (ej. Pasteles La Flaca):");
    if (!name) return;

    const whatsapp = prompt("NÃƒÆ’Ã‚Âºmero de WhatsApp del cliente con cÃƒÆ’Ã‚Â³digo de paÃƒÆ’Ã‚Â­s (ej. 584120000000):") || "";
    const url = prompt("Link de la tienda en Vercel (Opcional, ej: https://laflaca.vercel.app):") || "";

    try {
        await setDoc(doc(db, "clientes", id), {
            businessName: name,
            estado: "ACTIVO",
            tiendaAbierta: "AUTO",
            whatsapp: whatsapp,
            url: url,
            productos: []
        });
        loadClients();
    } catch (e) {
        alert("Error creando cliente: " + e.message);
    }
});

// ==========================================
// RENDERIZADO Y CONTROL DE PRODUCTOS Y PROMOS
// ==========================================
let currentClientData = null; // Guardar datos para actualizaciones rÃƒÆ’Ã‚Â¡pidas

async function openClientManager(id, data, liElement) {
    currentClientId = id;
    currentClientData = data;
    
    document.getElementById('welcome-screen').style.display = 'none';
    clientManager.style.display = 'block';
    
    if (document.getElementById('payments-screen')) {
        document.getElementById('payments-screen').style.display = 'none';
    }

    // Titulo y Link
    const titleText = document.createTextNode(`Menú de: ${data.nombre || data.nombre || data.businessName || id} `);
    managerTitle.innerHTML = '';
    managerTitle.appendChild(titleText);
    
    if (data.url) {
        clientLink.href = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        clientLink.style.display = 'inline-block';
        managerTitle.appendChild(clientLink);
    } else {
        clientLink.style.display = 'none';
    }

    if (document.getElementById('client-mensualidad')) {
        document.getElementById('client-mensualidad').value = data.mensualidad || 0;
        document.getElementById('client-deuda').value = data.deuda || 0;
        document.getElementById('client-corte').value = data.diaCorte || 1;
    }
    managerTitle.appendChild(clientLink); // mantener en dom

    clientStatus.value = data.estado || "ACTIVO";
    storeStatus.value = data.tiendaAbierta || "AUTO";
    clientWhatsapp.value = data.whatsapp || "";
    clientUrl.value = data.url || "";
    btnDeleteClient.style.display = 'block';
    
    // New fields
    const colorHex = data.colorPrimario || "#F97316";
    document.getElementById('client-color-picker').value = colorHex;
    document.getElementById('client-color-hex').value = colorHex;
    const receiveOrdersEl = document.getElementById('client-receive-orders');
    if (receiveOrdersEl) receiveOrdersEl.checked = (data.recibirPedidos !== false);
    document.getElementById('client-visitas').innerText = data.visitas || 0;
    
    document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
    document.getElementById('btn-new-client').classList.remove('active');
    if (liElement) liElement.classList.add('active');
    
    // Si no tiene promos creadas por defecto, creamos promo1 y promo2 apagadas visualmente
    if (!data.promos || data.promos.length === 0) {
        data.promos = [
            { imagen: 'promo1.jpg', activo: 'NO' },
            { imagen: 'promo2.jpg', activo: 'NO' }
        ];
    }
    
    // Populate Billing
    if (document.getElementById('client-plan')) {
        document.getElementById('client-plan').value = data.plan || 'PRUEBA';
        document.getElementById('client-vencimiento').value = data.fechaVencimiento || '';
        document.getElementById('client-deuda').value = data.deuda || 0;
        
        const indicator = document.getElementById('billing-status-indicator');
        if (indicator) {
            if (data.fechaVencimiento) {
                const hoy = new Date();
                const fechaV = new Date(data.fechaVencimiento + 'T00:00:00');
                const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                if (diff > 7) indicator.style.background = '#10b981';
                else if (diff >= 0 && diff <= 7) indicator.style.background = '#f59e0b';
                else indicator.style.background = '#ef4444';
            } else {
                indicator.style.background = 'gray';
            }
        }
    }

    renderProducts(data.productos || []);
    renderPromos(data.promos);
}

// Eliminar Cliente
btnDeleteClient.addEventListener('click', async () => {
    if (!currentClientId) return;
    const confirmacion = confirm(`Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡s SEGURO de que quieres borrar a ${currentClientId} por completo? Esto eliminarÃƒÆ’Ã‚Â¡ todo su menÃƒÆ’Ã‚Âº y configuraciÃƒÆ’Ã‚Â³n.`);
    if (confirmacion) {
        try {
            const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await deleteDoc(doc(db, "clientes", currentClientId));
            alert("Cliente eliminado correctamente.");
            clientManager.style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
            btnDeleteClient.style.display = 'none';
            currentClientId = null;
            loadClients();
        } catch (error) {
            alert("Error al eliminar cliente: " + error.message);
        }
    }
});

// Cambiar estado (Kill Switch)
clientStatus.addEventListener('change', async (e) => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            estado: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar estado.");
    }
});

// Cambiar Horario (Abierto/Cerrado/Auto)
storeStatus.addEventListener('change', async (e) => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            tiendaAbierta: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar horario.");
    }
});

// Cambiar WhatsApp
btnSaveWhatsapp.addEventListener('click', async () => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            whatsapp: clientWhatsapp.value.trim()
        });
        alert("NÃƒÆ’Ã‚Âºmero de WhatsApp guardado en la nube.");
    } catch (error) {
        alert("Error al guardar WhatsApp.");
    }
});

// Cambiar URL
btnSaveUrl.addEventListener('click', async () => {
    if (!currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const newUrl = clientUrl.value.trim();
        await updateDoc(doc(db, "clientes", currentClientId), {
            url: newUrl
        });
        
        // Update the link UI immediately
        if (newUrl) {
            clientLink.href = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
            clientLink.style.display = 'inline-block';
        } else {
            clientLink.style.display = 'none';
        }
        
        alert("URL guardada en la nube. Ãƒâ€šÃ‚Â¡Ya puedes hacer clic en el link ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â€ junto al tÃƒÆ’Ã‚Â­tulo!");
    } catch (error) {
        alert("Error al guardar URL.");
    }
});

// Productos
window.actualizarProducto = async function(index, campo, valor) {
    if (!currentClientId) return;
    currentClientData.productos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), { productos: currentClientData.productos });
        if (campo === 'imagen') renderProducts(currentClientData.productos); // Re-render solo si cambia la imagen para actualizar preview
    } catch(e) { console.error(e); alert("Error guardando"); }
};

window.agregarProductoRapido = async function() {
    if (!currentClientId) return;
    const nombre = document.getElementById('new-prod-nombre').value;
    if (!nombre) return;
    const prod = {
        nombre: nombre,
        descripcion: document.getElementById('new-prod-desc') ? document.getElementById('new-prod-desc').value : "",
        imagen: document.getElementById('new-prod-imagen').value || 'hamburguesa.png',
        categoria: document.getElementById('new-prod-categoria').value || 'General',
        precio: parseFloat(document.getElementById('new-prod-precio').value) || 0,
        activo: "SI"
    };
    if(!currentClientData.productos) currentClientData.productos = [];
    currentClientData.productos.push(prod);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), { productos: currentClientData.productos });
        renderProducts(currentClientData.productos);
    } catch(e) { console.error(e); }
};

function renderProducts(productos) {
    productsTbody.innerHTML = '';
    
    // Fila para agregar rápido (Excel style)
    const newTr = document.createElement('tr');
    newTr.style.background = "rgba(16, 185, 129, 0.1)"; // Fondo verdecito
    newTr.innerHTML = `
        <td><input type="text" id="new-prod-imagen" class="modern-select" placeholder="ej. pizza.jpg" style="width:100px; padding:4px;"></td>
        <td><input type="text" id="new-prod-nombre" class="modern-select" placeholder="Nuevo Producto..." style="width:120px; padding:4px;"></td>
        <td><input type="text" id="new-prod-desc" class="modern-select" placeholder="Descripción..." style="width:150px; padding:4px;"></td>
        <td><input type="text" id="new-prod-categoria" class="modern-select" placeholder="Categoría" style="width:80px; padding:4px;"></td>
        <td><input type="number" id="new-prod-precio" class="modern-select" placeholder="0" style="width:60px; padding:4px;"></td>
        <td>-</td>
        <td><button class="btn-primary btn-small" onclick="agregarProductoRapido()">+ Add</button></td>
    `;
    productsTbody.appendChild(newTr);

    if (productos.length === 0) return;

    productos.forEach((p, index) => {
        const tr = document.createElement('tr');
        const isChecked = p.activo === 'SI' ? 'selected' : '';
        const isNotChecked = p.activo === 'NO' ? 'selected' : '';
        
        tr.innerHTML = `
            <td><input type="text" class="modern-select" value="${p.imagen || ''}" onchange="actualizarProducto(${index}, 'imagen', this.value)" style="width:100px; padding:4px;"></td>
            <td><input type="text" class="modern-select" value="${p.nombre || ''}" onchange="actualizarProducto(${index}, 'nombre', this.value)" style="width:120px; padding:4px;"></td>
            <td><input type="text" class="modern-select" value="${p.descripcion || ''}" onchange="actualizarProducto(${index}, 'descripcion', this.value)" style="width:150px; padding:4px;"></td>
            <td><input type="text" class="modern-select" value="${p.categoria || ''}" onchange="actualizarProducto(${index}, 'categoria', this.value)" style="width:80px; padding:4px;"></td>
            <td><input type="number" class="modern-select" value="${p.precio || 0}" onchange="actualizarProducto(${index}, 'precio', parseFloat(this.value))" style="width:60px; padding:4px;"></td>
            <td>
                <select class="modern-select" style="padding:4px;" onchange="actualizarProducto(${index}, 'activo', this.value)">
                    <option value="SI" ${isChecked}>Activo</option>
                    <option value="NO" ${isNotChecked}>Oculto</option>
                </select>
            </td>
            <td>
                <button class="btn-secondary btn-small" onclick="window.deleteProduct(${index})">❌</button>
            </td>
        `;
        productsTbody.appendChild(tr);
    });
}

window.deleteProduct = async function(index) {
    if(!confirm("¿Eliminar este producto?")) return;
    currentClientData.productos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), { productos: currentClientData.productos });
        renderProducts(currentClientData.productos);
    } catch (e) { alert("Error."); }
};

// Promociones
const promosTbody = document.getElementById('promos-tbody');

window.actualizarPromo = async function(index, campo, valor) {
    if (!currentClientId) return;
    currentClientData.promos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), { promos: currentClientData.promos });
    } catch(e) { console.error(e); }
};

function renderPromos(promos) {
    promosTbody.innerHTML = '';
    if (!promos || promos.length === 0) return;

    promos.forEach((p, index) => {
        const tr = document.createElement('tr');
        const isChecked = p.activo === 'SI' ? 'selected' : '';
        const isNotChecked = p.activo === 'NO' ? 'selected' : '';
        
        tr.innerHTML = `
            <td>
                <input type="text" class="modern-select" value="${p.imagen || ''}" onchange="actualizarPromo(${index}, 'imagen', this.value)" style="width:100%; padding:4px;" placeholder="promo1.jpg">
            </td>
            <td>
                <select class="modern-select" style="padding:4px;" onchange="actualizarPromo(${index}, 'activo', this.value)">
                    <option value="SI" ${isChecked}>SI (Prendido)</option>
                    <option value="NO" ${isNotChecked}>NO (Apagado)</option>
                </select>
            </td>
            <td>
                <!-- Las promos principales no se borran, solo se apagan -->
            </td>
        `;
        promosTbody.appendChild(tr);
    });
}

window.deletePromo = async function(index) {
    if(!confirm("Ãƒâ€šÃ‚Â¿Eliminar esta promo de la lista?")) return;
    currentClientData.promos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            promos: currentClientData.promos
        });
        renderPromos(currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
};

btnAddPromo.addEventListener('click', async () => {
    const filename = prompt("Nombre del archivo de imagen (ej. promo3.jpg):");
    if(!filename) return;
    
    currentClientData.promos.push({ imagen: filename, activo: 'SI' });
    
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", currentClientId), {
            promos: currentClientData.promos
        });
        renderPromos(currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
});

const btnImportBulk = document.getElementById('btn-import-bulk');
const importModal = document.getElementById('import-modal');
const btnConfirmImport = document.getElementById('btn-confirm-import');
const btnCancelImport = document.getElementById('btn-cancel-import');
const importRawText = document.getElementById('import-raw-text');
const geminiApiKey = document.getElementById('gemini-api-key');
const aiLoadingText = document.getElementById('ai-loading-text');

// AÃƒÆ’Ã‚Â±adir Producto MÃƒÆ’Ã‚Â­nimo Viable (usando prompts por rapidez de la primera versiÃƒÆ’Ã‚Â³n)
btnAddProduct.addEventListener('click', async () => {
    if (!currentClientId) return;
    
    const nombre = prompt("Nombre del producto:");
    if (!nombre) return;
    const precio = prompt("Precio en dÃƒÆ’Ã‚Â³lares (ej. 5.50):");
    const categoria = prompt("CategorÃƒÆ’Ã‚Â­a (ej. Promociones, Hamburguesas):");
    const imagen = prompt("URL de la imagen:");
    const descripcion = prompt("DescripciÃƒÆ’Ã‚Â³n corta:");
    const extras = prompt("Nombres de los extras separados por coma (opcional):");

    const nuevoProducto = {
        nombre: nombre,
        precio: parseFloat(precio) || 0,
        categoria: categoria || "General",
        imagen: imagen || "https://placehold.co/400",
        descripcion: descripcion || "",
        extras: extras || ""
    };

    try {
        const docRef = doc(db, "clientes", currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const productosActuales = data.productos || [];
        productosActuales.push(nuevoProducto);
        
        await updateDoc(docRef, { productos: productosActuales });
        renderProducts(productosActuales);
    } catch (e) {
        alert("Error al guardar producto.");
    }
});

// LÃƒÆ’Ã‚Â³gica para el botÃƒÆ’Ã‚Â³n Importar con IA
if(btnImportBulk) btnImportBulk.addEventListener('click', () => {
    importRawText.value = ''; // Limpiar el ÃƒÆ’Ã‚Â¡rea de texto
    // Cargar API key guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) geminiApiKey.value = savedKey;
    importModal.style.display = 'flex';
});

if(btnCancelImport) btnCancelImport.addEventListener('click', () => {
    importModal.style.display = 'none';
});

if(btnConfirmImport) btnConfirmImport.addEventListener('click', async () => {
    if (!currentClientId) return;
    
    const rawText = importRawText.value.trim();
    const apiKey = geminiApiKey.value.trim();
    
    if (!rawText || !apiKey) {
        alert("Por favor, ingresa el texto del menÃƒÆ’Ã‚Âº y tu API Key de Gemini.");
        return;
    }
    
    // Guardar la llave para el futuro
    localStorage.setItem('gemini_api_key', apiKey);
    
    try {
        btnConfirmImport.disabled = true;
        btnCancelImport.disabled = true;
        aiLoadingText.style.display = 'block';
        
        // Llamada a la API de Gemini (REST) usando el modelo mÃƒÆ’Ã‚Â¡s reciente (3.6-flash)
        const promptText = `
        Tengo este menÃƒÆ’Ã‚Âº crudo de un restaurante. Extrae todos los productos y devuÃƒÆ’Ã‚Â©lvelos estrictamente como un arreglo de objetos JSON con esta estructura exacta, basÃƒÆ’Ã‚Â¡ndote en un esquema de Excel, sin texto extra:
        [
          {
            "id": "generar un ID numÃƒÆ’Ã‚Â©rico ÃƒÆ’Ã‚Âºnico",
            "categoria": "string (usa tu mejor juicio, ej: Hamburguesas, Bebidas)",
            "nombre": "string",
            "descripcion": "string (ingredientes)",
            "precio": number (solo el nÃƒÆ’Ã‚Âºmero, ej: 5.50),
            "imagen": "string (nombre archivo, ej: hamburguesa.jpg o url)",
            "activo": "SI"
          }
        ]
        
        MenÃƒÆ’Ã‚Âº crudo a procesar:
        ${rawText}
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        let aiResponseText = result.candidates[0].content.parts[0].text;
        
        // Limpiar el texto en caso de que Gemini haya devuelto markdown
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonData = JSON.parse(aiResponseText);
        
        if (!Array.isArray(jsonData)) {
            throw new Error("La IA no devolviÃƒÆ’Ã‚Â³ una lista vÃƒÆ’Ã‚Â¡lida.");
        }
        
        // Formatear precios por seguridad
        const cleanData = jsonData.map(p => ({
            ...p,
            precio: parseFloat(p.precio) || 0
        }));
        
        const docRef = doc(db, "clientes", currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        
        // Agregar los nuevos productos a los existentes
        productosActuales = productosActuales.concat(cleanData);
        
        await updateDoc(docRef, { productos: productosActuales });
        renderProducts(productosActuales);
        
        importModal.style.display = 'none';
        alert(`Ãƒâ€šÃ‚Â¡Inteligencia Artificial Exitosamente aplicada! Se importaron ${cleanData.length} productos automÃƒÆ’Ã‚Â¡ticamente.`);
    } catch (e) {
        alert("Error de la IA o de red: " + e.message);
    } finally {
        btnConfirmImport.disabled = false;
        btnCancelImport.disabled = false;
        aiLoadingText.style.display = 'none';
    }
});



// ==========================================
// MÃƒÆ’Ã¢â‚¬Å“DULO DE PAGOS Y FACTURACIÃƒÆ’Ã¢â‚¬Å“N (ROBOT COBRADOR)
// ==========================================
const btnViewPayments = document.getElementById('btn-view-payments');
const paymentsScreen = document.getElementById('payments-screen');
const paymentsTbody = document.getElementById('payments-tbody');

// BotÃƒÆ’Ã‚Â³n sidebar para ver pagos
if(btnViewPayments) btnViewPayments.addEventListener('click', () => {
    clientManager.style.display = 'none';
    welcomeScreen.style.display = 'none';
    paymentsScreen.style.display = 'flex';
    
    document.querySelectorAll('.menu-list li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    btnViewPayments.classList.add('active');
    
    cargarPagos();
});

async function cargarPagos() {
    paymentsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando pagos...</td></tr>';
    try {
        const q = query(collection(db, "pagos"), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);
        paymentsTbody.innerHTML = '';
        
        if (snapshot.empty) {
            paymentsTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay pagos registrados.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const p = docSnap.data();
            const tr = document.createElement('tr');
            
            let btnAccion = '';
            let badgeClass = 'por-revisar';
            if (p.estado === "POR REVISAR") {
                btnAccion = `<button class="btn-primary btn-small" onclick="window.aprobarPago('${docSnap.id}', '${p.cedula}', ${p.monto}, '${p.fechaLocal || 'Hoy'}', '${p.referencia || '-'}')">Ã¢Å“â€¦ Aprobar</button>`;
            } else if (p.estado === "APROBADO") {
                badgeClass = 'aprobado';
                btnAccion = `<button class="btn-secondary btn-small" style="color:var(--brand-orange); border: 1px solid var(--brand-orange);" onclick="window.generarReciboPDF('${p.cedula}', ${p.monto}, '${p.fechaLocal || 'Hoy'}', '${p.referencia || '-'}')">Ã°Å¸â€œÂ¥ PDF</button>`;
            }
            
            tr.innerHTML = `
                <td>${p.fechaLocal || 'Reciente'}</td>
                <td>${p.cedula}</td>
                <td>${p.plan || 'N/A'}</td>
                <td>$${p.monto}</td>
                <td>${p.referencia}</td>
                <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                <td>${btnAccion}</td>
            `;
            paymentsTbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar pagos:", error);
        paymentsTbody.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar pagos</td></tr>';
    }
}

// Hacer global para el onclick inline
window.aprobarPago = async function(pagoId, cedulaPago, montoPagado, fechaPago, referenciaPago) {
    if (!confirm("Â¿Confirmas que recibiste $" + montoPagado + " y deseas descontarlo de la deuda del cliente " + cedulaPago + "?")) return;
    
    try {
        const { doc, updateDoc, getDocs, query, collection, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        await updateDoc(doc(db, "pagos", pagoId), {
            estado: "APROBADO"
        });

        // Buscar al cliente por la cÃ©dula
        const q = query(collection(db, "clientes"), where("cedula", "==", cedulaPago));
        const clientSnap = await getDocs(q);
        
        if (!clientSnap.empty) {
            clientSnap.forEach(async (cDoc) => {
                let deudaActual = cDoc.data().deuda || 0;
                let nuevaDeuda = deudaActual - montoPagado;
                if (nuevaDeuda < 0) nuevaDeuda = 0;
                
                await updateDoc(doc(db, "clientes", cDoc.id), {
                    deuda: nuevaDeuda,
                    estado: "ACTIVO"
                });
            });
        }
        
        alert("Pago aprobado y deuda descontada automÃ¡ticamente.");
        
        // Generar PDF
        if (window.generarReciboPDF) {
            window.generarReciboPDF(cedulaPago, montoPagado, fechaPago, referenciaPago);
        }
        
        cargarPagos();
    } catch (error) {
        alert("Error al aprobar el pago: " + error.message);
    }
};

// ==========================================
// LÃƒÆ’Ã¢â‚¬Å“GICA DE FACTURACIÃƒÆ’Ã¢â‚¬Å“N EN EL PERFIL DEL CLIENTE
// ==========================================
    const inputPlan = document.getElementById('client-plan');
    const inputDeuda = document.getElementById('client-deuda');
    const inputVencimiento = document.getElementById('client-vencimiento');
    const btnSaveBilling = document.getElementById('btn-save-billing');

if (btnSaveBilling) {
    btnSaveBilling.addEventListener('click', async () => {
        if (!currentClientId) return;
        const originalText = btnSaveBilling.innerText;
        btnSaveBilling.innerText = "Guardando...";
        btnSaveBilling.disabled = true;
        try {
            await updateDoc(doc(db, "clientes", currentClientId), {
                plan: inputPlan.value,
                deuda: parseFloat(inputDeuda.value) || 0,
                fechaVencimiento: inputVencimiento.value
            });
            if (currentClientData) {
                currentClientData.plan = inputPlan.value;
                currentClientData.deuda = parseFloat(inputDeuda.value) || 0;
                currentClientData.fechaVencimiento = inputVencimiento.value;
            }
            
            if (billingStatusIndicator) {
                if (inputVencimiento.value) {
                    const hoy = new Date();
                    const fechaV = new Date(inputVencimiento.value + 'T00:00:00');
                    const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                    if (diff > 7) billingStatusIndicator.style.background = '#10b981';
                    else if (diff >= 0 && diff <= 7) billingStatusIndicator.style.background = '#f59e0b';
                    else billingStatusIndicator.style.background = '#ef4444';
                } else {
                    billingStatusIndicator.style.background = 'gray';
                }
            }
            
            btnSaveBilling.innerText = "¡Guardado!";
            setTimeout(() => {
                btnSaveBilling.innerText = originalText;
                btnSaveBilling.disabled = false;
            }, 2000);
        } catch (error) {
            alert("Error: " + error.message);
            btnSaveBilling.innerText = originalText;
            btnSaveBilling.disabled = false;
        }
    });
}

// ==========================================
// REPORTES Y ESTADÍSTICAS
// ==========================================
window.generarReporteWhatsapp = function() {
    if (!currentClientData) return;
    
    const telefono = currentClientData.whatsapp || currentClientData.telefono || "";
    const visitas = currentClientData.visitas || 0;
    const nombre = currentClientData.nombre || currentClientData.businessName || "Cliente";
    
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
// NUEVAS FUNCIONALIDADES: COLOR, QR Y CONFIG
// ==========================================

// Color Picker Sync
const colorPicker = document.getElementById('client-color-picker');
const colorHex = document.getElementById('client-color-hex');
if (colorPicker && colorHex) {
    colorPicker.addEventListener('input', (e) => {
        colorHex.value = e.target.value.toUpperCase();
    });
    colorHex.addEventListener('input', (e) => {
        colorPicker.value = e.target.value;
    });
}

// Guardar Config Web
const btnSaveConfig = document.getElementById('btn-save-config');
if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', async () => {
        if (!currentClientId) return;
        
        const newColor = colorHex.value.trim();
        const recibirPedidos = document.getElementById('client-status-abierto').checked;
        
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await updateDoc(doc(db, "clientes", currentClientId), {
                colorPrimario: newColor,
                recibirPedidos: recibirPedidos
            });
            currentClientData.colorPrimario = newColor;
            currentClientData.recibirPedidos = recibirPedidos;
            alert("Ajustes Web guardados correctamente.");
        } catch (e) {
            alert("Error al guardar Ajustes Web: " + e.message);
        }
    });
}

// Generador de QR
const btnGenerateQr = document.getElementById('btn-generate-qr');
const qrModal = document.getElementById('qr-modal');
const btnCloseQr = document.getElementById('btn-close-qr');
const btnDownloadQr = document.getElementById('btn-download-qr');
const qrContainer = document.getElementById('qr-code-container');
const qrUrlText = document.getElementById('qr-url-text');
let currentQrcode = null;

if (btnGenerateQr) {
    btnGenerateQr.addEventListener('click', () => {
        if (!currentClientData || !currentClientData.url) {
            alert("El cliente no tiene un Link de la Tienda configurado.");
            return;
        }
        
        qrModal.style.display = 'flex';
        qrContainer.innerHTML = ''; // Limpiar anterior
        
        let urlToEncode = currentClientData.url;
        if (!urlToEncode.startsWith('http')) urlToEncode = 'https://' + urlToEncode;
        qrUrlText.innerText = urlToEncode;
        
        // Timeout ligero para asegurar renderizado del DOM
        setTimeout(() => {
            currentQrcode = new QRCode(qrContainer, {
                text: urlToEncode,
                width: 250,
                height: 250,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }, 100);
    });
}

if (btnCloseQr) {
    btnCloseQr.addEventListener('click', () => {
        qrModal.style.display = 'none';
    });
}

if (btnDownloadQr) {
    btnDownloadQr.addEventListener('click', () => {
        const img = qrContainer.querySelector('img');
        if (!img || !img.src) {
            alert("AÃƒÆ’Ã‚Âºn no se ha generado el QR.");
            return;
        }
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `QR_Menu_${currentClientId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// ==========================================
// GENERADOR DE RECIBOS PDF
// ==========================================
window.generarReciboPDF = (clienteId, monto, fecha, referencia) => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar color y estilo general
        doc.setFillColor(18, 18, 18); // Fondo oscuro
        doc.rect(0, 0, 210, 297, 'F');
        
        // Encabezado
        doc.setTextColor(249, 115, 22); // brand-orange
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("GROW STUDIO", 105, 30, { align: "center" });
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("Recibo de Pago", 105, 40, { align: "center" });
        
        // LÃƒÂ­nea separadora
        doc.setDrawColor(50, 50, 50);
        doc.line(20, 50, 190, 50);
        
        // Datos del recibo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Fecha: ${fecha}`, 20, 70);
        doc.text(`Cliente / Cedula: ${clienteId.toUpperCase()}`, 20, 80);
        doc.text(`Referencia Bancaria: ${referencia}`, 20, 90);
        
        // Caja de monto
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, 110, 170, 30, 3, 3, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Monto Pagado: $${monto} USD`, 105, 129, { align: "center" });
        
        // Pie de pÃƒÂ¡gina
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Ã‚Â¡Gracias por confiar en Grow Studio!", 105, 270, { align: "center" });
        doc.text("growstudioweb.vercel.app", 105, 278, { align: "center" });
        
        // Guardar
        doc.save(`Recibo_GrowStudio_${clienteId}_${referencia}.pdf`);
    } catch(e) {
        alert("Error generando PDF: " + e.message);
    }
};




window.enviarCobroWhatsApp = function() {
    if (!currentClientData || !currentClientData.whatsapp) {
        alert("El cliente no tiene un WhatsApp registrado.");
        return;
    }
    const tel = currentClientData.whatsapp.replace(/\D/g, '');
    const planStr = currentClientData.plan === 'ANUAL' ? 'Anual' : (currentClientData.plan === 'MENSUAL' ? 'Mensual' : 'de Prueba');
    const msg = encodeURIComponent(`Hola 👋 Te escribimos de Grow Studio. Te recordamos que tu Plan ${planStr} para tu Menú Digital está próximo a vencer (o acaba de vencer). Para evitar interrupciones en tu servicio y seguir recibiendo pedidos sin comisiones, puedes realizar el pago aquí:

[TUS DATOS DE PAGO AQUI]

¡Cualquier duda estamos a la orden!`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
};


// ==============================================================
// GENERADOR DE QR
// ==============================================================
window.generarQRMenu = function() {
    const currentId = clientSelector ? clientSelector.value : null;
    if (!currentId) {
        alert("Primero selecciona un cliente del menú superior.");
        return;
    }
    
    // Asumimos que los menús están en dominio vercel.app o growstudio
    // O mejor aún, usamos el valor del input de la URL si existe
    const clientUrlInput = document.getElementById('client-url');
    let menuUrl = "";
    if (clientUrlInput && clientUrlInput.value) {
        menuUrl = "https://" + clientUrlInput.value;
    } else {
        // Fallback
        if (currentId === "demo") menuUrl = "https://demomenudigital.vercel.app/";
        else if (currentId === "laflaca") menuUrl = "https://pasteleslaflaca.vercel.app/";
        else menuUrl = "https://" + currentId + ".vercel.app/";
    }
    
    const qrContainer = document.getElementById('qr-code-container');
    const qrModal = document.getElementById('qr-modal');
    const qrUrlText = document.getElementById('qr-url-text');
    
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, {
            text: menuUrl,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        if (qrUrlText) qrUrlText.innerText = menuUrl;
        if (qrModal) qrModal.style.display = 'flex';
    } else {
        alert("No se pudo generar el QR, falta la librería de QRCode.");
    }
};

window.cerrarModalQR = function() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
};
const btnCloseQr = document.getElementById('btn-close-qr');
if (btnCloseQr) btnCloseQr.onclick = window.cerrarModalQR;
window.cerrarModalQR = function() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
};

if (btnGenerateQr) {
    btnGenerateQr.onclick = window.generarQRMenu;
}
\nconst btnDownloadQr = document.getElementById(\'btn-download-qr\');\nif (btnDownloadQr) {\n    btnDownloadQr.onclick = function() {\n        const img = document.querySelector(\'#qr-code-container img\');\n        if (img && img.src) {\n            const link = document.createElement(\'a\');\n            link.download = \'menu-qr.png\';\n            link.href = img.src;\n            link.click();\n        }\n    };\n}