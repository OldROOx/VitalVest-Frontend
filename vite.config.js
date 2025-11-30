// vite.config.js - ACTUALIZADO PARA SHARED WORKER
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        watch: {
            usePolling: true,
            interval: 100
        },
        hmr: {
            overlay: true
        }
    },
    // ✨ NUEVO: Configuración para Shared Worker
    worker: {
        format: 'es'
    },
    build: {
        rollupOptions: {
            output: {
                // Asegurar que el Shared Worker se copie correctamente
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'sharedWorker.js') {
                        return 'sharedWorker.js';
                    }
                    return assetInfo.name;
                }
            }
        }
    }
})