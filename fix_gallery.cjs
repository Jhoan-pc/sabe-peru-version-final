const fs = require('fs');
let c = fs.readFileSync('src/admin.ts', 'utf8');
c = c.replace(/const file = files\[i\];/, "const file = files[i];\nconst fileExt = file.name.split('.').pop();");
c = c.replace(/await uploadBytes\(ref\(storage, 'restaurante-assets\/' \+ fileName\), file\);/, "await uploadToCloudinary(file);");
fs.writeFileSync('src/admin.ts', c);
