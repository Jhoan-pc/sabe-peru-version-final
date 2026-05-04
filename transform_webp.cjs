const fs = require('fs');
let c = fs.readFileSync('src/admin.ts', 'utf8');
c = c.replace(/return data\.secure_url;/, "return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');");
fs.writeFileSync('src/admin.ts', c);
