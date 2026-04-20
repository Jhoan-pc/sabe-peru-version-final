-- Añadir columnas de hora y motivo a la tabla de reservas
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_time TIME;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS occasion TEXT;
