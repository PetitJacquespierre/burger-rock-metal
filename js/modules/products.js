import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
// RENDERIZADO Y CONTROL DE PRODUCTOS Y PROMOS
// ==========================================
 // Guardar datos para actualizaciones rápidas

window.openClientManager = async function(id, data, liElement) {
    state.currentClientId = id;
    state.currentClientData = data;
    
    document.getElementById('welcome-screen').style.display = 'none';
    DOM.clientManager.style.display = 'block';
    
    if (document.getElementById('payments-screen')) {
        document.getElementById('payments-screen').style.display = 'none';
    }

    // Titulo y Link
    const titleText = document.createTextNode(`Menú de: ${data.nombre || data.nombre || data.businessName || id} `);
    DOM.managerTitle.innerHTML = '';
    const heroUrlInput = document.getElementById('client-hero-url');
    if (heroUrlInput) heroUrlInput.value = data.headerMedia || '';
    DOM.managerTitle.appendChild(titleText);
    
    if (data.url) {
        DOM.clientLink.href = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        DOM.clientLink.style.display = 'inline-block';
        DOM.managerTitle.appendChild(DOM.clientLink);
    } else {
        DOM.clientLink.style.display = 'none';
    }

    if (document.getElementById('client-mensualidad')) {
        document.getElementById('client-mensualidad').value = data.mensualidad || 0;
        document.getElementById('client-deuda').value = data.deuda || 0;
        document.getElementById('client-corte').value = data.diaCorte || 1;
    }
    DOM.managerTitle.appendChild(DOM.clientLink); // mantener en dom

    DOM.clientStatus.value = data.estado || "ACTIVO";
    DOM.storeStatus.value = data.tiendaAbierta || "AUTO";
    DOM.clientWhatsapp.value = data.whatsapp || "";
    DOM.clientInstagram.value = data.instagram || "";
    DOM.clientUrl.value = data.url || "";
    DOM.btnDeleteClient.style.display = 'block';
    
    // New fields
    
    
    if (DOM.receiveOrdersEl) DOM.receiveOrdersEl.checked = (data.recibirPedidos !== false);
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
        if (document.getElementById('client-cedula')) document.getElementById('client-cedula').value = data.cedula || '';
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

    window.renderProducts(data.productos || []);
    window.renderPromos(data.promos);
    
    // Auto-scroll al contenido en móviles
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}

// Eliminar Cliente
DOM.btnDeleteClient.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    const confirmacion = confirm(`¿Estás SEGURO de que quieres borrar a ${state.currentClientId} por completo? Esto eliminará todo su menú y configuración.`);
    if (confirmacion) {
        try {
            const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await deleteDoc(doc(db, "clientes", state.currentClientId));
            alert("Cliente eliminado correctamente.");
            DOM.clientManager.style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
            DOM.btnDeleteClient.style.display = 'none';
            state.currentClientId = null;
            window.loadClients();
        } catch (error) {
            alert("Error al eliminar cliente: " + error.message);
        }
    }
});

// Cambiar estado (Kill Switch)
DOM.clientStatus.addEventListener('change', async (e) => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            estado: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar estado.");
    }
});

// Cambiar Horario (Abierto/Cerrado/Auto)
DOM.storeStatus.addEventListener('change', async (e) => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            tiendaAbierta: e.target.value
        });
    } catch (error) {
        alert("Error al actualizar horario.");
    }
});

// Cambiar WhatsApp
DOM.btnSaveWhatsapp.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            whatsapp: DOM.clientWhatsapp.value.trim()
        });
        alert("Número de WhatsApp guardado en la nube.");
    } catch (error) {
        alert("Error al guardar WhatsApp.");
    }
});

// Cambiar Instagram
DOM.btnSaveInstagram.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            instagram: DOM.clientInstagram.value.trim()
        });
        alert("Instagram guardado en la nube.");
    } catch (error) {
        alert("Error al guardar Instagram.");
    }
});

// Cambiar URL
DOM.btnSaveUrl.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const newUrl = DOM.clientUrl.value.trim();
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            url: newUrl
        });
        
        // Update the link UI immediately
        if (newUrl) {
            DOM.clientLink.href = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
            DOM.clientLink.style.display = 'inline-block';
        } else {
            DOM.clientLink.style.display = 'none';
        }
        
        alert("URL guardada en la nube. ¡Ya puedes hacer clic en el link ÃƒÂ°Ã…Â¸Ã¢â‚¬Â Ã¢â‚¬â€  junto al título!");
    } catch (error) {
        alert("Error al guardar URL.");
    }
});

