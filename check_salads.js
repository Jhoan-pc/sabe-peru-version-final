import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('--- Verificando Ensaladas y Tags ---');
    const { data, error } = await supabase
        .from('menu_items')
        .select('name, tags, category')
        .eq('subcategory', 'ENSALADAS');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Ensaladas encontradas: ${data.length}`);
        data.forEach(item => {
            console.log(`- ${item.name}: tags=[${JSON.stringify(item.tags)}]`);
        });
    }
}

check();
