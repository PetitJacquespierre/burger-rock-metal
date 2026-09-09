const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

const replacements = [
    ['Configuraci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'Configuración'],
    ['autom\uFFFD\uFFFD\'\uFFFD\'\uFFFDticamente', 'automáticamente'],
    ['GESTI\uFFFD\uFFFD\'\uFFFD\'\uFFFDN', 'GESTIÓN'],
    ['a\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'aún'],
    ['\uFFFD\uFFFD.\uFFFD\uFFFD\uFFFD\'\uFFFDo\uFFFD\'\uFFFD', '👩🏻‍💻'],
    ['conexi\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'conexión'],
    ['Creaci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'Creación'],
    ['Contrase\uFFFDa', 'Contraseña'],
    ['\uFFFD\uFFFD\'\uFFFD\uFFFD\'\uFFFD \uFFFD', '👋 ¡'],
    ['Configuraci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'Configuración'],
    ['\uFFFD\uFFFD\"\uFFFD\uFFFD\'\uFFFD', '🎨'],
    ['men\uFFFD\uFFFD\'\uFFFD\'\uFFFD', 'menú'],
    ['n\uFFFD\uFFFD\'\uFFFD\'\uFFFDmero', 'número'],
    ['\uFFFD\uFFFD\'\uFFFD\uFFFD\'\uFFFDATENCI\uFFFD\uFFFD\'\uFFFD\'\uFFFDN! \uFFFD\uFFFD\'\uFFFD\uFFFD\'\uFFFD', '⚠️ ATENCIÓN! ⚠️'],
    ['Est\uFFFD\uFFFD\'\uFFFD\'\uFFFDs', 'Estás'],
    ['informaci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'información'],
    ['acci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'acción'],
    ['\uFFFD', '¿'],
    ['vac\uFFFD\uFFFD\'\uFFFD\'\uFFFDo', 'vacío'],
    ['descripci\uFFFD\uFFFD\'\uFFFD\'\uFFFDn', 'descripción'],
    ['\u270F\uFFFD\'\uFFFD', '✏️'],
    ['\uFFFD\uFFFD\'\uFFFD\uFFFD\'\uFFFD', '🗑️'],
    ['Categor\uFFFDa', 'Categoría'],
    ['D\uFFFD\uFFFD\'\uFFFD\'\uFFFDo', 'Dó'],
    ['D\uFFFD\uFFFD\'\uFFFD\'\uFFFDlares', 'Dólares'],
    ['inv\uFFFD\uFFFD\'\uFFFD\'\uFFFDlido', 'inválido'],
    ['\uFFFDxito', 'éxito'],
    ['\uFFFD\uFFFD\'\uFFFD\'\uFFFDxito', 'éxito'],
    ['Estad\uFFFD\uFFFD\'\uFFFD\'\uFFFDsticas', 'Estadísticas']
];

for (const [bad, good] of replacements) {
    text = text.split(bad).join(good);
}

// Global fixes for lingering characters
text = text.replace(/ǟ\'\'n/g, 'ón');
text = text.replace(/ǟ\'\'/g, 'ó');

fs.writeFileSync('js/app.js', text, 'utf8');
