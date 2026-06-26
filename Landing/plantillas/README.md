# Plantilla Elementor — Landing Secretaría TIC

`plantilla-tic-landing.json` es una **plantilla de página de Elementor** (formato export, contenedores
Flexbox, `version 0.4`) que recrea la landing completa: **hero con globo 3D de Nariño** + **12 secciones**
de ejemplo. Los visuales de sección **no son imágenes estáticas**: son **elementos animados con three.js**
(estética cyber/HUD) que se montan solos en el navegador.

## 1. Importar en WordPress / Elementor
1. **Plantillas → Plantillas guardadas → Importar plantillas** → sube `plantilla-tic-landing.json`.
2. (Alternativa) Edita una página con Elementor → botón **Añadir plantilla** (carpeta) → pestaña
   *Mis plantillas* → **Importar** → inserta.
3. Publica. Para banner a ancho/alto completo: en *Ajustes de página* de Elementor elige
   **Elementor Full Width** o **Elementor Canvas**.

## 2. Multimedia — un solo subdirectorio: `media/`
Sube el contenido de `media/` a tu WordPress (recomendado `wp-content/uploads/2026/06/`) para que las
URLs resuelvan:
- `earth-blue-marble.jpg` — textura de la Tierra del globo (además hay cascada por CDN; opcional).
- `hero-plate-globe-narino.jpg` — *poster* del hero (reduced-motion / sin WebGL).
- `hero-plate-hud-frame.jpg` — *poster* de respaldo de los visuales FX.

Si subes a otra ruta, edita la constante `MEDIA` en `src/build-template.cjs` (y `POSTER`/`TEX` en
`src/hero-embed.template.html`) y **regenera** (ver §5).

## 3. Los visuales three.js (cyber, no estáticos)
- El **hero** es un **globo 3D real** (Tierra Blue Marble + contorno oficial y 64 municipios de Nariño),
  con giro, *parallax* y **zoom al departamento con el scroll**. Datos inline (no requiere red para los datos).
- Las secciones usan `<div class="tic-fx" data-fx="PRESET" data-color="#00A8FF">`. Un **motor FX**
  (un único `<script>` incluido en la plantilla) detecta esos div y monta una escena three.js en cada uno.
- **Presets:** `network` (red neuronal), `particles` (flujo de datos), `terrain` (relieve andino),
  `rings` (retícula HUD), `hexspin` (panal). Cambia el preset/color editando los atributos `data-fx` /
  `data-color`.
- `three.js` y `anime.js` se cargan por **CDN (jsDelivr)** desde el navegador del visitante (estándar).
  Con `prefers-reduced-motion` o sin WebGL se muestra el *poster*. Cada visual **pausa fuera de viewport**
  (IntersectionObserver) y limita el DPR para rendimiento.

## 4. Estructura
```
plantillas/
├── plantilla-tic-landing.json   # ← IMPORTAR ESTO en Elementor
├── media/                        # toda la multimedia, en un solo lugar
└── src/                          # fuentes para regenerar el JSON
    ├── build-template.cjs        # genera el .json (Node, sin dependencias)
    ├── hero-embed.template.html  # hero (globo 3D) embebible y "scoped"
    └── fx-engine.template.html   # motor FX + presets three.js
```

## 5. Regenerar / editar
Edita textos, colores, enlaces o secciones en `src/build-template.cjs`, y los visuales en
`src/*.template.html`. Luego:
```bash
cd plantillas/src
node build-template.cjs      # reescribe ../plantilla-tic-landing.json
```
Reimporta el JSON en Elementor.

## 6. Secciones (12)
1. **Hero** — globo 3D de Nariño (three.js) + titular + CTAs.
2. **Cifras clave** — contadores (64 municipios, datos, trámites, cobertura).
3. **Sobre la Secretaría** — texto + visual FX `rings`.
4. **Líneas estratégicas** — 4 icon-box.
5. **Innovación & IA** — FX `network` + texto.
6. **Datos Abiertos** — texto + FX `particles`.
7. **Conectividad** — FX `terrain` + texto.
8. **Trámites y servicios** — 3 tarjetas.
9. **Transparencia** — lista + FX `hexspin`.
10. **Noticias / Actualidad** — 3 tarjetas.
11. **CTA final / Contáctenos** — panel oscuro.
12. *(widget del motor FX, invisible)*.

## 7. Requisitos y marca
- **Elementor** (gratis) + tema compatible. Iconos: **Font Awesome** (incluido con Elementor).
- Tipografías **Hind Madurai / Nunito Sans / Share Tech Mono**: la plantilla las carga por Google Fonts;
  si tu sitio las bloquea, caen a fuentes del sistema.
- **Marca/legal (Ley 2345):** usa únicamente el logo oficial de la Gobernación de Nariño en sus colores
  aprobados; reemplaza el `// TODO` del logo SVG en `src/hero-embed.template.html`. No se crea logo "TIC".
