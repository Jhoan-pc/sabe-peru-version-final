import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- ENTRADAS ---
    {
        name: 'Causa limeña de pollo',
        description: 'Papa amarilla rellena de pollo, vegetales y arvejas.',
        price: 14.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 1,
        tags: ['pollo']
    },
    {
        name: 'Causa acevichada',
        description: 'Causa de pollo coronada con ceviche de pescado fresco.',
        price: 17.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 2,
        tags: ['pescado', 'picante']
    },
    {
        name: 'Causa Sabe a Perú',
        description: 'Causa crujiente con choclo a la huancaina y lomo saltado.',
        price: 17.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 3,
        tags: ['carne']
    },
    {
        name: 'Ceviche de corvina',
        description: 'Corvina fresca, leche de tigre natural, cancha y camote.',
        price: 23.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 4,
        tags: ['pescado', 'picante']
    },
    {
        name: 'Ceviche mixto Sabe a Perú',
        description: 'Finos pescados y mariscos marinados en crema de ajíes.',
        price: 25.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 5,
        tags: ['pescado', 'marisco', 'picante']
    },
    {
        name: 'Tiradito Sabe a Perú',
        description: 'Láminas de pescado en salsa de ají amarillo y maracuyá.',
        price: 23.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 6,
        tags: ['pescado']
    },
    {
        name: 'Anticuchos 3 brochetas',
        description: 'Corazón de res marinado, papas doradas y choclo.',
        price: 12.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 7,
        tags: ['carne']
    },
    {
        name: 'Choritos a la chalaca 10 und.',
        description: 'Mejillones frescos con brunoise de vegetales y limón.',
        price: 12.00,
        category: 'comida',
        subcategory: 'ENTRADAS',
        sort_order: 8,
        tags: ['marisco']
    },

    // --- PLATOS DE FONDO ---
    {
        name: 'Arroz con mariscos',
        description: 'Arroz meloso con mariscos del día y parmesano.',
        price: 22.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 10,
        tags: ['marisco']
    },
    {
        name: 'Chaufa de mariscos',
        description: 'Arroz salteado al wok con mariscos, jengibre y cebollín.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 11,
        tags: ['marisco']
    },
    {
        name: 'Chaufa de carne',
        description: 'Arroz al wok con trozos de res, huevo y brotes de soja.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 12,
        tags: ['carne']
    },
    {
        name: 'Tacu tacu de lomo saltado montado',
        description: 'Arroz y frijoles dorados con lomo saltado y huevo.',
        price: 22.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 13,
        tags: ['carne']
    },
    {
        name: 'Lomo Saltado',
        description: 'Res salteada al wok con cebolla y tomate. Con arroz y papas.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 14,
        tags: ['carne']
    },
    {
        name: 'Tallarines saltados de carne',
        description: 'Pasta con res y vegetales salteados al estilo oriental.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 15,
        tags: ['carne']
    },
    {
        name: 'Spaghetti a la huancaina con lomo',
        description: 'Pasta en salsa de ají amarillo con jugoso lomo saltado.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 16,
        tags: ['carne', 'picante']
    },
    {
        name: 'Jalea mixta',
        description: 'Fritura crocante de pescado y mariscos con yuca frita.',
        price: 25.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 17,
        tags: ['pescado', 'marisco']
    },
    {
        name: 'Chicharrón de pescado',
        description: 'Trozos de pescado frito y crocante con yuca.',
        price: 20.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 18,
        tags: ['pescado']
    },
    {
        name: 'Chicharrón de cerdo',
        description: 'Costillar de cerdo crocante con papas y hierbabuena.',
        price: 18.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 19,
        tags: ['carne']
    },
    {
        name: 'Solomillo a lo macho',
        description: 'Solomillo en salsa cremosa de mariscos y ajíes.',
        price: 25.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 20,
        tags: ['carne', 'marisco']
    },
    {
        name: 'Mostrito',
        description: 'Pollo broaster, papas fritas y arroz chaufa.',
        price: 18.00,
        category: 'comida',
        subcategory: 'PLATOS DE FONDO',
        sort_order: 21,
        tags: ['pollo']
    },

    // --- HAMBURGUESAS ---
    {
        name: 'Hamburguesa XXL',
        description: 'Doble carne, queso cheddar, tocino y huevo.',
        price: 16.00,
        category: 'comida',
        subcategory: 'HAMBURGUESAS',
        sort_order: 30,
        tags: ['carne']
    },
    {
        name: 'Hamburguesa Hawaiana',
        description: 'Carne, queso, piña caramelizada y tocino en pan brioche.',
        price: 14.00,
        category: 'comida',
        subcategory: 'HAMBURGUESAS',
        sort_order: 31,
        tags: ['carne']
    },
    {
        name: 'Hamburguesa Sabe a Perú',
        description: 'Carne al lomo saltado con huevo y crema huancaina.',
        price: 15.00,
        category: 'comida',
        subcategory: 'HAMBURGUESAS',
        sort_order: 32,
        tags: ['carne']
    },

    // --- ESPECIALIDADES Y ENSALADAS ---
    {
        name: 'Alitas acevichadas',
        description: 'Alitas broster en salsa acevichada con cebolla y cilantro.',
        price: 15.00,
        category: 'comida',
        subcategory: 'ESPECIALIDADES',
        sort_order: 40,
        tags: ['pollo', 'picante']
    },
    {
        name: 'Frescura tropical',
        description: 'Pollo a la plancha, piña y vinagreta de maracuyá.',
        price: 11.00,
        category: 'comida',
        subcategory: 'ENSALADAS',
        sort_order: 41,
        tags: ['pollo', 'gluten-free']
    },
    {
        name: 'Ensalada tataki',
        description: 'Tataki de atún, sésamo y vinagreta de vainilla.',
        price: 12.00,
        category: 'comida',
        subcategory: 'ENSALADAS',
        sort_order: 42,
        tags: ['pescado', 'gluten-free']
    },

    // --- POSTRES ---
    { name: 'Choco maracuyá', description: 'Mousse de cacao puro y fruta de la pasión.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 50, tags: [] },
    { name: 'Torta 3 leches', description: 'Bizcocho tierno bañado en crema de tres leches.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 51, tags: [] },
    { name: 'Crema volteada', description: 'Flan casero con caramelo tradicional.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 52, tags: [] },

    // --- BEBIDAS ---

    // --- CERVEZAS Y REFRESCOS ---
    { name: 'Cerveza Cusqueña (Negra/Dorada/Trigo)', description: 'Cerveza premium peruana.', price: 3.00, category: 'bebida', subcategory: 'CERVEZAS Y REFRESCOS', sort_order: 60, tags: [] },
    { name: 'Inca Kola / Pilsen', description: 'Bebidas tradicionales.', price: 3.00, category: 'bebida', subcategory: 'CERVEZAS Y REFRESCOS', sort_order: 61, tags: [] },

    // --- BEBIDAS DE LA CASA (Vaso / Jarra SEPARADOS con precio real) ---
    { name: 'Chicha Morada (Vaso)', description: 'Bebida natural de maíz morado.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS DE LA CASA', sort_order: 62, tags: [] },
    { name: 'Chicha Morada (Jarra)', description: 'Bebida natural de maíz morado para compartir.', price: 12.00, category: 'bebida', subcategory: 'BEBIDAS DE LA CASA', sort_order: 63, tags: [] },
    { name: 'Limonada Frozen (Vaso)', description: 'Refrescante granizado de limón.', price: 4.00, category: 'bebida', subcategory: 'BEBIDAS DE LA CASA', sort_order: 64, tags: [] },
    { name: 'Limonada Frozen (Jarra)', description: 'Refrescante granizado de limón para compartir.', price: 10.00, category: 'bebida', subcategory: 'BEBIDAS DE LA CASA', sort_order: 65, tags: [] },

    // --- BATIDOS ---
    { name: 'Batido de Fruta (Vaso)', description: 'Piña, maracuyá, mango, fresa, mora, guanábana, lulo...', price: 5.00, category: 'bebida', subcategory: 'BATIDOS', sort_order: 70, tags: [] },
    { name: 'Batido de Fruta (Jarra)', description: 'Jarra de batido natural preparado al momento.', price: 11.00, category: 'bebida', subcategory: 'BATIDOS', sort_order: 71, tags: [] },

    // --- VINOS ---
    { name: 'Vinos Selección', description: 'Rioja, Ribera, Albariño, Godello...', price: 16.00, category: 'bebida', subcategory: 'VINO', sort_order: 75, tags: [] },

    // --- COCTELES ---
    { name: 'Pisco sour', description: 'Nuestra receta estrella preparada al momento.', price: 8.00, category: 'coctel', subcategory: 'MIXOLOGÍA', sort_order: 80, tags: [] },
    { name: 'Sangría de la casa', description: 'Perfecta para compartir.', price: 15.00, category: 'coctel', subcategory: 'MIXOLOGÍA', sort_order: 81, tags: [] }
]

async function seed() {
    console.log('--- Restaurando Carta a MODO INDIVIDUAL ---')

    // First, check if we can delete
    const deleteResponse = await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (deleteResponse.error) {
        console.error('Error deleting old items:', deleteResponse.error)
    } else {
        console.log(`Deleted ${deleteResponse.count ?? 'unknown'} old items.`)
    }

    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error inserting:', error)
    else console.log('¡Carta actualizada (Vaso/Jarra separados con precio real)!')
}

seed()
