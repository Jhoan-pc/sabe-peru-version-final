import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- COMIDA ---
    { name: 'Ceviche de Corvina Salvaje', description: 'Finos cortes de corvina fresca del día, curados en vibrante leche de tigre y cítricos. Acompañado de camote glaseado y choclo peruano.', price: 23.00, category: 'comida' },
    { name: 'Causa Acevichada de Autor', description: 'Terciopelo de papa amarilla infusionada con ají, coronada con láminas de pescado marinado, aguacate cremoso y crujiente de cancha.', price: 17.00, category: 'comida' },
    { name: 'Anticuchos Tradicionales', description: 'Corazón de res seleccionado marinado en salsa anticuchera ancestral. Servido con papas a la huancaína y choclo tierno.', price: 12.00, category: 'comida' },
    { name: 'Lomo Saltado al Wok', description: 'Jugosos cortes de solomillo flambeados con cebolla morada y tomates. Servido con arroz nítido y papas artesanales.', price: 20.00, category: 'comida' },
    { name: 'Solomillo a lo Macho', description: 'Medallón de solomillo bañado en suntuosa salsa a lo macho con mariscos frescos del Cantábrico.', price: 25.00, category: 'comida' },
    { name: 'Arroz con Mariscos Meloso', description: 'Arroz impregnado en esencia de frutos del mar, ajíes y vino blanco. Coronado con salsa criolla y parmesano.', price: 22.00, category: 'comida' },
    { name: 'Tacu Tacu Montado', description: 'Capa crujiente de arroz y frijoles con lomo saltado flameado y huevo frito. El alma de la taberna peruana.', price: 22.00, category: 'comida' },
    { name: 'Sinfonía Choco-Maracuyá', description: 'El equilibrio perfecto entre la intensidad del cacao y la acidez exótica de la fruta de la pasión.', price: 6.00, category: 'comida' },

    // --- BEBIDAS ---
    { name: 'Inca Kola (El Oro del Perú)', description: 'El sabor único que define una cultura. Tradición en cada gota.', price: 3.00, category: 'bebida' },
    { name: 'Chicha Morada de la Casa', description: 'Infusión ancestral macerada con maíz morado, piña y especias. Receta de la familia.', price: 5.00, category: 'bebida' },
    { name: 'Cusqueña Malta', description: 'Cerveza premium de cuerpo intenso y sabor tostado.', price: 3.00, category: 'bebida' },
    { name: 'Vino Godello Selecto', description: 'Blanco con carácter y notas frutales, perfecto para maridar con nuestros pescados.', price: 18.00, category: 'bebida' },
    { name: 'Ramón Bilbao (Rioja)', description: 'Un crianza elegante para equilibrar la potencia de nuestras carnes.', price: 19.00, category: 'bebida' },

    // --- CÓCTELES ---
    { name: 'Pisco Sour Sabe a Perú', description: 'Pisco acholado, lima fresca, clara de huevo y el toque exacto de amargo de angostura.', price: 8.00, category: 'coctel' },
    { name: 'Chilcano Tradicional', description: 'Refrescante mezcla de Pisco, Ginger Ale, gotas de amargo y el frescor de la lima.', price: 9.00, category: 'coctel' },
    { name: 'Sangría Especial', description: 'Maceración de frutas de temporada en vino tinto seleccionado y nuestro toque secreto.', price: 15.00, category: 'coctel' }
]

async function seed() {
    console.log('--- Limpiando y Actualizando Carta ---')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error:', error)
    else console.log('¡Carta mejorada y cargada con éxito!')
}

seed()
