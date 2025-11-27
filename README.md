# EduSampler (prototipo)

PWA tipo Incredibox para clase de música: activa personajes, mezcla capas generadas con Web Audio y funciona offline.

## Ejecutar en local

1. Entra a la carpeta del proyecto: `cd /Users/sasogu/web/EdoBox`
2. Sirve los archivos estáticos (ejemplos):
   - Python 3: `python3 -m http.server 4173`
   - Node (si lo tienes): `npx http-server -p 4173`
3. Abre <http://localhost:4173> en el navegador. Toca **Iniciar audio** para habilitar el contexto de audio (requisito de los navegadores).
4. Instala como PWA con el botón **Instalar PWA** (Chrome/Edge) y úsalo offline.

## Qué incluye

- Motor Web Audio con kits precargados, patrones de 16 pasos, solo/mute y control de tempo.
- UI responsive con tarjetas de personajes, colores vivos y controles básicos.
- PWA lista: `manifest.webmanifest` e `service-worker.js` cacheando los assets.
- Hasta 10 samplers personalizados: añade tarjeta, sube WAV/OGG/MP3 y se integra al motor.

## Próximos pasos sugeridos

- Añadir samples reales (beatbox, voces de alumnos) en `/assets` y asignarlos a cada pista.
- Guardar mezclas favoritas en `localStorage` y compartir códigos cortos.
- Modo “escena” para automatizar mute/solo en secciones (verso, coro).
