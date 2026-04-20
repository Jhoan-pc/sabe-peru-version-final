import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('--- Verificando si los nuevos platos (con iconos) se cargaron ---');
    const { data, error } = await supabase
        .from('menu_items')
        .select('name, tags')
        .limit(3);

    if (error) {
        console.error('Error consultando:', error);
    } else {
        if (data.length > 0) {
            console.log('Primeros 3 platos encontrados:');
            data.forEach(item => {
                console.log(`- ${item.name}: tags=[${item.tags ? item.tags.join(', ') : 'VACÍO'}]`);
            });

            const hasTags = data.some(item => item.tags && item.tags.length > 0);
            if (hasTags) {
                console.log('\n✅ ÉXITO: Los nuevos datos con etiquetas (iconos) YA ESTÁN en la base de datos.');
            } else {
                console.log('\n❌ ERROR: Los datos siguen siendo los antiguos (sin etiquetas). La actualización falló silenciosamente.');
            }
        } else {
            console.log('La tabla está vacía.');
        }
    }
}

check();
