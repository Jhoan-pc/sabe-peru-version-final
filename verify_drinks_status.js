import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDrinks() {
    console.log('--- Verificando Bebidas en Base de Datos ---');
    const { data, error } = await supabase
        .from('menu_items')
        .select('name, price, subcategory')
        .in('category', ['bebida', 'coctel'])
        .order('subcategory', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Items encontrados:', data.length);
    data.forEach(item => {
        console.log(`[${item.subcategory}] ${item.name} - ${item.price}€`);
    });
}

checkDrinks();
