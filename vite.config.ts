import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Importante: no expongas claves de API aquí. Todo lo que se define en el
// frontend acaba visible en el navegador. Las claves viven solo en el servidor.
export default defineConfig({
  plugins: [react()],
});
