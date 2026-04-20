import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

const menuItems = [
    // --- ENTRADAS ---
    { name: 'Causa limeña de pollo', description: 'Capa suave de papa amarilla amasada, rellena de pollo deshilachado, mezclado con mayonesa, zanahoria, alverjas y cilantro, coronada con aceitunas negras, huevo duro.', price: 14.00, category: 'comida' },
    { name: 'Causa acevichada', description: 'Capa suave de papa amarilla amasada, rellena de aguacate, y coronada de finos cortes de pescado marinado en jugo de limon y leche de tigre, mezclado con cebolla morada, cilantro, ají, acompañada de choclo peruano y cancha.', price: 17.00, category: 'comida' },
    { name: 'Causa Sabe a Perú', description: 'Croquetas crujientes de causa, coronadas con choclos a la huancaina y un lomo saltado jugoso (trozos de carne, cebolla, tomate).', price: 17.00, category: 'comida' },
    { name: 'Ceviche de corvina', description: 'Finos cortes de corvina frescos del día, marinados en jugo de limón y leche de tigre, mezclados con cebolla morada y finos cortes de cilantro y ají, acompañados con cancha crujiente y tiernos granos de choclo y cortes de camote glaseado.', price: 23.00, category: 'comida' },
    { name: 'Ceviche mixto Sabe a Perú', description: 'Cortes de pescado y una mixtura de mariscos marinados en jugo de limón y leche de tigre, con cortes de cebolla y cilantro, coronada con una salsa de rocoto y ají amarillo, acompañado de camote glaseado, granos de choclo y canchita crocante.', price: 25.00, category: 'comida' },
    { name: 'Tiradito Sabe a Perú', description: 'Finas tiras de pescado marinadas en jugo de limon, colocadas sobre una salsa suave de aji amarillo y maracuyá, acompañadas de granos de choclo y trozos de camote glaseados.', price: 23.00, category: 'comida' },
    { name: 'Anticuchos 3 brochetas', description: 'Tradicional plato peruano. Brochetas de corazón de res marinadas en una salsa anticuchera (ají panka, vinagre, ajos y especias), acompañadas de papas a la huancaina y granos de choclo.', price: 12.00, category: 'comida' },
    { name: 'Choritos a la chalaca 10 und.', description: 'Mejillones frescos al natural, bañados con una colorida mezcla de cebolla, cilantro, tomate, choclo y ají, sazonados con jugo de limón y leche de tigre.', price: 12.00, category: 'comida' },

    // --- PLATOS DE FONDO ---
    { name: 'Arroz con mariscos', description: 'Una mezcla de arroz con granos de choclos y arvejas, mariscos frescos salteado con cebollín, salsa madre de mariscos y toques de vino blanco acompañado de una salsa criolla y coronado con queso parmesano.', price: 22.00, category: 'comida' },
    { name: 'Chaufa de mariscos', description: 'Arroz salteado al wok con una seleccion de mariscos frescos salteado con cebollín, huevo, toques de ajo, jengibre brotes de soya, toques de salsa de soja y aceite de sesamo.', price: 20.00, category: 'comida' },
    { name: 'Chaufa de carne', description: 'Arroz salteado al wok con trozos de carne, salteado con cebollín, huevo, toques de ajo, jengibre brotes de soja, toques de salsa de soja y aceite de sesamo.', price: 20.00, category: 'comida' },
    { name: 'Tacu tacu de lomo saltado montado', description: 'Un plato que combina la textura crujiente del tacu tacu (arroz y frijoles cocidos con un aderezo de la casa) con la sabrosura intensa de un lomo saltado montado con un huevo frito.', price: 22.00, category: 'comida' },
    { name: 'Lomo Saltado', description: 'Jugosos trozos de carne de res salteados al wok con cebolla morada, tomate, flameados con salsa de soya y un toque de vinagre y una salsa de la casa, servido con arroz blanco y patatas fritas.', price: 20.00, category: 'comida' },
    { name: 'Tallarines saltados de carne', description: 'Tallarines salteados con trozos de carne de vacuno, cebolla, tomate, brotes de soya, morron, cebollin, toques de salsa de soya, aceite de sésamo y una salsa de la casa.', price: 20.00, category: 'comida' },
    { name: 'Spaghetti a la huancaina con lomo', description: 'Deliciosos y cremosos espaguetis bañados con una salsa a la huancaina, elaborada con ají amarillo, queso fresco y leche, coronados con un jugoso lomo saltado.', price: 20.00, category: 'comida' },
    { name: 'Jalea mixta', description: 'Mariscos y pescado, apanados y fritos, acompañados con yuca frita y una salsa criolla. Un plato sabroso y crujiente de la cocina peruana.', price: 25.00, category: 'comida' },
    { name: 'Chicharrón de pescado', description: 'Trozos de pescados frescos apanados y fritos hasta alcanzar una textura crujiente y dorada, acompañados de unas yucas fritas y salsa criolla.', price: 20.00, category: 'comida' },
    { name: 'Chicharrón de cerdo', description: 'Cortes de cerdo cocinados lentamente hasta lograr una textura crocante y dorada, acompañados de patatas doradas y una salsa criolla de cebolla y hierbabuena.', price: 18.00, category: 'comida' },
    { name: 'Solomillo a lo macho', description: 'Jugoso solomillo de res, cocinado al punto y cubierto con una salsa a lo macho, elaborada con mariscos frescos y ajíes peruanos.', price: 25.00, category: 'comida' },
    { name: 'Mostrito', description: 'Crocante pollo broaster acompañado con patatas fritas y un delicioso arroz chaufa salteado al wok.', price: 18.00, category: 'comida' },

    // --- HAMBURGUESAS ---
    { name: 'Hamburguesa XXL', description: 'Pan Brioche, doble carne con queso gouda y queso cheddar, tocino y huevo acompañado de patatas fritas y mayo ajo.', price: 16.00, category: 'comida' },
    { name: 'Hamburguesa Hawaiana', description: 'Pan brioche, lechuga, carne, queso, tocino, queso gouda, piña caramelizada acompañados de patatas fritas y mayo ajo.', price: 14.00, category: 'comida' },
    { name: 'Hamburguesa Sabe a Perú', description: 'Pan brioche, cama de patatas fritas, carne, queso gouda, cebolla y tomate salteados con salsa de lomo y huevo, acompañado con patatas fritas y salsa huancaina.', price: 15.00, category: 'comida' },

    // --- ENSALADAS Y ESPECIALIDADES ---
    { name: 'Alitas acevichadas', description: 'Deliciosas alitas broster bañadas en una salsa acevichada con cebolla y toques de cilantro, acompañados de patatas fritas.', price: 15.00, category: 'comida' },
    { name: 'Ensalada Frescura tropical', description: 'Lechuga, tomate, pepinillo y cebolla morada, combinada con piña y pollo a la plancha. Con vinagreta artesanal de maracuyá.', price: 11.00, category: 'comida' },
    { name: 'Ensalada tataki', description: 'Tataki de atún con sésamo sobre lechuga con cebolla morada, tomate, huevo y suaves trozos de palta. Vinagreta exótica de aceite balsamico.', price: 12.00, category: 'comida' },

    // --- POSTRES ---
    { name: 'Choco maracuyá', description: 'Delicioso postre artesanal.', price: 6.00, category: 'comida' },
    { name: 'Torta 3 leches', description: 'Receta tradicional peruana.', price: 6.00, category: 'comida' },
    { name: 'Crema volteada', description: 'Clásico postre de leche asada.', price: 5.00, category: 'comida' },
    { name: 'Arroz con leche / Brownie', description: 'Opciones dulces de la casa.', price: 5.00, category: 'comida' },

    // --- BEBIDAS ---
    { name: 'Cerveza Cusqueña (Negra/Dorada/Trigo)', description: 'Cerveza premium peruana.', price: 3.00, category: 'bebida' },
    { name: 'Inca Kola / Pilsen', description: 'Bebidas tradicionales.', price: 3.00, category: 'bebida' },
    { name: 'Chicha morada (Vaso)', description: 'Bebida natural de maíz morado.', price: 5.00, category: 'bebida' },
    { name: 'Chicha morada (Jarra)', description: 'Bebida natural de maíz morado para compartir.', price: 12.00, category: 'bebida' },
    { name: 'Limonada frozen (Vaso)', description: 'Refrescante granizado de limón.', price: 4.00, category: 'bebida' },
    { name: 'Limonada frozen (Jarra)', description: 'Refrescante granizado de limón para compartir.', price: 10.00, category: 'bebida' },
    { name: 'Batido de Fruta (Vaso)', description: 'Piña, maracuyá, mango, fresa, mora, guanábana, lulo...', price: 5.00, category: 'bebida' },
    { name: 'Batido de Fruta (Jarra)', description: 'Jarra de batido natural preparado al momento.', price: 11.00, category: 'bebida' },

    // --- COCTELES ---
    { name: 'Pisco sour', description: 'Cóctel emblemático del Perú preparado con Pisco de alta calidad.', price: 8.00, category: 'coctel' },
    { name: 'Sangría de la casa', description: 'Macerado de frutas y vino seleccionado.', price: 15.00, category: 'coctel' }
]

async function seed() {
    console.log('--- Cargando Carta Final del Usuario ---')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('menu_items').insert(menuItems)
    if (error) console.error('Error:', error)
    else console.log('¡Carta definitiva cargada con éxito!')
}

seed()
