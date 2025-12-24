import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env vars from both frontend/react and project root
    const localEnv = loadEnv(mode, path.resolve(__dirname, '.'), '');
    const rootEnv = loadEnv(mode, path.resolve(__dirname, '../..'), '');
    
    // Prefer VITE_ prefixed vars, fallback to non-prefixed
    const geminiKey = localEnv.VITE_GEMINI_API_KEY || rootEnv.VITE_GEMINI_API_KEY || 
                      localEnv.GEMINI_API_KEY || rootEnv.GEMINI_API_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose VITE_ prefixed env vars to client
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
