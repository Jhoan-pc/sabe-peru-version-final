-- Limpiar políticas antiguas para asegurar que podemos borrar
DROP POLICY IF EXISTS "Enable delete for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable update for everyone" ON menu_items;

-- Re-crear las políticas permitiendo todo (para desarrollo)
CREATE POLICY "Enable delete for everyone" ON menu_items FOR DELETE USING (true);
CREATE POLICY "Enable update for everyone" ON menu_items FOR UPDATE USING (true);
