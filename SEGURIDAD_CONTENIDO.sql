-- Tabla para el contenido dinámico de la web
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'html'
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Public Read Content" ON site_content;
CREATE POLICY "Public Read Content" ON site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Edit Content" ON site_content;
CREATE POLICY "Admin Edit Content" ON site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Datos iniciales (basados en el HTML actual)
INSERT INTO site_content (key, content, type, description) VALUES
('hero_title', 'La mejor experiencia<br><span>Peruana de Oviedo.</span>', 'html', 'Título principal del Hero'),
('hero_label', 'Bienvenidos al Sabor', 'text', 'Etiqueta pequeña sobre el título del Hero'),
('philosophy_title', 'El compromiso con el sabor.', 'text', 'Título de la sección Filosofía'),
('philosophy_text_1', 'Creemos en la honestidad del plato. Por eso, combinamos los mejores productos locales con los ingredientes más auténticos traídos desde la raíz.', 'text', 'Párrafo 1 de la Filosofía'),
('philosophy_text_2', 'Desde nuestro emblemático Ceviche, preparado al momento, hasta la calidez de un Lomo Saltado con el punto exacto de fuego, cada bocado es una promesa cumplida: aquí, realmente sabe a Perú.', 'text', 'Párrafo 2 de la Filosofía')
ON CONFLICT (key) DO NOTHING;
