-- Permitir eliminar registros en la tabla menu_items para poder limpiar y evitar duplicados
CREATE POLICY "Enable delete for everyone" ON menu_items FOR DELETE USING (true);
