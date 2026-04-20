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
    { name: 'Ceviche mixto Sabe a Perú', description: 'Cortes de pescado y una mixtura de mariscos marinados en jugo de limón y leche de tigre, coronada con una salsa de rocoto y ají amarillo.', price: 25.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 5 },
    { name: 'Tiradito Sabe a Perú', description: 'Finas tiras de pescado marinadas en jugo de limon sobre una salsa suave de aji amarillo y maracuyá.', price: 23.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 6 },
    { name: 'Anticuchos 3 brochetas', description: 'Brochetas de corazón de res marinadas en salsa anticuchera, con papas a la huancaina y choclo.', price: 12.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 7 },
    { name: 'Choritos a la chalaca 10 und.', description: 'Mejillones frescos al natural, bañados con una colorida mezcla de cebolla, cilantro, tomate, choclo y ají.', price: 12.00, category: 'comida', subcategory: 'ENTRADAS', sort_order: 8 },

    // --- PLATOS DE FONDO ---
    { name: 'Arroz con mariscos', description: 'Mezcla de arroz con granos de choclos, mariscos frescos, salsa madre y vino blanco, coronado con queso parmesano.', price: 22.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 10 },
    { name: 'Chaufa de mariscos', description: 'Arroz salteado al wok con una seleccion de mariscos frescos salteado con cebollín, huevo, jengibre y aceite de sésamo.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 11 },
    { name: 'Chaufa de carne', description: 'Arroz salteado al wok con trozos de carne, salteado con cebollín, huevo, jengibre y brotes de soja.', price: 20.00, category: 'comida', subcategory: 'PLATOS DE FONDO', sort_order: 12 },
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
    { name: 'Choco maracuyá', description: 'Equilibrio perfecto entre cacao y fruta de la pasión.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 50 },
    { name: 'Torta 3 leches', description: 'Bizcocho embebido en tres tipos de leche tradicionales.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 51 },
    { name: 'Crema volteada', description: 'Textura suave y caramelo artesanal.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 52 },
    { name: 'Arroz con leche', description: 'El dulce clásico de nuestra tradición.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 53 },
    { name: 'Brownie con helado', description: 'Chocolate intenso templado con helado de vainilla.', price: 6.00, category: 'comida', subcategory: 'POSTRES', sort_order: 54 },
    { name: 'Helado de la casa', description: 'Nuestros sabores más refrescantes.', price: 5.00, category: 'comida', subcategory: 'POSTRES', sort_order: 55 },

    // --- BEBIDAS Y BATIDOS ---
    { name: 'Cerveza Cusqueña negra', description: 'Cerveza premium del Perú.', price: 3.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 60 },
    { name: 'Cerveza Cusqueña dorada', description: 'Cerveza premium del Perú.', price: 3.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 61 },
    { name: 'Cerveza Cusqueña de trigo', description: 'Cerveza premium del Perú.', price: 3.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 62 },
    { name: 'Cerveza Pilsen', description: 'Tradición cervecera peruana.', price: 3.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 63 },
    { name: 'Inca kola', description: 'El sabor dorado que define al Perú.', price: 3.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 64 },
    { name: 'Chicha morada', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 12,00€. Infusión artesanal de maíz morado.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 65 },
    { name: 'Limonada frozen', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 12,00€. Granizado de limón natural refrescante.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 66 },
    { name: 'Pisco sour', description: 'Cóctel emblemático preparado con maestría.', price: 8.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 67 },
    { name: 'Batido de piña', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 68 },
    { name: 'Batido de maracuyá', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 69 },
    { name: 'Batido de mango', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 70 },
    { name: 'Batido de fresa', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 71 },
    { name: 'Batido de mora', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 72 },
    { name: 'Batido de guanábana', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 73 },
    { name: 'Batido de papaya', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 74 },
    { name: 'Batido de tamarindo', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 75 },
    { name: 'Batido de lulo', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 76 },
    { name: 'Batido de tomate de árbol', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 77 },
    { name: 'Batido de guayaba', description: 'DUAL_PRICE: vaso 5,00€ / Jarra 11,00€.', price: 5.00, category: 'bebida', subcategory: 'BEBIDAS Y BATIDOS', sort_order: 78 },

    // --- VINOS ---
    { name: 'Ramon Bilbao', description: 'Rioja Crianza clásico.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 80 },
    { name: 'Azpilicueta', description: 'Equilibrio de Rioja.', price: 19.50, category: 'bebida', subcategory: 'VINOS', sort_order: 81 },
    { name: 'Izadi', description: 'Modernidad y estructura.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 82 },
    { name: 'Beronia', description: 'Clásico y aromático.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 83 },
    { name: 'Ribera', description: 'Cuerpo castellano.', price: 18.00, category: 'bebida', subcategory: 'VINOS', sort_order: 84 },
    { name: 'Rueda', description: 'Frescura de Verdejo.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 85 },
    { name: 'Valviejo verdejo', description: 'Vino seleccionado.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 86 },
    { name: 'Albarino', description: 'Blanco gallego.', price: 16.00, category: 'bebida', subcategory: 'VINOS', sort_order: 87 },
    { name: 'GodellO', description: 'Elegancia frutal.', price: 16.00, category: 'bebida', subcategory: 'VINOS', sort_order: 88 },
    { name: 'Vino rosado', description: 'Suave y equilibrado.', price: 19.00, category: 'bebida', subcategory: 'VINOS', sort_order: 89 },
    { name: 'Moscato', description: 'Dulce italiano.', price: 16.00, category: 'bebida', subcategory: 'VINOS', sort_order: 90 },

    // --- VINOS ROSADOS ---
    { name: 'Prieto picudo', description: 'Especialidad rosada cítrica.', price: 19.00, category: 'bebida', subcategory: 'VINOS ROSADOS', sort_order: 100 },
    { name: 'Navarra', description: 'El rosado clásico.', price: 19.00, category: 'bebida', subcategory: 'VINOS ROSADOS', sort_order: 101 },

    // --- SANGRÍA ---
    { name: 'Sangría - Vino de la casa', description: 'Nuestra sangría artesanal macerada con fruta.', price: 16.00, category: 'coctel', subcategory: 'SANGRÍA', sort_order: 110 },
    { name: 'Pisco sour', description: 'Orgullo peruano con Pisco Premium y espuma de seda.', price: 8.00, category: 'coctel', subcategory: 'MIXOLOGÍA', sort_order: 111 }
]

async function seed() {
    console.log('--- Aplicando Diseño "Fiel a la Carta" con Detección Dual de Precios ---')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error:', error)
    else console.log('¡Carta sincronizada! Ahora el frontend detectará los precios duales.')
}

seed()
