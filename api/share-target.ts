import type { Request, Response } from "express";

// Android envía lo compartido por POST a /share-target y normalmente lo recoge el service worker de la app.
// Si todavía no está activo (primera instalación, datos borrados…), la petición llega hasta aquí:
// se abre la app con un aviso en vez de enseñar un error.
export default function handler(_req: Request, res: Response) {
  res.setHeader("Location", "/?share=other");
  res.status(303).end();
}
