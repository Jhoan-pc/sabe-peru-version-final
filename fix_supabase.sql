-- 1. Asegurarnos que la tabla existe y tiene la columna 'tags'
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}'
);

-- Si la tabla ya existía pero no tenía 'tags', esto lo arregla:
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Habilitar seguridad (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 3. LIMPIEZA TOTAL DE POLÍTICAS (Para evitar el error "already exists")
-- Borramos cualquier política previa con estos nombres
DROP POLICY IF EXISTS "Enable read for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable insert for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable update for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for everyone" ON menu_items;

-- 4. CREAR POLÍTICAS NUEVAS (Permisos completos para que funcione el sistema)
-- Lectura pública
CREATE POLICY "Enable read for everyone" ON menu_items FOR SELECT USING (true);

-- Escritura/Edición (Insertar, Actualizar, Borrar) para todos (Modo desarrollo)
CREATE POLICY "Enable insert for everyone" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for everyone" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for everyone" ON menu_items FOR DELETE USING (true);
