-- Este error significa que intentaste crear una política que ya existía.
-- No te preocupes por el error de "objects", eso es de otra parte.
-- Lo importante es que las columnas de reservas se creen.

-- Ejecuta SOLO estas líneas para asegurarnos:

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_time TIME;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS occasion TEXT;

-- Si esto no da error, tus reservas ya estarán listas en la base de datos.
