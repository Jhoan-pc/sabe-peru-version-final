-- Add tags column to menu_items table
ALTER TABLE menu_items ADD COLUMN tags TEXT[] DEFAULT '{}';
