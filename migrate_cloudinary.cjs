const fs = require('fs');

let code = fs.readFileSync('src/admin.ts', 'utf8');

// Insert Cloudinary helper
code = code.replace(/import \{ ref, uploadBytes, getDownloadURL, listAll, deleteObject \} from 'firebase\/storage';/, `import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const cloudName = 'dhvbqs2ba';
const uploadPreset = 'sabeaperu_firm';

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(\`https://api.cloudinary.com/v1_1/\${cloudName}/image/upload\`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Error al subir a Cloudinary');
    const data = await res.json();
    return data.secure_url;
}`);

// Replace Menu Upload
code = code.replace(/const fileRef = ref\(storage, 'restaurante-assets\/' \+ fileName\);\s*try \{\s*await uploadBytes\(fileRef, file\);\s*const publicUrl = await getDownloadURL\(fileRef\);\s*itemImageUrl\.value = publicUrl;\s*uploadStatus\.textContent = '✅ Imagen lista para guardar\.';\s*uploadStatus\.style\.color = 'green';\s*showToast\('Imagen subida correctamente'\);/, `try {
                const publicUrl = await uploadToCloudinary(file);
                itemImageUrl.value = publicUrl;
                uploadStatus.textContent = '✅ Imagen lista para guardar.';
                uploadStatus.style.color = 'green';
                showToast('Imagen subida correctamente a Cloudinary');`);

// Replace Site Content Upload
code = code.replace(/const fileRef = ref\(storage, 'restaurante-assets\/' \+ fileName\);\s*await uploadBytes\(fileRef, file\);\s*const publicUrl = await getDownloadURL\(fileRef\);/, `const publicUrl = await uploadToCloudinary(file);`);

fs.writeFileSync('src/admin.ts', code);
console.log('Migrado a Cloudinary con éxito');
