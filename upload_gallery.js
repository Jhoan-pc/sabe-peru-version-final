import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = 'https://xdslypbjmenthwyrarui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkc2x5cGJqbWVudGh3eXJhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTYzMzcsImV4cCI6MjA4NjU5MjMzN30.1ujAkNw4jcXhQLXtPnbJCjx3LNn7Zf8YRgXsi0s0LeY'
const supabase = createClient(supabaseUrl, supabaseKey)

// CAMBIA ESTO POR EL NOMBRE DE TU BUCKET SI ES DIFERENTE
const BUCKET_NAME = 'restaurante-assets';
const LOCAL_FOLDER = path.join(__dirname, 'public', 'gallery');

async function uploadFiles() {
    console.log(`--- Iniciando subida de archivos al bucket '${BUCKET_NAME}' ---`);

    if (!fs.existsSync(LOCAL_FOLDER)) {
        console.error(`Error: La carpeta local '${LOCAL_FOLDER}' no existe.`);
        return;
    }

    const files = fs.readdirSync(LOCAL_FOLDER);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'];

    if (files.length === 0) {
        console.log('No hay archivos en la carpeta public/gallery para subir.');
        return;
    }

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!validExtensions.includes(ext)) {
            console.log(`Saltando archivo no soportado: ${file}`);
            continue;
        }

        const filePath = path.join(LOCAL_FOLDER, file);
        const fileBuffer = fs.readFileSync(filePath);

        console.log(`Subiendo: ${file}...`);

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(file, fileBuffer, {
                contentType: ext === '.mp4' || ext === '.mov' ? 'video/mp4' : 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error(`Error subiendo ${file}:`, error.message);
        } else {
            console.log(`¡Éxito! Archivo subido: ${data.path}`);
        }
    }

    console.log('--- Proceso completado ---');
}

uploadFiles();
