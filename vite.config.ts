import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // FIX: This tells Vite your files are right here in the main folder
    root: '.',
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        // FIX: This tells the '@' symbol to look in the main folder, not a src folder
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
