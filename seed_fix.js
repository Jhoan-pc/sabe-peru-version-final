import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- ESTRELLA: ENTRADAS ---
    { sort_order: 1, subcategory: 'ENTRADAS', name: 'Ceviche de Corvina', description: 'Finos cortes de corvina frescos del día, marinados en jugo de limón y leche de tigre. Acompañado de choclo y camote glaseado.', price: 23.00, category: 'comida', tags: ['pescado', 'picante', 'gluten-free'] },
    { sort_order: 2, subcategory: 'ENTRADAS', name: 'Ceviche Mixto Sabe a Perú', description: 'Cortes de pescado y mixtura de mariscos marinados en leche de tigre con salsa de rocoto y ají amarillo.', price: 25.00, category: 'comida', tags: ['pescado', 'marisco', 'picante'] },
    { sort_order: 3, subcategory: 'ENTRADAS', name: 'Causa Limeña de Pollo', description: 'Capa suave de papa amarilla rellena de pollo deshilachado, zanahoria y cilantro. Coronada con aceituna y huevo.', price: 14.00, category: 'comida', tags: ['pollo'] },
    { sort_order: 4, subcategory: 'ENTRADAS', name: 'Causa Acevichada', description: 'Papa amarilla rellena de aguacate, coronada con cortes de pescado marinado en leche de tigre.', price: 17.00, category: 'comida', tags: ['pescado'] },
    { sort_order: 5, subcategory: 'ENTRADAS', name: 'Causa Sabe a Perú', description: 'Croquetas crujientes de causa coronadas con choclos a la huancaína y lomo saltado jugoso.', price: 17.00, category: 'comida', tags: ['carne'] },
    { sort_order: 6, subcategory: 'ENTRADAS', name: 'Tiradito Sabe a Perú', description: 'Finas tiras de pescado en salsa suave de ají amarillo y maracuyá, con granos de choclo y camote.', price: 23.00, category: 'comida', tags: ['pescado', 'picante'] },
    { sort_order: 7, subcategory: 'ENTRADAS', name: 'Anticuchos (3 brochetas)', description: 'Brochetas de corazón de res marinadas en salsa anticuchera, servidas con papas a la huancaína y choclo.', price: 12.00, category: 'comida', tags: ['carne', 'picante'] },
    { sort_order: 8, subcategory: 'ENTRADAS', name: 'Choritos a la Chalaca', description: '10 unidades de mejillones frescos con mezcla de cebolla, tomate, choclo y ají en jugo de limón.', price: 12.00, category: 'comida', tags: ['marisco'] },

    // --- ESTRELLA: FONDOS ---
    { sort_order: 9, subcategory: 'FONDOS', name: 'Lomo Saltado', description: 'Jugosos trozos de carne de res salteados al wok con cebolla, tomate y un toque de la casa. Servido con arroz y papas.', price: 20.00, category: 'comida', tags: ['carne'] },
    { sort_order: 10, subcategory: 'FONDOS', name: 'Solomillo a lo Macho', description: 'Jugoso solomillo de res con salsa a lo macho elaborada con mariscos frescos y ajíes peruanos.', price: 25.00, category: 'comida', tags: ['carne', 'marisco', 'picante'] },
    { sort_order: 11, subcategory: 'FONDOS', name: 'Arroz con Mariscos', description: 'Arroz con mariscos frescos, ajíes peruanos y salsa madre de mariscos. Servido con salsa criolla y parmesano.', price: 22.00, category: 'comida', tags: ['marisco'] },
    { sort_order: 12, subcategory: 'FONDOS', name: 'Chaufa de Mariscos', description: 'Arroz salteado al wok con mariscos frescos, cebollín, huevo y toques de salsa de soja y aceite de sésamo.', price: 20.00, category: 'comida', tags: ['marisco'] },
    { sort_order: 13, subcategory: 'FONDOS', name: 'Chaufa de Carne', description: 'Arroz salteado al wok con trozos de carne, cebollín, huevo y jengibre.', price: 20.00, category: 'comida', tags: ['carne'] },
    { sort_order: 14, subcategory: 'FONDOS', name: 'Tacu Tacu de Lomo Saltado', description: 'Combinación crujiente de arroz y frijoles con el sabor intenso de nuestro lomo saltado y huevo frito.', price: 22.00, category: 'comida', tags: ['carne'] },
    { sort_order: 15, subcategory: 'FONDOS', name: 'Tallarines Saltados de Carne', description: 'Tallarines salteados con carne de vacuno, cebolla, tomate, pimiento y salsa de la casa.', price: 20.00, category: 'comida', tags: ['carne'] },
    { sort_order: 16, subcategory: 'FONDOS', name: 'Spaghetti a la Huancaína con Lomo', description: 'Espaguetis bañados en salsa a lo huancaína con trozos de carne de res tierna y salsa de soja.', price: 20.00, category: 'comida', tags: ['carne', 'picante'] },
    { sort_order: 17, subcategory: 'FONDOS', name: 'Jalea Mixta', description: 'Mariscos y pescado apanados y fritos con yuca frita y salsa criolla.', price: 25.00, category: 'comida', tags: ['pescado', 'marisco'] },
    { sort_order: 18, subcategory: 'FONDOS', name: 'Chicharrón de Pescado', description: 'Trozos de pescado fresco apanados y fritos. Acompañados de yucas fritas y salsa criolla.', price: 20.00, category: 'comida', tags: ['pescado'] },
    { sort_order: 19, subcategory: 'FONDOS', name: 'Chicharrón de Cerdo', description: 'Cortes de cerdo cocinados hasta lograr una textura crujiente. Con patatas doradas y salsa criolla.', price: 18.00, category: 'comida', tags: ['carne'] },

    // --- ESTRELLA: HAMBURGUESAS ---
    { sort_order: 20, subcategory: 'HAMBURGUESAS', name: 'Hamburguesa Sabe a Perú', description: 'Pan brioche, papas fritas, carne, queso gouda, cebolla, tomate y salsa de lomo saltado con huancaína.', price: 15.00, category: 'comida', tags: ['carne'] },
    { sort_order: 21, subcategory: 'HAMBURGUESAS', name: 'Hamburguesa XXL', description: 'Doble carne, queso gouda, cheddar, tocino y huevo. Acompañada de patatas y mayo-ajo.', price: 16.00, category: 'comida', tags: ['carne'] },
    { sort_order: 22, subcategory: 'HAMBURGUESAS', name: 'Hamburguesa Hawaiana', description: 'Carne, queso, tocino, piña caramelizada, patatas fritas y mayo-ajo.', price: 14.00, category: 'comida', tags: ['carne'] },

    // --- ESTRELLA: ENSALADAS ---
    { sort_order: 23, subcategory: 'ENSALADAS', name: 'Ensalada Tataki', description: 'Tataki de atún con sésamo sobre lechuga, cebolla, tomate, huevo y palta con vinagreta exótica.', price: 12.00, category: 'comida', tags: ['pescado'] },

    // --- ESTRELLA: POSTRES ---
    { sort_order: 24, subcategory: 'POSTRES', name: 'Sinfonía Choco-Maracuyá', description: 'El equilibrio perfecto entre la intensidad del cacao y la acidez exótica de la fruta de la pasión.', price: 6.00, category: 'comida' },
    { sort_order: 25, subcategory: 'POSTRES', name: 'Tarta de Queso', description: 'Cremosa y suave, acompañada de coulis de frutos rojos.', price: 6.00, category: 'comida' },
    { sort_order: 26, subcategory: 'POSTRES', name: 'Tarta de Tres Leches', description: 'Bizcocho húmedo bañado en tres tipos de leche, coronado con merengue y canela.', price: 6.00, category: 'comida' },

    // --- BEBIDAS (Ordenadas Lógicamente) ---
    { sort_order: 27, subcategory: 'BEBIDAS', name: 'Inca Kola (La Nacional)', description: 'La bebida nacional del Perú de sabor único.', price: 3.00, category: 'bebida' },
    { sort_order: 28, subcategory: 'BEBIDAS', name: 'Chicha Morada (Vaso)', description: 'Infusión natural de maíz morado, piña y especias.', price: 5.00, category: 'bebida' },
    { sort_order: 29, subcategory: 'BEBIDAS', name: 'Chicha Morada (Jarra)', description: 'Nuestra chicha artesanal para compartir.', price: 12.00, category: 'bebida' },
    { sort_order: 30, subcategory: 'BEBIDAS', name: 'Batido de Fruta', description: 'Pulpa de fruta natural (Maracuyá, Mango, Lulo) hecha al momento.', price: 5.00, category: 'bebida' },
    { sort_order: 31, subcategory: 'BEBIDAS', name: 'Cerveza Cusqueña', description: 'Importada: Negra, Dorada o de Trigo.', price: 3.00, category: 'bebida' },
    { sort_order: 32, subcategory: 'BEBIDAS', name: 'Vino Ramón Bilbao (Rioja)', description: 'Crianza de la casa.', price: 19.00, category: 'bebida' },
    { sort_order: 33, subcategory: 'BEBIDAS', name: 'Vino Godello', description: 'Blanco selecto D.O.', price: 18.00, category: 'bebida' },

    // --- CÓCTELES ---
    { sort_order: 34, subcategory: 'CÓCTELES', name: 'Pisco Sour Clásico', description: 'Cóctel emblemático: Pisco, lima, clara de huevo y gotas de amargo de angostura.', price: 8.00, category: 'coctel' },
    { sort_order: 35, subcategory: 'CÓCTELES', name: 'Chilcano de Pisco', description: 'Refrescante: Pisco, Ginger Ale, lima y hielo.', price: 9.00, category: 'coctel' },
    { sort_order: 36, subcategory: 'CÓCTELES', name: 'Sangría Especial (Jarra)', description: 'Nuestra receta con vino tinto y frutas maceradas.', price: 15.00, category: 'coctel' }
]

async function seed() {
    console.log('--- Corrigiendo Carta (Fiel a la carta física) ---')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error:', error)
    else console.log('¡Carta corregida y sincronizada!')
}

seed()
