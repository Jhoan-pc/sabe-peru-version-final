import fs from 'fs';
import csv from 'csv-parser';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDV1hl8pXfKSFh2cXJNoTqH1HbM90WIwtY",
  authDomain: "sabe-peru.firebaseapp.com",
  projectId: "sabe-peru",
  storageBucket: "sabe-peru.firebasestorage.app",
  messagingSenderId: "406380745138",
  appId: "1:406380745138:web:e829f5268078c7070254ab",
  measurementId: "G-5XEQ2BSVXW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Convertimos las URLs de Supabase a URLs de Firebase Storage
function convertUrl(url) {
    if (!url) return url;
    if (url.includes('supabase.co/storage/v1/object/public/restaurante-assets/')) {
        const filename = url.split('/').pop();
        return `https://firebasestorage.googleapis.com/v0/b/sabe-peru.firebasestorage.app/o/restaurante-assets%2F${filename}?alt=media`;
    }
    return url;
}

function processCSV(filePath, collectionName, idField = 'id') {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Archivo no encontrado: ${filePath}, saltando...`);
            return resolve();
        }
        
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const cleanedData = {};
                for (const [key, value] of Object.entries(data)) {
                    if (value === 'TRUE' || value === 'true') cleanedData[key] = true;
                    else if (value === 'FALSE' || value === 'false') cleanedData[key] = false;
                    else if (key === 'price' || key === 'sort_order' || key === 'number_of_people') cleanedData[key] = Number(value);
                    else cleanedData[key] = value;
                    
                    if (key === 'image_url' || key === 'content') {
                        cleanedData[key] = convertUrl(cleanedData[key]);
                    }
                    if (key === 'tags' && typeof value === 'string') {
                       try {
                         if (value.startsWith('{') && value.endsWith('}')) {
                            cleanedData[key] = value.slice(1, -1).split(',').map(s=>s.trim().replace(/^"|"$/g, ''));
                         } else if (value.startsWith('[')) {
                            cleanedData[key] = JSON.parse(value);
                         } else {
                            cleanedData[key] = value.split(',').map(s=>s.trim());
                         }
                       } catch(e) { cleanedData[key] = []; }
                    }
                }
                results.push(cleanedData);
            })
            .on('end', async () => {
                console.log(`Subiendo ${results.length} items a la colección ${collectionName}...`);
                let count = 0;
                for (const item of results) {
                    const docId = item[idField];
                    const docRef = docId ? doc(db, collectionName, docId.toString()) : doc(collection(db, collectionName));
                    await setDoc(docRef, item);
                    count++;
                }
                console.log(`✅ Colección ${collectionName} lista con ${count} documentos.`);
                resolve();
            });
    });
}

async function run() {
    console.log("Iniciando importación desde los CSVs de tu escritorio...");
    try {
        await processCSV('C:\\Users\\Martin\\Desktop\\site_content_rows.csv', 'site_content', 'key');
        await processCSV('C:\\Users\\Martin\\Desktop\\menu_items_rows.csv', 'menu_items', 'id');
        await processCSV('C:\\Users\\Martin\\Desktop\\reservations_rows.csv', 'reservations', 'id');
        console.log("🎉 ¡Toda la base de datos importada a Firebase con éxito!");
        process.exit(0);
    } catch(err) {
        console.error("Error importando:", err);
        process.exit(1);
    }
}

run();
