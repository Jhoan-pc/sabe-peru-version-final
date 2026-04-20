-- Solo añadir las columnas nuevas a la tabla existente
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
