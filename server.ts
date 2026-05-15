
try {
  await import("dotenv/config");
} catch (e) {
  console.warn("Aviso: No se pudo cargar dotenv manualmente. Si usas --env-file de Node.js, esto es normal.");
}
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a slightly larger limit for image uploads
  app.use(express.json({ limit: '10mb' }));

  let genAI: GoogleGenAI | null = null;
  
  function getGenAI() {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
      }
      genAI = new GoogleGenAI(apiKey);
    }
    return genAI;
  }

  // API Route for bet extraction
  app.post("/api/extract-bet", async (req, res) => {
    try {
      const ai = getGenAI();

      const { imageData, mimeType } = req.body;

      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const prompt = "Analizar esta captura de pantalla de una apuesta deportiva y extraer la información en formato JSON.";

      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Use a standard public model for local
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: imageData,
                  mimeType: mimeType || "image/png",
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match: { type: Type.STRING, description: "Nombres de los participantes del evento" },
              selection: { type: Type.STRING, description: "La selección o mercado específico apostado" },
              odds: { type: Type.NUMBER, description: "La cuota de la apuesta" },
              stake: { type: Type.NUMBER, description: "El importe apostado" },
              bookmaker: { type: Type.STRING, description: "Nombre de la casa de apuestas" },
              sport: { type: Type.STRING, description: "Nombre del deporte" },
              status: { 
                type: Type.STRING, 
                enum: ["PENDING", "WON", "LOST"], 
                description: "Estado de la apuesta si es visible" 
              }
            }
          }
        }
      });

      const response = result.response;

      const extractedData = JSON.parse(response.text);
      res.json(extractedData);
    } catch (error: any) {
      console.error("Error extracting bet:", error);
      
      // Provide more specific error messages if possible
      const errorMessage = error.message || "No se pudo procesar la imagen correctamente.";
      const status = error.status || 500;
      
      res.status(status).json({ 
        error: "Error en el servidor local: " + errorMessage,
        details: error.toString()
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
