
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto permite que las claves API funcionen dentro de tu código React
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
