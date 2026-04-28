const fs = require('fs');

let adminFile = fs.readFileSync('src/admin.ts', 'utf-8');

// 1. Imports
adminFile = adminFile.replace(
  /import \{ createClient \} from '@supabase\/supabase-js';\s*\/\/\s*Configuration\s*const supabaseUrl = import\.meta\.env\.VITE_SUPABASE_URL;\s*const supabaseAnonKey = import\.meta\.env\.VITE_SUPABASE_ANON_KEY;\s*if \(\!supabaseUrl \|\| \!supabaseAnonKey\) \{\s*console\.error\('Supabase credentials missing!'\);\s*\}\s*const supabase = createClient\(supabaseUrl, supabaseAnonKey\);/,
  `import { db, auth, storage } from './firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';`
);

// 2. Auth Session Check
adminFile = adminFile.replace(
  /const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);\s*if \(session\) \{\s*showDashboard\(\);\s*\} else \{\s*loginScreen\.style\.display = 'flex';\s*\}/,
  `onAuthStateChanged(auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            loginScreen.style.display = 'flex';
        }
    });`
);

// 3. Login
adminFile = adminFile.replace(
  /const \{ error \} = await supabase\.auth\.signInWithPassword\(\{\s*email,\s*password\s*\}\);/,
  `let error: any = null;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch(err) {
            error = err;
        }`
);

// 4. Logout
adminFile = adminFile.replace(
  /await supabase\.auth\.signOut\(\);/,
  `await signOut(auth);`
);

// 5. Load Menu
adminFile = adminFile.replace(
  /const \{ data, error \} = await supabase[\s\S]*?\.order\('created_at', \{ ascending: false \}\);/,
  `let data: any[] = [];
        let error: any = null;
        try {
            const qs = await getDocs(query(collection(db, 'menu_items'), orderBy('created_at', 'desc')));
            data = qs.docs.map(d => ({id: d.id, ...d.data()}));
            data.sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
        } catch(err) { error = err; }`
);

// 6. Image Upload
adminFile = adminFile.replace(
  /const \{ error: uploadError \} = await supabase\.storage[\s\S]*?showToast\('Imagen subida correctamente'\);/,
  `
            const fileRef = ref(storage, 'restaurante-assets/' + fileName);
            try {
                await uploadBytes(fileRef, file);
                const publicUrl = await getDownloadURL(fileRef);
                itemImageUrl.value = publicUrl;
                uploadStatus.textContent = '✅ Imagen lista para guardar.';
                uploadStatus.style.color = 'green';
                showToast('Imagen subida correctamente');
            } catch(uploadError: any) {
                console.error("Error al subir:", uploadError);
                uploadStatus.textContent = 'Error al subir la imagen.';
                uploadStatus.style.color = 'red';
                showToast('Error al subir la imagen', 'error');
                return;
            }`
);

// 7. Save / Update Item
adminFile = adminFile.replace(
  /let error;\s*if \(currentMode === 'create'\) \{[\s\S]*?error = updateError;\s*\}/,
  `let error: any = null;
        try {
            if (currentMode === 'create') {
                (itemData as any)['created_at'] = new Date().toISOString();
                await addDoc(collection(db, 'menu_items'), itemData);
            } else {
                await updateDoc(doc(db, 'menu_items', currentItemId!), itemData);
            }
        } catch (err) {
            error = err;
        }`
);

// 8. Delete Menu
adminFile = adminFile.replace(
  /const \{ error \} = await supabase\.from\('menu_items'\)\.delete\(\)\.eq\('id', id\);/,
  `let error: any = null; try { await deleteDoc(doc(db, 'menu_items', id)); } catch(err) { error = err; }`
);

// 9. Load Home Content
adminFile = adminFile.replace(
  /const \{ data, error \} = await supabase\.from\('site_content'\)\.select\('\*'\);/,
  `let data: any[] = []; let error: any = null; try { const qs = await getDocs(collection(db, 'site_content')); data = qs.docs.map(d => d.data()); } catch(err) { error = err; }`
);

