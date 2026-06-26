import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// publicDir: 'assets' → todo lo que esté en /assets se sirve desde la raíz web.
// Así el componente referencia /hero-plate-globe-narino.png, /hero-loop.mp4 y
// /data/narino-municipios.geojson sin rutas de build extrañas.
export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  build: { outDir: 'dist' },
});
