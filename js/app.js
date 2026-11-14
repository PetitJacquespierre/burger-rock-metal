// =========================================
// CÓDIGO ESPECÍFICO DEL CLIENTE
// =========================================
// Nota: Toda la lógica principal (Carrito, PWA, BCV, Kill Switch) 
// ahora vive en el Cerebro Central (Grow Studio Core).
//
// Usa este archivo ÚNICAMENTE si este cliente en particular 
// necesita una función personalizada que los demás no tienen.

// Sincronización con el Motor Directo BCV Oficial (bcv.org.ve -> 914.02 Bs)
window.fetchBCVRate = async function() {
    const URL_API = "https://admin-growstudio.vercel.app/api/bcv";
    try {
        const response = await fetch(URL_API, { cache: "no-store" });
        const data = await response.json();
        if (data && data.usd) {
            const nuevaTasa = parseFloat(data.usd);
            if (nuevaTasa > 10) {
                bcvRate = nuevaTasa;
                localStorage.setItem("bcvRateCache_v3", bcvRate);
                localStorage.setItem("bcvRateCache", bcvRate);
                console.log("¡BCV SaaS actualizado en pantalla desde bcv.org.ve! $: " + bcvRate);
                const bcvElem = document.getElementById('bcv-value');
                if (bcvElem) bcvElem.innerText = bcvRate.toFixed(2);
                if (typeof renderMenu === 'function') renderMenu();
                if (typeof renderUpsells === 'function') renderUpsells();
                if (typeof updateCart === 'function') updateCart();
                return true;
            }
        }
    } catch (error) {
        console.error("Error al conectar API BCV SaaS:", error);
    }
    return false;
};
