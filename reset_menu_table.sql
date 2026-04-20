-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- ADVERTENCIA: ESTO BORRA TODOS LOS DATOS DE LA CARTA
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

-- 1. Borrar la tabla antigua por completo (y sus políticas cascade)
DROP TABLE IF EXISTS menu_items CASCADE;

-- 2. Crear la tabla desde cero con la estructura FINAL (incluyendo tags)
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT, -- Importante para clasificar
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}' -- Para los iconos (pollo, carne, picante...)
);

-- 3. Habilitar seguridad (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas permisivas (Modo Desarrollo)
CREATE POLICY "Enable read for everyone" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for everyone" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for everyone" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for everyone" ON menu_items FOR DELETE USING (true);
