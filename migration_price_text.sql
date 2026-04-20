-- Cambiar el tipo de precio a TEXT para permitir formatos como "Vaso / Jarra"
ALTER TABLE menu_items ALTER COLUMN price TYPE TEXT;
