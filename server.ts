import "dotenv/config";
import dotenv from "dotenv";

// .env.local tiene las claves públicas de Supabase, que la lectura de capturas usa para comprobar la sesión
dotenv.config({ path: ".env.local" });
import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import extractBetHandler from "./api/extract-bet";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for bet extraction (misma función que se despliega en Vercel)
  app.post("/api/extract-bet", extractBetHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      // La recarga en vivo (HMR) usa el mismo puerto 3000
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Solo en este equipo: no se expone a otros dispositivos de la red
  httpServer.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("Aviso: falta ANTHROPIC_API_KEY en .env. La app funciona, pero la captura con IA no.");
    }
  });
}

startServer();
