import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";

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

async function importData() {
  console.log("🚀 Iniciando conexión con los servidores de Google Firebase...");
  
  try {
    const rawData = fs.readFileSync('backup_menu_items.json', 'utf-8');
    const menuItems = JSON.parse(rawData);
    
    console.log(`Leídos ${menuItems.length} platos locales. Subiendo a Firestore...`);
    
    const menuRef = collection(db, 'menu_items');
    let subidos = 0;
    
    for (const item of menuItems) {
      // Aseguramos de que todo plato tenga su propio ID auto-generado y limpio en Google
      const newDoc = doc(menuRef);
      await setDoc(newDoc, {
          ...item,
          created_at: new Date().toISOString()
      });
      subidos++;
    }
    
    console.log(`✅ ¡ÉXITO! ${subidos} elementos de la carta alojados en Firestore permanentemente.`);
    process.exit(0);
  } catch(e) {
    console.error("❌ Error importando datos a Firebase. Asegúrate de que creaste la BD en 'Modo Prueba' y tiene los permisos adecuados:", e);
    process.exit(1);
  }
}

importData();