// 10. Load Experiencia Content
adminFile = adminFile.replace(
  /const \{ data, error \} = await supabase\.from\('site_content'\)\.select\('\*'\)\.like\('key', 'exp_%'\);/,
  `let data: any[] = []; let error: any = null; try { const qs = await getDocs(collection(db, 'site_content')); data = qs.docs.map(d => d.data()).filter((item: any) => item.key && item.key.startsWith('exp_')); } catch(err) { error = err; }`
);

// 11. Batch Text Upsert
adminFile = adminFile.replace(
  /const \{ error: textError \} = await supabase\.from\('site_content'\)\.upsert\(textUpdates, \{ onConflict: 'key' \}\);\s*if \(textError\) throw textError;/,
  `for (const update of textUpdates) { await setDoc(doc(db, 'site_content', update.key!), update, { merge: true }); }`
);

// 12. Batch Image Upsert
adminFile = adminFile.replace(
  /const \{ error: uploadError \} = await supabase\.storage[\s\S]*?if \(imgUpsertError\) throw imgUpsertError;/,
  `const fileRef = ref(storage, 'restaurante-assets/' + fileName);
                    await uploadBytes(fileRef, file);
                    const publicUrl = await getDownloadURL(fileRef);

                    await setDoc(doc(db, 'site_content', key!), {
                        key: key,
                        content: publicUrl + '?v=' + Date.now(),
                        type: 'image',
                        updated_at: new Date().toISOString()
                    }, { merge: true });`
);

// 13. Load Gallery Admin
adminFile = adminFile.replace(
  /const \{ data, error \} = await supabase\.storage\.from\('restaurante-assets'\)\.list\(\);/,
  `let data: any[] = []; let error: any = null; try { const listFolderRef = ref(storage, 'restaurante-assets'); const res = await listAll(listFolderRef); data = res.items; } catch(err) { error = err; }`
);

// 14. Render Gallery Admin loop
adminFile = adminFile.replace(
  /galleryFiles\.forEach\(\(file: any\) => \{[\s\S]*?galleryAdminGrid\.appendChild\(card\);\s*\}\s*\}\);/,
  `for (const file of galleryFiles) {
            try {
                const fileUrl = await getDownloadURL(file);
                const isVideo = file.name.endsWith('.mp4');
                const card = document.createElement('div');
                card.style.background = 'white';
                card.style.padding = '10px';
                card.style.borderRadius = '8px';
                card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';

                const media = isVideo
                    ? \`<video src="\${fileUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;" muted></video>\`
                    : \`<img src="\${fileUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">\`;

                card.innerHTML = \`
                    \${media}
                    <div style="margin-top: 10px; text-align:right;">
                        <button class="btn-delete-gallery" data-filename="\${file.name}" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Borrar</button>
                    </div>
                \`;
                if (galleryAdminGrid) galleryAdminGrid.appendChild(card);
            } catch (err) {
                console.error(err);
            }
        }`
);

// 15. Delete Gallery Image
adminFile = adminFile.replace(
  /const \{ error \} = await supabase\.storage\.from\('restaurante-assets'\)\.remove\(\[fileName\]\);/,
  `let error: any = null; try { await deleteObject(ref(storage, 'restaurante-assets/' + fileName)); } catch(err) { error = err; }`
);

// 16. Upload multiple gallery images
adminFile = adminFile.replace(
  /await supabase\.storage\.from\('restaurante-assets'\)\.upload\(fileName, file\);/,
  `await uploadBytes(ref(storage, 'restaurante-assets/' + fileName), file);`
);

// 17. Load reservations
adminFile = adminFile.replace(
  /const \{ data, error \} = await supabase[\s\S]*?\.limit\(50\);/,
  `let data: any[] = []; let error: any = null; try { const qs = await getDocs(query(collection(db, 'reservations'), orderBy('created_at', 'desc'))); data = qs.docs.map(d => d.data()); } catch(err) { error = err; }`
);

fs.writeFileSync('src/admin.ts', adminFile, 'utf-8');
console.log('admin.ts migrated successfully');
