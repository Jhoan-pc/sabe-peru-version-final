import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";

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
const storage = getStorage(app);

const galleryMap = [
    { local: 'Hero1.webp', remote: 'galeria1.webp' },
    { local: 'hero2.webp', remote: 'galeria2.webp' },
    { local: 'hero3.webp', remote: 'galeria3.webp' },
    { local: 'hero4.webp', remote: 'galeria4.webp' },
    { local: 'Ceviche.webp', remote: 'galeria6.webp' },
    { local: 'Cocteles.webp', remote: 'galeria7.webp' },
    { local: 'LomoSalteado.webp', remote: 'galeria8.webp' },
    { local: 'Mariscos.webp', remote: 'galeria9.webp' },
];

async function fixImages() {
    console.log("🚀 Restaurando imágenes de Galería en Firebase Storage...");
    
    // 1. Restaurar Galería
    for (const img of galleryMap) {
        try {
            const buffer = fs.readFileSync(`public/assets/${img.local}`);
            const uint8Array = new Uint8Array(buffer);
            const fileRef = ref(storage, `restaurante-assets/${img.remote}`);
            await uploadBytes(fileRef, uint8Array, { contentType: 'image/webp' });
            console.log(`Subido ${img.remote} a la galería.`);
        } catch (e) {
            console.log(`Error subiendo ${img.local}: ${e.message}`);
        }
    }

    console.log("🚀 Limpiando URLs rotas y asignando imágenes por defecto en la Carta...");
    // 2. Arreglar Platos
    const qs = await getDocs(collection(db, 'menu_items'));
    let count = 0;

    for (const document of qs.docs) {
        const item = document.data();
        if (item.image_url && item.image_url.includes('firebasestorage')) {
            // Asignar imagen local según palabras clave, o limpiar para que no salga el ícono roto
            let newUrl = '';
            const n = (item.name || '').toLowerCase();
            const c = (item.category || '').toLowerCase();

            if (n.includes('ceviche')) newUrl = '/assets/Ceviche.webp';
            else if (n.includes('lomo') || n.includes('carne') || n.includes('anticucho')) newUrl = '/assets/LomoSalteado.webp';
            else if (n.includes('marisco') || n.includes('arroz') || n.includes('jalea')) newUrl = '/assets/Mariscos.webp';
            else if (c === 'coctel' || c === 'bebida') newUrl = '/assets/Cocteles.webp';
            
            await updateDoc(doc(db, 'menu_items', document.id), {
                image_url: newUrl
            });
            count++;
        }
    }
    
    console.log(`✅ Se limpiaron y restauraron las imágenes de ${count} platos.`);
    process.exit(0);
}

fixImages();
