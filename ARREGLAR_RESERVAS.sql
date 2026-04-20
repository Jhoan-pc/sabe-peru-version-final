-- EJECUTA ESTO EN EL EDITOR SQL DE SUPABASE PARA ARREGLAR LAS RESERVAS

-- 1. Añadir columna de hora si falta
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_time TIME;

-- 2. Añadir columna de motivo/ocasión si falta
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS occasion TEXT;

-- 3. Confirmar que todo está bien (Opcional)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations';
