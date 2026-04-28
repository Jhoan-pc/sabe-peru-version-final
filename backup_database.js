import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://xdslypbjmenthwyrarui.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY";

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Faltan las variables de entorno de Supabase en el archivo .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function performBackup() {
    console.log('🚀 Iniciando extracción de datos de Supabase para respaldo...');

    try {
        // 1. Respaldar Menú
        console.log('Descargando tabla: menu_items...');
        const { data: menuData, error: menuError } = await supabase.from('menu_items').select('*');
        
        if (menuError) throw menuError;
        
        fs.writeFileSync('backup_menu_items.json', JSON.stringify(menuData, null, 2));
        console.log(`✅ Guardado con éxito: backup_menu_items.json (${menuData.length} platos/bebidas extráidos)`);

        // 2. Respaldar Contenido del Sitio
        console.log('\nDescargando tabla: site_content...');
        const { data: contentData, error: contentError } = await supabase.from('site_content').select('*');
        
        if (contentError) throw contentError;

        fs.writeFileSync('backup_site_content.json', JSON.stringify(contentData, null, 2));
        console.log(`✅ Guardado con éxito: backup_site_content.json (${contentData.length} configuraciones extraídas)`);

        // 3. (Opcional) Respaldar Reservas
        console.log('\nComprobando tabla de reservas...');
        const { data: reservasData, error: reservasError } = await supabase.from('reservations').select('*');
        if (!reservasError && reservasData) {
            fs.writeFileSync('backup_reservations.json', JSON.stringify(reservasData, null, 2));
            console.log(`✅ Guardado con éxito: backup_reservations.json (${reservasData.length} reservas extraídas)`);
        } else {
             console.log('Info: No se pudo verificar la tabla reservations o está en otra configuración (esto es normal si las reservas van directo a email/whatsapp).');
        }

        console.log('\n🎉 ¡RESPALDO COMPLETADO 100%! Todos los datos están seguros de forma local en tu ordenador.');
        
    } catch (error) {
        console.error('❌ Hubo un error al hacer la copia de seguridad:', error);
    }
}

performBackup();
