import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function convertLocally() {
  const images = [
    'Hero1.png', 'hero2.png', 'hero3.png', 'hero4.png',
    'Ceviche.png', 'Mariscos.png', 'Lomo Salteado.png', 'Cocteles.png'
  ];

  const destFolder = path.join(__dirname, 'public', 'assets');
  if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

  const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co';

  for (const imgName of images) {
    const pubUrl = supabaseUrl + '/storage/v1/object/public/restaurante-assets/' + encodeURIComponent(imgName.replace(' ', '%20'));
    console.log("Processing:", pubUrl);
    
    try {
      const response = await fetch(pubUrl);
      if (!response.ok) {
        console.error("Failed to fetch", imgName);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const newName = imgName.replace(/\.[pP][nN][gG]$/, '.webp').replace(/%20/g, '').replace(/ /g, '');
      const destPath = path.join(destFolder, newName);
      
      await sharp(buffer)
        .webp({ quality: 80 })
        .toFile(destPath);
        
      console.log("Successfully saved locally:", destPath);
    } catch (e) {
      console.error(e);
    }
  }
}

convertLocally();
