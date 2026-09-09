const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

text = text.replace(
    /document\.querySelectorAll\('#clients-ul li'\)\.forEach\(li => li\.classList\.remove\('active'\)\);\s+liElement\.classList\.add\('active'\);\s+\}\s*catch \(error\)/g,
    \document.querySelectorAll('#clients-ul li').forEach(li => li.classList.remove('active'));
        if (liElement) liElement.classList.add('active');
        
        loadProducts(id);
        if (typeof cargarPagos === "function") {
            cargarPagos(id);
        }
    } catch (error)\
);

fs.writeFileSync('js/app.js', text, 'utf8');
