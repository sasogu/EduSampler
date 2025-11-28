# EduSampler

PWA sencilla para jugar con samplers: sube tus audios, recórtalos visualmente, ajusta tempo por pista o global y guarda mezclas. Funciona offline.

## Ejecutar en local

1) `cd /Users/sasogu/web/EduSampler`  
2) Sirve archivos estáticos, por ejemplo:  
   - `python3 -m http.server 4173`  
   - o `npx http-server -p 4173`  
3) Abre <http://localhost:4173> en el navegador y pulsa **Iniciar audio** para habilitar Web Audio.  
4) Opcional: instala como PWA con **Instalar PWA** (Chrome/Edge).

## Funcionalidades principales

- 5 slots de sampler por defecto + hasta 5 extra.
- Subida de WAV/OGG/MP3; recorte gráfico del loop con forma de onda.
- Tempo por pista (slider %) y tempo global (porcentaje) independientes.
- Modo Solo/Mute por pista, volumen, nombres personalizados.
- Guardado de samples (IndexedDB) y metadatos/mezclas (localStorage). Botón **Guardar mezcla** para almacenar y selector para recargar configuraciones.
- PWA con `service-worker.js` cacheando assets; indicador de versión del SW en el pie.

## About

licencia MIT. Los sonidos incluidos provienen de Pixabay.