// Guardar Portada (Hero Video/Imagen)
const btnSaveHero = document.getElementById('btn-save-hero');
if (btnSaveHero) {
    btnSaveHero.addEventListener('click', async () => {
        if (!state.currentClientId) return;
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const heroUrlInput = document.getElementById('client-hero-url');
            const newHero = heroUrlInput ? heroUrlInput.value.trim() : '';
            
            await updateDoc(doc(db, "clientes", state.currentClientId), {
                headerMedia: newHero
            });
            
            alert(newHero === '' ? "Portada eliminada (se usará el diseño normal)" : "Portada guardada exitosamente.");
        } catch (error) {
            alert("Error al guardar la portada: " + error.message);
        }
    });
}

// Visitar Tienda
DOM.btnVisitUrl.addEventListener('click', () => {
    const url = DOM.clientUrl.value.trim();
    if (url) {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(fullUrl, '_blank');
    } else {
        alert('Por favor ingresa un link de tienda primero.');
    }
});

// Productos
window.actualizarProducto = async function(index, campo, valor) {
    if (!state.currentClientId) return;
    state.currentClientData.productos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        if (campo === 'imagen') window.renderProducts(state.currentClientData.productos); // Re-render solo si cambia la imagen para actualizar preview
    } catch(e) { console.error(e); alert("Error guardando"); }
};

window.agregarProductoRapido = async function() {
    if (!state.currentClientId) return;
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
    if(!state.currentClientData.productos) state.currentClientData.productos = [];
    state.currentClientData.productos.push(prod);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        window.renderProducts(state.currentClientData.productos);
    } catch(e) { console.error(e); }
};

