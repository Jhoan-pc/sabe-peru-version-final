import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function cleanDuplicates() {
    try {
        console.log("Limpiando platos antiguos (duplicados)...");
        const querySnapshot = await getDocs(collection(db, 'menu_items'));
        let deleted = 0;
        
        for (const document of querySnapshot.docs) {
            const data = document.data();
            if (data.id === undefined) {
                await deleteDoc(doc(db, 'menu_items', document.id));
                deleted++;
            }
        }
        
        console.log(`✅ ${deleted} platos antiguos borrados. Ahora tienes exactamente los 75 de tu CSV.`);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

cleanDuplicates();
