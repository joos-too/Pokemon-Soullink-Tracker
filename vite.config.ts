import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Load .env and .env.[mode] and expose VITE_* to import.meta.env
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd());

    return {
        define: {
            // Keep define empty or only for non-VITE constants. Vite will inject import.meta.env.* automatically.
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
