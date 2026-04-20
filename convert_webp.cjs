const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const axios = require('axios');

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function processImages() {
  console.log('--- Iniciando conversión masiva a WebP ---');
  
  // 1. Obtener items con imágenes que no sean webp
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'eq', '');

  if (error) {
    console.error('Error obteniendo items:', error);
    return;
  }

  for (const item of items) {
    if (!item.image_url.toLowerCase().endsWith('.webp')) {
      console.log(`Procesando: ${item.name} (${item.image_url})`);
      
      try {
        // Descargar imagen
        const response = await axios.get(item.image_url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Convertir a WebP
        const webpBuffer = await sharp(buffer)
          .webp({ quality: 80 })
          .toBuffer();

        // Subir a Supabase Storage
        const fileName = `menu_optimized_${Date.now()}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('restaurante-assets')
          .upload(fileName, webpBuffer, {
            contentType: 'image/webp',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('restaurante-assets')
          .getPublicUrl(fileName);

        // Actualizar base de datos
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ image_url: publicUrl })
          .eq('id', item.id);

        if (updateError) throw updateError;

        console.log(`✅ ${item.name} convertido con éxito.`);
      } catch (err) {
        console.error(`❌ Error con ${item.name}:`, err.message);
      }
    }
  }
  
  console.log('--- Proceso finalizado ---');
}

processImages();
