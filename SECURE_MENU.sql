-- Secure menu_items table
-- First, drop the insecure "insert for everyone" policy if it exists
DROP POLICY IF EXISTS "Enable insert for everyone" ON menu_items;

-- Ensure read access is still public
DROP POLICY IF EXISTS "Enable read for everyone" ON menu_items;
CREATE POLICY "Enable read for everyone" ON menu_items FOR SELECT USING (true);

-- Allow full access (Insert, Update, Delete) ONLY for authenticated users
CREATE POLICY "Enable all for authenticated users" ON menu_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow authenticated users to view reservations (dashboard)
CREATE POLICY "Enable read reservations for authenticated" ON reservations
FOR SELECT
TO authenticated
USING (true);
