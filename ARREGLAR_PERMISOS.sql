-- Arreglar políticas de seguridad para reservas
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Borrar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Enable insert for everyone" ON reservations;
DROP POLICY IF EXISTS "Anyone can insert reservation" ON reservations;
DROP POLICY IF EXISTS "Public Reservation Insert" ON reservations;

-- Crear la política correcta que permite a CUALQUIERA insertar
CREATE POLICY "Public Reservation Insert"
ON reservations
FOR INSERT
WITH CHECK (true);

-- (Opcional) Permitir leer tus propias reservas o todas si eres admin, 
-- pero para este caso simple, con permitir INSERT basta para que el cliente guarde.
