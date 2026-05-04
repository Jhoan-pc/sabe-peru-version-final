const fs = require('fs');
let c = fs.readFileSync('src/admin.ts', 'utf8');
c = c.replace(/const fileExt = file\.name\.split\('\.'\)\.pop\(\);/g, '');
fs.writeFileSync('src/admin.ts', c);
