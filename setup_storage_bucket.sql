-- Create a new public bucket called 'gallery'
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure anyone can read the bucket (for display on website)
CREATE POLICY "Public Read Gallery"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery' );

-- Allow insertion for setup (Authenticated or Anon if set too permissive, strict for prod)
CREATE POLICY "Public Insert Gallery"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'gallery' );

-- Optional: Allow delete for management
CREATE POLICY "Public Delete Gallery"
ON storage.objects FOR DELETE
USING ( bucket_id = 'gallery' );
