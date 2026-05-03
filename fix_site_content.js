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

async function fixSiteContent() {
    try {
        console.log("Arreglando imágenes de la página principal en site_content...");
        const qs = await getDocs(collection(db, 'site_content'));
        let count = 0;
        
        for (const document of qs.docs) {
            const item = document.data();
            if (item.type === 'image' && item.content && item.content.includes('firebasestorage')) {
                let newUrl = '/assets/Hero1.webp';
                
                if (item.key === 'hero_bg') newUrl = '/assets/Hero1.webp';
                if (item.key === 'phil_img') newUrl = '/assets/hero2.webp';
                if (item.key === 'spec_img') newUrl = '/assets/hero3.webp';
                if (item.key === 'exp_hero_bg') newUrl = '/assets/Hero1.webp';
                if (item.key === 'exp_img1') newUrl = '/assets/hero4.webp';
                if (item.key === 'exp_img2') newUrl = '/assets/hero2.webp';
                if (item.key === 'res_hero_bg') newUrl = '/assets/Hero1.webp';

                await updateDoc(doc(db, 'site_content', document.id), {
                    content: newUrl
                });
                count++;
            }
        }
        
        console.log(`✅ ${count} imágenes de secciones de la web han sido restauradas.`);
        process.exit(0);
    } catch(err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

fixSiteContent();
