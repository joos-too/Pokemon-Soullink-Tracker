import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import tailwindcss from '@tailwindcss/vite'

// Load .env and .env.[mode] and expose VITE_* to import.meta.env
export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
