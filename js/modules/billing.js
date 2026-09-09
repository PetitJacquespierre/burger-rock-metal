import { db, auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, getDoc, query, orderBy, setDoc } from './firebase-init.js';
import { DOM, state } from './state.js';
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
// MÓDULO DE PAGOS Y FACTURACIÓN (ROBOT COBRADOR)
// ==========================================
const btnViewPayments = document.getElementById('btn-view-payments');
const paymentsScreen = document.getElementById('payments-screen');
const paymentsTbody = document.getElementById('payments-tbody');

// Botón sidebar para ver pagos
if(btnViewPayments) btnViewPayments.addEventListener('click', () => {
    DOM.clientManager.style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'none';
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
        
        let clientUpdated = false;
        if (!clientSnap.empty) {
            clientSnap.forEach(async (cDoc) => {
                let deudaActual = cDoc.data().deuda || 0;
                let nuevaDeuda = deudaActual - montoPagado;
                if (nuevaDeuda < 0) nuevaDeuda = 0;
                
                await updateDoc(doc(db, "clientes", cDoc.id), {
                    deuda: nuevaDeuda,
                    estado: "ACTIVO"
                });
                clientUpdated = true;
            });
        }
        
        if (!clientUpdated) {
            const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const cDocSnap = await getDoc(doc(db, "clientes", cedulaPago));
            if (cDocSnap.exists()) {
                let deudaActual = cDocSnap.data().deuda || 0;
                let nuevaDeuda = deudaActual - montoPagado;
                if (nuevaDeuda < 0) nuevaDeuda = 0;
                await updateDoc(doc(db, "clientes", cDocSnap.id), {
                    deuda: nuevaDeuda,
                    estado: "ACTIVO"
                });
            }
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
// LÓGICA DE FACTURACIÓN EN EL PERFIL DEL CLIENTE
// ==========================================
    
    
    
    

if (DOM.btnSaveBilling) {
    DOM.btnSaveBilling.addEventListener('click', async () => {
        if (!state.currentClientId) return;
        const originalText = DOM.btnSaveBilling.innerText;
        DOM.btnSaveBilling.innerText = "Guardando...";
        DOM.btnSaveBilling.disabled = true;
        try {
            const cedulaVal = (DOM.inputCedula ? DOM.inputCedula.value.trim() : (document.getElementById('client-cedula') ? document.getElementById('client-cedula').value.trim() : ''));
            await updateDoc(doc(db, "clientes", state.currentClientId), {
                plan: DOM.inputPlan.value,
                deuda: parseFloat(DOM.inputDeuda.value) || 0,
                fechaVencimiento: DOM.inputVencimiento.value,
                cedula: cedulaVal
            });
            if (state.currentClientData) {
                state.currentClientData.plan = DOM.inputPlan.value;
                state.currentClientData.deuda = parseFloat(DOM.inputDeuda.value) || 0;
                state.currentClientData.fechaVencimiento = DOM.inputVencimiento.value;
                state.currentClientData.cedula = cedulaVal;
            }
            
            if (DOM.billingStatusIndicator) {
                if (DOM.inputVencimiento.value) {
                    const hoy = new Date();
                    const fechaV = new Date(DOM.inputVencimiento.value + 'T00:00:00');
                    const diff = Math.ceil((fechaV - hoy) / (1000*60*60*24));
                    if (diff > 7) DOM.billingStatusIndicator.style.background = '#10b981';
                    else if (diff >= 0 && diff <= 7) DOM.billingStatusIndicator.style.background = '#f59e0b';
                    else DOM.billingStatusIndicator.style.background = '#ef4444';
                } else {
                    DOM.billingStatusIndicator.style.background = 'gray';
                }
            }
            
            DOM.btnSaveBilling.innerText = "¡Guardado!";
            setTimeout(() => {
                DOM.btnSaveBilling.innerText = originalText;
                DOM.btnSaveBilling.disabled = false;
            }, 2000);
        } catch (error) {
            alert("Error: " + error.message);
            DOM.btnSaveBilling.innerText = originalText;
            DOM.btnSaveBilling.disabled = false;
        }
    });
}

// ==========================================
