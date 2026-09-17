// =========================================
// CÓDIGO ESPECÍFICO DEL CLIENTE
// =========================================
// Nota: Toda la lógica principal (Carrito, PWA, BCV, Kill Switch) 
// ahora vive en el Cerebro Central (Grow Studio Core).
//
// Usa este archivo ÚNICAMENTE si este cliente en particular 
// necesita una función personalizada que los demás no tienen.

// Sincronización con la API BCV SaaS dedicada
window.fetchBCVRate = async function() {
    const URL_API = (typeof clientConfig !== 'undefined' && clientConfig.urlApiBCV) 
        ? clientConfig.urlApiBCV 
        : "https://script.google.com/macros/s/AKfycbxdQlLO7lDOAvbhFqwVBs722T_i1KQ08z1gdf4NdqA6HvVcwGzRX4BZtHSd58piGL11/exec";
    try {
        const response = await fetch(URL_API);
        const data = await response.json();
        if (data && data.usd) {
            const nuevaTasa = parseFloat(data.usd);
            if (nuevaTasa > 10 && (typeof bcvRate === 'undefined' || nuevaTasa !== bcvRate)) {
                bcvRate = nuevaTasa;
                localStorage.setItem("bcvRateCache", bcvRate);
                console.log("¡BCV SaaS actualizado en pantalla! $: " + bcvRate);
                const bcvElem = document.getElementById('bcv-value');
                if (bcvElem) bcvElem.innerText = bcvRate.toFixed(2);
                return true;
            }
        }
    } catch (error) {
        console.error("Error al conectar API BCV SaaS:", error);
    }
    return false;
};