window.renderProducts = function(productos) {
    DOM.productsTbody.innerHTML = '';
    
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
    DOM.productsTbody.appendChild(newTr);

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
                <button class="btn-secondary btn-small" style="padding: 2px 5px;" onclick="window.moveProduct(${index}, -1)" title="Subir fila">🔼</button>
                <button class="btn-secondary btn-small" style="padding: 2px 5px;" onclick="window.moveProduct(${index}, 1)" title="Bajar fila">🔽</button>
                <button class="btn-secondary btn-small" onclick="window.deleteProduct(${index})" title="Eliminar">❌</button>
            </td>
        `;
        DOM.productsTbody.appendChild(tr);
    });
}

window.moveProduct = async function(index, direction) {
    if (!state.currentClientId) return;
    const newIndex = index + direction;
    
    // Evitar salir de los límites del array
    if (newIndex < 0 || newIndex >= state.currentClientData.productos.length) return;

    // Intercambiar elementos
    const temp = state.currentClientData.productos[index];
    state.currentClientData.productos[index] = state.currentClientData.productos[newIndex];
    state.currentClientData.productos[newIndex] = temp;

    // Actualizar vista inmediatamente
    window.renderProducts(state.currentClientData.productos);

    // Guardar en la nube
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
    } catch (e) {
        alert("Error guardando el nuevo orden.");
        console.error(e);
    }
};

window.deleteProduct = async function(index) {
    if(!confirm("¿Eliminar este producto?")) return;
    state.currentClientData.productos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { productos: state.currentClientData.productos });
        window.renderProducts(state.currentClientData.productos);
    } catch (e) { alert("Error."); }
};

// Promociones


window.actualizarPromo = async function(index, campo, valor) {
    if (!state.currentClientId) return;
    state.currentClientData.promos[index][campo] = valor;
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), { promos: state.currentClientData.promos });
    } catch(e) { console.error(e); }
};

window.renderPromos = function(promos) {
    DOM.promosTbody.innerHTML = '';
    if (!promos || promos.length === 0) return;

    promos.forEach((p, index) => {
        const tr = document.createElement('tr');
        const isChecked = p.activo === 'SI' ? 'selected' : '';
        const isNotChecked = p.activo === 'NO' ? 'selected' : '';
        
        tr.innerHTML = `
            <td>
                <input type="text" class="modern-select" value="${p.imagen || ''}" onchange="actualizarPromo(${index}, 'imagen', this.value)" style="width:100px; padding:4px;" placeholder="promo1.jpg">
            </td>
            <td><input type="text" class="modern-select" value="${p.nombre || ''}" onchange="actualizarPromo(${index}, 'nombre', this.value)" style="width:120px; padding:4px;" placeholder="Ej. Promo Chori"></td>
            <td><input type="text" class="modern-select" value="${p.descripcion || ''}" onchange="actualizarPromo(${index}, 'descripcion', this.value)" style="width:150px; padding:4px;" placeholder="Detalles de la promo"></td>
            <td><input type="number" class="modern-select" value="${p.precio || 0}" onchange="actualizarPromo(${index}, 'precio', parseFloat(this.value))" style="width:60px; padding:4px;"></td>
            <td>
                <select class="modern-select" style="padding:4px;" onchange="actualizarPromo(${index}, 'activo', this.value)">
                    <option value="SI" ${isChecked}>SI (Prendido)</option>
                    <option value="NO" ${isNotChecked}>NO (Apagado)</option>
                </select>
            </td>
            <td>
                <button class="btn-secondary btn-small" onclick="window.deletePromo(${index})" title="Eliminar">❌</button>
            </td>
        `;
        DOM.promosTbody.appendChild(tr);
    });
}

window.deletePromo = async function(index) {
    if(!confirm("¿Eliminar esta promo de la lista?")) return;
    state.currentClientData.promos.splice(index, 1);
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            promos: state.currentClientData.promos
        });
        window.renderPromos(state.currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
};

DOM.btnAddPromo.addEventListener('click', async () => {
    const filename = prompt("Nombre del archivo de imagen (ej. promo3.jpg):");
    if(!filename) return;
    
    state.currentClientData.promos.push({ imagen: filename, activo: 'SI' });
    
    try {
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc(db, "clientes", state.currentClientId), {
            promos: state.currentClientData.promos
        });
        window.renderPromos(state.currentClientData.promos);
    } catch (e) {
        alert("Error.");
    }
});









// Añadir Producto Mínimo Viable (usando prompts por rapidez de la primera versión)
DOM.btnAddProduct.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    
    const nombre = prompt("Nombre del producto:");
    if (!nombre) return;
    const precio = prompt("Precio en dólares (ej. 5.50):");
    const categoria = prompt("Categoría (ej. Promociones, Hamburguesas):");
    const imagen = prompt("URL de la imagen:");
    const descripcion = prompt("Descripción corta:");
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
        const docRef = doc(db, "clientes", state.currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const productosActuales = data.productos || [];
        productosActuales.push(nuevoProducto);
        
        await updateDoc(docRef, { productos: productosActuales });
        window.renderProducts(productosActuales);
    } catch (e) {
        alert("Error al guardar producto.");
    }
});

// Lógica para el botón Importar con IA
if(DOM.btnImportBulk) DOM.btnImportBulk.addEventListener('click', () => {
    DOM.importRawText.value = ''; // Limpiar el área de texto
    // Cargar API key guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) DOM.geminiApiKey.value = savedKey;
    DOM.importModal.style.display = 'flex';
});

if(DOM.btnCancelImport) DOM.btnCancelImport.addEventListener('click', () => {
    DOM.importModal.style.display = 'none';
});

if(DOM.btnConfirmImport) DOM.btnConfirmImport.addEventListener('click', async () => {
    if (!state.currentClientId) return;
    
    const rawText = DOM.importRawText.value.trim();
    const apiKey = DOM.geminiApiKey.value.trim();
    
    if (!rawText || !apiKey) {
        alert("Por favor, ingresa el texto del menú y tu API Key de Gemini.");
        return;
    }
    
    // Guardar la llave para el futuro
    localStorage.setItem('gemini_api_key', apiKey);
    
    try {
        DOM.btnConfirmImport.disabled = true;
        DOM.btnCancelImport.disabled = true;
        DOM.aiLoadingText.style.display = 'block';
        
        // Llamada a la API de Gemini (REST) usando el modelo más reciente (3.6-flash)
        const promptText = `
        Tengo este menú crudo de un restaurante. Extrae todos los productos y devuélvelos estrictamente como un arreglo de objetos JSON con esta estructura exacta, basándote en un esquema de Excel, sin texto extra:
        [
          {
            "id": "generar un ID numérico único",
            "categoria": "string (usa tu mejor juicio, ej: Hamburguesas, Bebidas)",
            "nombre": "string",
            "descripcion": "string (ingredientes)",
            "precio": number (solo el número, ej: 5.50),
            "imagen": "string (nombre archivo, ej: hamburguesa.jpg o url)",
            "activo": "SI"
          }
        ]
        
        Menú crudo a procesar:
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
            throw new Error("La IA no devolvió una lista válida.");
        }
        
        // Formatear precios por seguridad
        const cleanData = jsonData.map(p => ({
            ...p,
            precio: parseFloat(p.precio) || 0
        }));
        
        const docRef = doc(db, "clientes", state.currentClientId);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        let productosActuales = data.productos || [];
        
        // Agregar los nuevos productos a los existentes
        productosActuales = productosActuales.concat(cleanData);
        
        await updateDoc(docRef, { productos: productosActuales });
        window.renderProducts(productosActuales);
        
        DOM.importModal.style.display = 'none';
        alert(`¡Inteligencia Artificial Exitosamente aplicada! Se importaron ${cleanData.length} productos automáticamente.`);
    } catch (e) {
        alert("Error de la IA o de red: " + e.message);
    } finally {
        DOM.btnConfirmImport.disabled = false;
        DOM.btnCancelImport.disabled = false;
        DOM.aiLoadingText.style.display = 'none';
    }
});



// ==========================================
