import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- ENTRADAS ---
    { name: 'Causa limeña de pollo', description: 'Capa suave de papa amarilla amasada, rellena de pollo deshilachado, mezclado con mayonesa, zanahoria, alverjas y cilantro, coronada con aceitunas negras, huevo duro.', price: 14.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 1 },
    { name: 'Causa acevichada', description: 'Capa suave de papa amarilla amasada, rellena de aguacate, y coronada de finos cortes de pescado marinado en jugo de limon y leche de tigre.', price: 17.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 2 },
    { name: 'Causa Sabe a Perú', description: 'Croquetas crujientes de causa, coronadas con choclos a la huancaina y un lomo saltado jugoso (trozos de carne, cebolla, tomate).', price: 17.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 3 },
    { name: 'Ceviche de corvina', description: 'Finos cortes de corvina frescos del día, marinados en jugo de limón y leche de tigre, con cancha crujiente, choclo y camote glaseado.', price: 23.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 4 },
    { name: 'Ceviche mixto Sabe a Perú', description: 'Pescado y mixtura de mariscos marinados en jugo de limón y leche de tigre, coronada con una salsa de rocoto y ají amarillo.', price: 25.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 5 },
    { name: 'Tiradito Sabe a Perú', description: 'Finas tiras de pescado marinadas sobre una salsa suave de aji amarillo y maracuyá, acompañadas de granos de choclo y camote glaseado.', price: 23.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 6 },
    { name: 'Anticuchos 3 brochetas', description: 'Brochetas de corazón de res marinadas en salsa anticuchera, acompañadas de papas a la huancaina y granos de choclo.', price: 12.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 7 },
    { name: 'Choritos a la chalaca 10 und.', description: 'Mejillones frescos al natural, bañados con una colorida mezcla de cebolla, cilantro, tomate, choclo y ají.', price: 12.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 8 },

    // --- PLATOS DE FONDO ---
    { name: 'Arroz con mariscos', description: 'Mezcla de arroz con granos de choclos, mariscos frescos, salsa madre y vino blanco, coronado con queso parmesano.', price: 22.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 10 },
    { name: 'Chaufa de mariscos', description: 'Arroz salteado al wok con mariscos frescos, cebollín, huevo, jengibre y aceite de sésamo.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 11 },
    { name: 'Chaufa de carne', description: 'Arroz salteado al wok con trozos de carne, cebollín, huevo, jengibre y brotes de soja.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 12 },
    { name: 'Tacu tacu de lomo saltado montado', description: 'Combinación crujiente de arroz y frijoles con lomo saltado jugoso montado con un huevo frito.', price: 22.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 13 },
    { name: 'Lomo Saltado', description: 'Jugosos trozos de carne de res salteados al wok con cebolla morada, tomate y salsa de la casa. Con arroz y patatas.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 14 },
    { name: 'Tallarines saltados de carne', description: 'Tallarines salteados con carne de vacuno, verduras, brotes de soja, sésamo y una salsa de la casa.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 15 },
    { name: 'Spaghetti a la huancaina con lomo', description: 'Espaguetis bañados con salsa a la huancaina (ají amarillo, queso fresco y leche) coronados con lomo saltado.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 16 },
    { name: 'Jalea mixta', description: 'Mariscos y pescado apanados y fritos, acompañados con yuca frita y salsa criolla.', price: 25.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 17 },
    { name: 'Chicharrón de pescado', description: 'Trozos de pescados frescos fritos hasta alcanzar una textura crujiente, con yucas fritas y salsa criolla.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 18 },
    { name: 'Chicharrón de cerdo', description: 'Cortes de cerdo cocinados lentamente hasta lograr una textura crocante, con patatas doradas y salsa criolla.', price: 18.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 19 },
    { name: 'Solomillo a lo macho', description: 'Jugoso solomillo cubierto con salsa a lo macho elaborada con mariscos frescos y ajíes peruanos.', price: 25.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 20 },
    { name: 'Mostrito', description: 'Pollo broaster acompañado con patatas fritas y un delicioso arroz chaufa peruanos.', price: 18.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 21 },

    // --- HAMBURGUESAS ---
    { name: 'XXL', description: 'Pan Brioche, doble carne con queso gouda y queso cheddar, tocino y huevo con patatas fritas.', price: 16.00, category: 'comida', subcategory: 'HAMBURGUESAS', sort_order: 30 },
    { name: 'Hawaiana', description: 'Pan brioche, lechuga, carne, queso, tocino, piña caramelizada acompañados de patatas fritas y mayo ajo.', price: 14.00, category: 'comida', subcategory: 'HAMBURGUESAS', sort_order: 31 },
    { name: 'Sabe a Perú', description: 'Carne, queso gouda, cebolla y tomate salteados con salsa de lomo y huevo, salsa huancaina.', price: 15.00, category: 'comida', subcategory: 'HAMBURGUESAS', sort_order: 32 },

    // --- ESPECIALIDADES Y ENSALADAS ---
    { name: 'Alitas acevichadas', description: 'Alitas broster bañadas en una salsa acevichada con cebolla y cilantro, con patatas fritas.', price: 15.00, category: 'comida', subcategory: 'ESPECIALIDADES', sort_order: 40 },
    { name: 'Frescura tropical', description: 'Mezcla de lechuga, tomate, pepinillo, piña y pollo a la plancha con vinagreta artesanal de maracuyá.', price: 11.00, category: 'comida', subcategory: 'ENSALADAS', sort_order: 41 },
    { name: 'Ensalada tataki', description: 'Tataki de atún con sésamo, lechuga, palta y vinagreta exótica de aceite balsamico y sésamo.', price: 12.00, category: 'comida', subcategory: 'ENSALADAS', sort_order: 42 },

    // --- POSTRES ---
    { name: 'Choco maracuyá', description: 'Intensidad de chocolate con el toque cítrico del maracuyá.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 50 },
    { name: 'Torta 3 leches', description: 'Bizcocho humedecido en tres tipos de leche tradicionales.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 51 },
    { name: 'Crema volteada', description: 'Textura suave y caramelo artesanal.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 52 },
    { name: 'Arroz con leche', description: 'El dulce clásico de nuestra tradición.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 53 },
    { name: 'Brownie con helado', description: 'Chocolate intenso templado con helado de vainilla.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 54 },
    { name: 'Helado de la casa', description: 'Nuestros sabores más refrescantes.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 55 },

    // --- BEBIDAS ---
    { name: 'Cerveza Cusqueña (Negra, Dorada o Trigo)', description: 'Cerveza premium peruana.', price: 3.00, category: 'bebida', subcategory: 'CERVEZAS', sort_order: 60 },
    { name: 'Cerveza Pilsen', description: 'Tradición cervecera de toda la vida.', price: 3.00, category: 'bebida', subcategory: 'CERVEZAS', sort_order: 61 },
    { name: 'Inca kola', description: 'El sabor dorado que define al Perú.', price: 3.00, category: 'bebida', subcategory: 'REFRESCOS', sort_order: 62 },
    { name: 'Chicha morada (Vaso)', description: 'Infusión artesanal de maíz morado y especias.', price: 5.00, category: 'bebida', subcategory: 'ARTESANALES', sort_order: 63 },
    { name: 'Chicha morada (Jarra)', description: 'Infusión artesanal de maíz morado para compartir.', price: 12.00, category: 'bebida', subcategory: 'ARTESANALES', sort_order: 64 },
    { name: 'Limonada frozen (Vaso)', description: 'Granizado de limón natural refrescante.', price: 5.00, category: 'bebida', subcategory: 'REFRESCOS', sort_order: 65 },
    { name: 'Limonada frozen (Jarra)', description: 'Granizado de limón natural para compartir.', price: 12.00, category: 'bebida', subcategory: 'REFRESCOS', sort_order: 66 },

    // --- BATIDOS ---
    { name: 'Batido Natural (Vaso)', description: 'Piña, Maracuyá, Mango, Fresa, Mora, Guanábana, Papaya, Lulo...', price: 5.00, category: 'bebida', subcategory: 'BATIDOS', sort_order: 70 },
    { name: 'Batido Natural (Jarra)', description: 'Jarra completa de fruta fresca preparada al momento.', price: 11.00, category: 'bebida', subcategory: 'BATIDOS', sort_order: 71 },

    // --- VINOS ---
    { name: 'Ramon Bilbao', description: 'Rioja Crianza clásico.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 80 },
    { name: 'Azpilicueta', description: 'Equilibrio y elegancia de Rioja.', price: 19.50, category: 'bebida', subcategory: 'VINOS', sort_order: 81 },
    { name: 'Izadi', description: 'Intensidad y modernidad.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 82 },
    { name: 'Beronia', description: 'Aromático y estructurado.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 83 },
    { name: 'Rueda', description: 'Verdejo fresco y vibrante.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 84 },
    { name: 'Ribera', description: 'Cuerpo y esencia castellana.', price: 18.00, category: 'bebida', subcategory: 'VINOS', sort_order: 85 },
    { name: 'Valviejo verdejo', description: 'Vino de la casa seleccionado.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 86 },
    { name: 'Albariño', description: 'El blanco gallego por excelencia.', price: 16.00, category: 'bebida', subcategory: 'VINOS', sort_order: 87 },
    { name: 'Godello', description: 'Elegancia y notas frutales.', price: 18.00, category: 'bebida', subcategory: 'VINOS', sort_order: 88 },
    { name: 'Vino rosado', description: 'Refrescante y equilibrado.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 89 },
    { name: 'Moscato', description: 'Dulce toque italiano.', price: 16.00, category: 'bebida', subcategory: 'VINOS', sort_order: 90 },

    // --- VINOS ROSADOS ---
    { name: 'Prieto Picudo', description: 'Especialidad rosada con frescura cítrica.', price: 19.00, category: 'bebida', subcategory: 'VINOS ROSADOS', sort_order: 100 },
    { name: 'Navarra', description: 'El rosado clásico del norte.', price: 19.00, category: 'bebida', subcategory: 'VINOS ROSADOS', sort_order: 101 },

    // --- SANGRIAS Y COCTELES ---
    { name: 'Sangría - Vino de casa', description: 'Receta tradicional macerada con fruta fresca.', price: 16.00, category: 'coctel', subcategory: 'SANGRÍA', sort_order: 110 },
    { name: 'Pisco sour', description: 'Orgullo peruano con Pisco Premium y espuma de seda.', price: 8.00, category: 'coctel', subcategory: 'MIXOLOGÍA', sort_order: 111 }
]

async function seed() {
    console.log('--- Aplicando Actualizaciones Solicitadas ---')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error:', error)
    else console.log('¡Carta actualizada con éxito con los nuevos precios y secciones!')
}

seed()
