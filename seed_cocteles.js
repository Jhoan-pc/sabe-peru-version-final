import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- LISTA DE CÓCTELES ---
// (Esperando instrucciones para rellenar)
const cocteles = [
    { name: 'Bianco Spritz', description: 'Martini Bianco, prosecco y soda.', price: 5.50, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 1, tags: [] },
    { name: 'St. Germain Spritz', description: 'St. Germain, prosecco y soda.', price: 6.50, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 2, tags: [] },
    { name: 'Bicicleta', description: 'Martini Bitter, prosecco y soda.', price: 5.50, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 3, tags: [] },
    { name: 'Cholo Fresco', description: 'Pisco Moscatel, Martini Bitter, Martini Rosso, naranja y lima.', price: 7.50, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 4, tags: [] },
    { name: 'Espresso Martini', description: 'Grey Goose, licor de café, azúcar y café.', price: 7.50, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 5, tags: [] },
    { name: 'Sugar Man', description: 'Cazadores tequila, zumo de limón, sirope de jengibre y ginger beer.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 6, tags: [] },
    { name: 'Sabe a Paloma', description: 'Ilegal Mezcal, Cazadores tequila, cordial de pomelo y zumo de pomelo.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 7, tags: [] },
    { name: 'Sabe a Perú', description: 'Cazadores tequila, azúcar, guanábana y chicha morada.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 8, tags: [] },
    { name: 'Mojito', description: 'Bacardi ron, azúcar, lima, menta y soda.', price: 7.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 9, tags: [] },
    { name: 'Pisco Sour', description: 'Pisco Quebranta, limón, azúcar, clara y Angostura.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 10, tags: [] },
    { name: 'Pisco Maracuyá', description: 'Pisco Quebranta, limón, maracuyá, azúcar, clara y arena de maracuyá.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 11, tags: [] },
    { name: 'Chabelita', description: 'Pisco Quebranta, Cazadores tequila, licor naranja, limón y cordial.', price: 8.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 12, tags: [] },
    { name: 'Pisco Punch', description: 'Pisco Mosto Verde, sirope de piña, zumo de lima, menta y frutos rojos.', price: 7.00, category: 'coctel', subcategory: 'COCTELERÍA', sort_order: 13, tags: [] }
]

async function seedCocteles() {
    console.log('--- Cargando Carta de Cócteles ---')

    // Primero borramos SOLO los cócteles anteriores para no tocar la comida/bebida ya congelada
    const { error: deleteError } = await supabase
        .from('menu_items')
        .delete()
        .eq('category', 'coctel')

    if (deleteError) {
        console.error('Error al limpiar cócteles anteriores:', deleteError)
        return
    }

    if (cocteles.length > 0) {
        const { error } = await supabase.from('menu_items').insert(cocteles)
        if (error) console.error('Error al insertar cócteles:', error)
        else console.log(`¡Se han añadido ${cocteles.length} cócteles a la carta!`)
    } else {
        console.log('No hay cócteles para insertar todavía. Esperando lista...')
    }
}

seedCocteles()
