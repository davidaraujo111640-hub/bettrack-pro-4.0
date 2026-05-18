import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  let anthropicClient: Anthropic | null = null;

  function getClient() {
    if (!anthropicClient) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is missing in environment variables.");
      }
      anthropicClient = new Anthropic({ apiKey });
    }
    return anthropicClient;
  }

  // API Route for bet extraction
  app.post("/api/extract-bet", async (req, res) => {
    try {
      const client = getClient();
      const { imageData, mimeType } = req.body;

      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType || "image/png",
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `Analiza esta captura de pantalla de una apuesta deportiva y extrae la información.
Devuelve SOLO un JSON válido, sin texto extra ni backticks, con esta estructura:
{
  "match": "nombres de los participantes del evento",
  "selection": "la selección o mercado apostado",
  "odds": 1.85,
  "stake": 10.00,
  "bookmaker": "nombre de la casa de apuestas",
  "sport": "nombre del deporte",
  "status": "PENDING"
}
Para status usa: PENDING si no es visible, WON si ganada, LOST si perdida.
Usa null para campos que no puedas identificar.`,
              },
            ],
          },
        ],
      });

      const texto = response.content[0].type === "text" ? response.content[0].text : "";
      const limpio = texto.replace(/```json|```/g, "").trim();
      const extractedData = JSON.parse(limpio);

      res.json(extractedData);
    } catch (error: any) {
      console.error("Error extracting bet:", error);
      const errorMessage = error.message || "No se pudo procesar la imagen.";
      res.status(500).json({
        error: "Error en el servidor: " + errorMessage,
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
