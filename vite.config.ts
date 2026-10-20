import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                carta: resolve(__dirname, 'carta.html'),
                admin: resolve(__dirname, 'admin.html'),
                experiencia: resolve(__dirname, 'experiencia.html')
            },
            output: {
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || '';
                    if (name.endsWith('.css')) {
                        if (name.includes('experiencia')) {
                            return 'assets/experiencia-[hash][extname]';
                        }
                        return 'assets/style-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    }
});
