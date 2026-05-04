const fs = require('fs');
let c = fs.readFileSync('src/admin.ts', 'utf8');
c = c.replace(/const fileName = `galeria_admin_\$\{Date.now\(\)\}_\$\{i\}\.\$\{fileExt\}`;/g, '');
c = c.replace(/import \{ ref, uploadBytes, getDownloadURL, listAll, deleteObject \} from 'firebase\/storage';/, "import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';");
fs.writeFileSync('src/admin.ts', c);
