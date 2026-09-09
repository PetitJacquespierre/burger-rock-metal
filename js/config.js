// Configuración Maestra del Cliente
const clientConfig = {
    id: "neneburger_rock", // Identificador único para el Kill Switch
    businessName: "Burger Rock Metal",
    whatsapp: "584146992629",
    colors: {
        primary: "#C61010",   // Rojo Rock Metal
        bgDark: "#09090b",    // Fondo principal (Negro Carbón)
        bgCard: "#18181b"     // Color de las tarjetas (Gris Oscuro)
    },

    // =============================================
    // EXTRAS / UPSELLS (fallback si no carga Firebase)
    // =============================================
    extras: [
        // --- EXTRAS DE INGREDIENTES ---
        { id: 'extra_de_maiz',     nombre: 'Extra de Maíz',           precio: 0.50, categoria: 'Extras' },
        { id: 'extra_de_huevo',    nombre: 'Extra de Huevo',          precio: 0.50, categoria: 'Extras' },
        { id: 'extra_de_tocine',   nombre: 'Extra de Tocineta',       precio: 1.00, categoria: 'Extras' },
        { id: 'extra_de_choriz',   nombre: 'Extra de Chorizo',        precio: 1.50, categoria: 'Extras' },
        { id: 'extra_de_carne',    nombre: 'Extra de Carne',          precio: 2.00, categoria: 'Extras' },
        { id: 'extra_de_pollo',    nombre: 'Extra de Pollo',          precio: 2.00, categoria: 'Extras' },
        { id: 'extra_de_queso',    nombre: 'Extra de Queso Amarillo', precio: 0.60, categoria: 'Extras' },

        // --- BEBIDAS ---
        { id: 'refresco-400ml',  nombre: 'Refresco de 400ml',  precio: 0.70, categoria: 'Bebidas' },
        { id: 'refresco-1-litro', nombre: 'Refresco de 1 Litro',  precio: 1.50, categoria: 'Bebidas' },
        { id: 'refresco-1-5-litro', nombre: 'Refresco de 1.5 Litro', precio: 2.00, categoria: 'Bebidas' }
    ]
};

// Auto-inyectar los colores en el CSS
document.documentElement.style.setProperty('--primary', clientConfig.colors.primary);
document.documentElement.style.setProperty('--bg-dark', clientConfig.colors.bgDark);
document.documentElement.style.setProperty('--bg-card', clientConfig.colors.bgCard);
