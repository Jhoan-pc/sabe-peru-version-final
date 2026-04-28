import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function makeAllAvailable() {
    try {
        console.log("Obteniendo todos los platos...");
        const querySnapshot = await getDocs(collection(db, 'menu_items'));
        let count = 0;
        
        for (const document of querySnapshot.docs) {
            await updateDoc(doc(db, 'menu_items', document.id), {
                is_available: true
            });
            count++;
        }
        
        console.log(`✅ ${count} platos han sido marcados como DISPONIBLES.`);
        process.exit(0);
    } catch(err) {
        console.error("Error actualizando platos:", err);
        process.exit(1);
    }
}

makeAllAvailable();
