import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- COMIDA: ENTRADAS ---
    { name: 'Ceviche de Corvina Salvaje', description: 'Finos cortes de corvina fresca del día, curados en vibrante leche de tigre y cítricos. Acompañado de camote glaseado y choclo peruano.', price: 23.00, category: 'comida' },
    { name: 'Causa Acevichada de Autor', description: 'Terciopelo de papa amarilla infusionada con ají, coronada con láminas de pescado marinado, aguacate cremoso y crujiente de cancha.', price: 17.00, category: 'comida' },
    { name: 'Anticuchos Tradicionales', description: 'Corazón de res seleccionado marinado en salsa anticuchera ancestral. Servido con papas a la huancaína y choclo tierno.', price: 12.00, category: 'comida' },
    { name: 'Causa Limeña de Pollo', description: 'Capa suave de papa amarilla rellena de pollo deshilachado, zanahoria y cilantro, coronada con aceitunas y huevo duro.', price: 14.00, category: 'comida' },
    { name: 'Tiradito Sabe a Perú', description: 'Finas tiras de pescado marinadas en jugo de limón, sobre una salsa suave de ají amarillo y maracuyá.', price: 23.00, category: 'comida' },
    { name: 'Choritos a la Chalaca', description: '10 mejillones frescos al natural, bañados con una colorida mezcla de cebolla, tomate, choclo y leche de tigre.', price: 12.00, category: 'comida' },

    // --- COMIDA: FONDOS ---
    { name: 'Lomo Saltado al Wok', description: 'Jugosos cortes de solomillo flambeados con cebolla morada y tomates. Servido con arroz nítido y papas artesanales.', price: 20.00, category: 'comida' },
    { name: 'Solomillo a lo Macho', description: 'Medallón de solomillo bañado en suntuosa salsa a lo macho con mariscos frescos y ajíes peruanos.', price: 25.00, category: 'comida' },
    { name: 'Arroz con Mariscos del Cantábrico', description: 'Arroz meloso impregnado en esencia de mariscos, ajíes y vino blanco. Coronado con salsa criolla y parmesano.', price: 22.00, category: 'comida' },
    { name: 'Chaufa de Mariscos', description: 'Arroz salteado al wok con mariscos frescos, cebollín, huevo y toques de salsa de soja.', price: 20.00, category: 'comida' },
    { name: 'Tacu Tacu de Lomo Saltado', description: 'Capa crujiente de arroz y frijoles con lomo saltado flameado y huevo frito montado.', price: 22.00, category: 'comida' },
    { name: 'Jalea Mixta', description: 'Mariscos y pescado apanados y fritos, acompañados de yuca frita y salsa criolla refrescante.', price: 25.00, category: 'comida' },

    // --- COMIDA: HAMBURGUESAS ---
    { name: 'Nuestra Firma Sabe a Perú', description: 'Carne seleccionada en pan brioche con salsa de lomo saltado, huevo, queso Gouda y crema Huancaína.', price: 15.00, category: 'comida' },
    { name: 'Hamburguesa XXL', description: 'Doble carne con queso Gouda y Cheddar, tocino y huevo frito. Acompañada de patatas fritas y mayo-ajo.', price: 16.00, category: 'comida' },

    // --- BEBIDAS ---
    { name: 'Inca Kola', description: 'La bebida nacional del Perú. El sabor dorado que define nuestra cultura.', price: 3.00, category: 'bebida' },
    { name: 'Chicha Morada Artesanal (Jarra)', description: 'Infusión ancestral de maíz morado, piña y especias cálidas macerada lentamente.', price: 12.00, category: 'bebida' },
    { name: 'Limonada Frozen (Jarra)', description: 'Refrescante granizado de limón natural, ideal para limpiar el paladar.', price: 10.00, category: 'bebida' },
    { name: 'Cusqueña Negra', description: 'Cerveza premium malta oscura con cuerpo y sabor intenso.', price: 3.00, category: 'bebida' },
    { name: 'Batido de Guanábana', description: 'Batido natural de pura pulpa de guanábana orgánica.', price: 5.00, category: 'bebida' },
    { name: 'Vino Ramón Bilbao', description: 'Rioja Crianza elegante, ideal para carnes y platos intensos.', price: 19.00, category: 'bebida' },
    { name: 'Vino Godello Selecto', description: 'Blanco con carácter y notas frutales para maridar con pescados.', price: 18.00, category: 'bebida' },

    // --- CÓCTELES ---
    { name: 'Pisco Sour Clásico', description: 'Orgullo peruano. Pisco acholado, lima, clara de huevo y jarabe de goma con espuma de seda.', price: 8.00, category: 'coctel' },
    { name: 'Sangría de la Casa', description: 'Nuestra receta secreta con vino tinto seleccionado y frutas maceradas.', price: 15.00, category: 'coctel' }
]

async function seed() {
    console.log('--- Iniciando carga de carta digital ---')

    // Limpiar previa si existe (opcional, para evitar duplicados en pruebas)
    // await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { data, error } = await supabase
        .from('menu_items')
        .insert(menuItems)

    if (error) {
        console.error('Error al cargar:', error)
    } else {
        console.log('¡Éxito! Carta cargada correctamente.')
    }
}

seed()
