-- PROTECCIÓN DEL MENÚ DIGITAL
-- Objetivo: Que solo el dueño (usuario autenticado) pueda editar la carta,
-- pero que todo el mundo (clientes) pueda verla.

-- 1. Asegurar que las políticas estén activas
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier politica permisiva anterior (importante para cerrar la puerta trasera)
DROP POLICY IF EXISTS "Enable insert for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable read for everyone" ON menu_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON menu_items;

-- 3. Crear Política PUBLICA de LECTURA (Todo el mundo puede VER el menú)
CREATE POLICY "Public Read Access"
ON menu_items
FOR SELECT
USING (true);

-- 4. Crear Política DE ADMINISTRADOR (Solo usuarios logueados pueden EDITAR)
-- Esto permite INSERT (crear), UPDATE (editar) y DELETE (borrar)
CREATE POLICY "Admin Full Access"
ON menu_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Política para Reservas: Solo el administrador puede VER todas las reservas (Dashboard)
-- Los clientes normales solo pueden insertar, pero no ver las de otros.
CREATE POLICY "Admin View Reservations"
ON reservations
FOR SELECT
TO authenticated
USING (true);
