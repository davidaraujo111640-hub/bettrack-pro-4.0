# Cambios de BetTrack Pro

El formato sigue [Versionado semántico](https://semver.org/lang/es/): **MAYOR.MENOR.PARCHE**.

- **PARCHE** (1.0.0 → 1.0.1): arreglos y retoques pequeños que no añaden funciones.
- **MENOR** (1.0.1 → 1.1.0): funciones nuevas que no rompen nada de lo que ya había.
- **MAYOR** (1.1.0 → 2.0.0): cambios grandes que obligan a los usuarios a hacer algo o cambian cómo se guardan los datos.

## 1.1.2 · 8 oct 2026

Tipografías alojadas en la propia web.

- Las tipografías (la principal y las de los logotipos de las casas) se sirven desde la propia web en vez de pedirse a Google Fonts: la primera pantalla carga antes, no se comparte ninguna visita con terceros y las letras también funcionan sin conexión.
- Solo incluyen los caracteres latinos (suficiente para el español) y pesan 241 KB en total; el navegador baja únicamente las que usa cada pantalla.
- Licencia SIL Open Font License 1.1, que permite alojarlas (ver `public/fonts/LICENCIAS.txt`).

## 1.1.1 · 8 oct 2026

Revisión completa del proyecto: arreglos y refuerzos, sin funciones nuevas.

**Datos y nube**
- Al volver a la app tras tenerla en segundo plano, o al recuperar la conexión, se traen los cambios hechos desde otros dispositivos (antes se quedaba con datos viejos hasta reiniciarla).
- Cargar más de 1.000 elementos desde la nube ya no puede saltarse ni repetir filas.
- Los borrados grandes (por ejemplo, al restaurar una copia) se envían por lotes pequeños: antes podían fallar y quedarse atascados.
- Los reintentos de subida esperan cada vez más si hay un fallo persistente.
- Si el dispositivo se queda sin espacio, la app avisa en vez de romperse.
- Los bankrolls conservan el orden con el que se veían al cargar de la nube.

**Seguridad**
- La lectura de capturas con IA solo funciona con la sesión iniciada: antes cualquiera con la dirección podía gastar el crédito de la IA. El límite de uso es ahora por usuario.
- Los datos dañados (en el dispositivo o en la nube) se descartan al cargar y se guardan aparte, en vez de dejar la app caída.
- Al cerrar sesión se suben los cambios pendientes y se borran los datos de ese dispositivo (si algo no se ha podido subir, se conserva). Así, quien use después el móvil u ordenador no ve tus apuestas.
- El servidor local ya no es accesible desde otros equipos de la red.
- Se puede hacer zoom en el móvil (accesibilidad); los campos de texto usan 16 px en pantallas táctiles para que iPhone no acerque la pantalla al tocarlos.

**Cálculos y fechas**
- Inicio, Bankrolls y Estadísticas usan ya la misma fórmula: las apuestas anuladas y reembolsadas no distorsionan el yield ni el % de acierto.
- Al eliminar un bankroll se eliminan también sus apuestas, como ya avisaba el cuadro de confirmación (antes quedaban ocultas sin poder verlas).
- Una apuesta registrada de madrugada ya no sale con la fecha del día anterior.
- Las semanas empiezan en lunes (semanas ISO) en la agrupación por semanas.
- Crecimiento y barra de progreso de Inicio ya no muestran "NaN" con un bankroll inicial de 0 €.

**Robustez y seguridad**
- Pantalla de recuperación si algo falla al dibujar la app (en vez de quedarse en negro), con opción de recargar y de descargar los datos.
- Los iconos de casas que se suben se reducen antes de guardarse, y se rechazan archivos que no son imágenes o pesan demasiado.
- Cabeceras de seguridad en la web publicada.
- Dependencias actualizadas: sin vulnerabilidades en lo que se publica.
- `npm run lint` vuelve a pasar sin errores.

**Detalles**
- El orden de los bankrolls es el mismo en todos los dispositivos (los nuevos llevan fecha de creación).
- El "stake medio" de Inicio no cuenta las freebets, igual que en Estadísticas.
- Compartir una imagen cuando la app aún no estaba lista ya no da error: se abre la app con un aviso.

**Rendimiento**
- La aplicación se reparte en varios archivos: las actualizaciones descargan mucho menos porque las librerías grandes no cambian.

## 1.1.0 · 8 oct 2026

Apuestas combinadas.

- Nueva pestaña **Simple / Combinada** al registrar una operación: varias selecciones, cada una con su descripción, su cuota y su estado.
- La cuota total se calcula sola (producto de las selecciones) y se puede ajustar a mano, por ejemplo con cuotas potenciadas.
- El estado de la apuesta se deduce de sus selecciones: una perdida la pierde, todas ganadas la ganan, una anulada deja de contar para la cuota.
- En Mis Apuestas, etiqueta **COMBI ×N** que despliega las selecciones y permite marcar cada una como ganada, perdida, anulada o pendiente.
- Los botones ✓ y ✗ de la apuesta entera también funcionan en las combinadas.
- La IA reconoce las combinadas al leer una captura y rellena las selecciones.
- Las selecciones se guardan en la nube, en las copias de seguridad y en la exportación a CSV (columna nueva "Selecciones").

## 1.0.0 · 8 oct 2026

Primera versión numerada. Recoge todo lo hecho hasta ahora:

- Cuentas reales con email y contraseña (Supabase), recuperación de contraseña y perfil.
- Apuestas, bankrolls y casas guardados en la nube y sincronizados entre dispositivos, con modo sin conexión.
- Recuperación de datos antiguos guardados en el dispositivo (aviso de subir, banner en Bankrolls y rescate en copias sin claves).
- App instalable (PWA) con aviso de nueva versión y aviso para instalarla.
- Compartir apuestas con imagen: menú Compartir de Android, pegar imagen, arrastrar y subir captura, leídas con IA.
- Selectores de casa y de deporte con iconos, buscador y más usados arriba.
- Logos oficiales de casas, iconos de deportes, freebets, cash out, columna "Cobrado" y colores por estado.
- Estadísticas completas, exportación a CSV y copias de seguridad.
- Destello y rebote al marcar una apuesta como ganada o guardarla.
- Indicador de sincronización con la nube en móvil y botón de Casas en Inicio.
- Versión visible en la pantalla de acceso y en Mi perfil.
