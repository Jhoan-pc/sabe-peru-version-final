const fs = require('fs');

try {
    const content = fs.readFileSync('seed_menu_final_frozen.js', 'utf-8');
    const arrayMatch = content.match(/const menuItems = (\[[\s\S]*?\])\s*async function/);
    
    if(arrayMatch) { 
        const evalled = eval(arrayMatch[1]); 
        fs.writeFileSync('backup_menu_items.json', JSON.stringify(evalled, null, 2)); 
        console.log('✅ Backup finalizado con éxito (generado desde semilla local). total items: ' + evalled.length); 
    } else {
        console.error('No se pudo encontrar el array menuItems');
    }
} catch (e) {
    console.error(e);
}
