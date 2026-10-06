# BetTrack Pro

App web para registrar apuestas deportivas, organizarlas en bankrolls y analizar ganancias, ROI y yield.
Incluye registro automático: subes una captura de la apuesta y Claude (IA de Anthropic) rellena el formulario.

## Arrancar en local

**Requisitos:** [Node.js](https://nodejs.org) 20 o superior.

- **Windows:** doble clic en `iniciar.bat`. Instala lo necesario la primera vez y abre el navegador.
- **Terminal:**
  ```bash
  npm install
  npm run dev
  ```
  y abre http://localhost:3000

Los cambios en las pantallas se ven al instante. Si cambias `server.ts` o `api/`, reinicia la app.

### Activar la captura con IA

1. Copia `.env.example` como `.env`.
2. Pon tu clave de API de Anthropic en `ANTHROPIC_API_KEY` (se crea en https://console.anthropic.com).

Sin clave, la app funciona igual pero el botón de captura mostrará un aviso.
El archivo `.env` está excluido de git: nunca subas tu clave al repositorio.

## Comandos

| Comando         | Qué hace                                              |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Arranca la app en modo desarrollo (puerto 3000)       |
| `npm test`      | Ejecuta los tests de los cálculos (beneficio, ROI...) |
| `npm run build` | Genera la versión de producción en `dist/`            |
| `npm start`     | Sirve la versión de producción (tras `npm run build`) |

## Despliegue (Vercel)

El proyecto se despliega en Vercel:

- La web se construye con Vite (`vercel.json`).
- `api/extract-bet.ts` se publica como función serverless en `/api/extract-bet`.
- En el panel de Vercel → *Settings → Environment Variables* hay que definir `ANTHROPIC_API_KEY`.

## Estructura

```
App.tsx              Estado global, estadísticas y rutas
components/          Pantallas y modales (Dashboard, BetList, AddBetModal...)
src/utils/betMath.ts Cálculos de beneficio, ROI, yield, drawdown y validación (con tests)
src/utils/exportCsv.ts Exportación de apuestas a CSV para Excel (con tests)
src/utils/backup.ts  Copia de seguridad completa: exportar e importar (con tests)
src/utils/           Logos, colores e iconos de las casas de apuestas
api/extract-bet.ts   Lectura de capturas con Claude (Vercel y local)
server.ts            Servidor local (Express + Vite)
types.ts             Tipos de datos
```

## Datos y copias de seguridad

Las apuestas se guardan en el navegador (`localStorage`). Si borras los datos del navegador o cambias de
dispositivo, se pierden, así que haz copias de seguridad de vez en cuando.

En *Mis Apuestas → Exportar* tienes:

- **Apuestas filtradas / Todas las apuestas**: CSV para abrir en Excel.
- **Exportar todo**: copia de seguridad (.json) con apuestas, bankrolls, casas de apuestas y un resumen de estadísticas.
- **Importar copia**: restaura una copia de seguridad (también desde *Bankrolls → Importar*). Se pide confirmación antes de reemplazar los datos.
