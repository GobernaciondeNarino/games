# HUD Hero / Banner — Secretaría TIC, Innovación y Gobierno Abierto
### Gobernación de Nariño · `tic.narino.gov.co`

Banner interactivo de tipo **HUD / data-room** sobre fondo **gris claro** con primario **azul neón**,
y un **globo 3D real (three.js)** del departamento de Nariño que gira en reposo, reacciona al mouse y
**hace zoom al departamento con el scroll**, encendiendo progresivamente sus **64 municipios**.

- **Stack:** React + Tailwind CSS + lucide-react + **three.js** (globo 3D) + anime.js (animación de texto/HUD).
- **Accesibilidad:** WCAG 2.1 AA / Resolución 1519 de 2020 (Anexo 1).
- **Marca/legal:** Ley 2345 de 2023 ("Chao Marcas") y Decreto 2106/2019 art. 14 — un único logo oficial
  (Gobernación de Nariño) en sus colores aprobados; **no** se crea ni recolorea un logo "TIC".
- **Idioma:** todo el contenido visible en español; `lang="es"`.

---

## 1. Estructura de archivos

```
Landing/
├── App.jsx                  # Componente único (el entregable): HUD + globo 3D
├── index.html               # HTML de Vite (incluye fallback <noscript>)
├── src/
│   ├── main.jsx             # Punto de montaje de React
│   └── index.css            # Tailwind + tipografías (Hind Madurai, Nunito Sans, Share Tech Mono)
├── assets/                  # Vite sirve esta carpeta en la raíz web (publicDir)
│   ├── PROMPTS.md           # Prompts de imagen + video (Higgsfield)
│   ├── hero-plate-globe-narino.jpg     # Poster web (~96 KB) — fallback reduced-motion / no-WebGL
│   ├── hero-plate-globe-narino-4k.png  # Placa 4K (3840×2160+) — entregable
│   ├── hero-plate-hud-frame.jpg        # Textura HUD opcional (web)
│   ├── hero-plate-hud-frame-4k.png     # Placa 4K HUD — entregable
│   ├── hero-loop.mp4/.webm  # (Opcional) video ambiente en loop — ver PROMPTS.md
│   ├── textures/
│   │   └── earth-blue-marble.jpg       # Textura Tierra (Blue Marble) — bundle local (offline-safe)
│   └── data/
│       ├── narino-municipios.geojson   # 64 municipios OFICIALES (centroides + nombres) + contorno
│       └── narino-outline.json         # Contorno REAL del departamento (líneas oficiales)
├── fallback/
│   └── index.html           # Versión vanilla-JS por CDN (sin build) para Plesk/estático
├── package.json · vite.config.js · tailwind.config.js · postcss.config.js
└── README.md
```

---

## 2. Ejecutar y previsualizar (Vite)

```bash
cd Landing
npm install
npm run dev        # http://localhost:5173  (desarrollo con HMR)
npm run build      # genera dist/ (bundle de producción)
npm run preview    # sirve dist/ localmente
```

> **Tip de prueba del scroll:** el zoom al departamento se controla con el **scroll de la página**.
> En la demo, baja la página para ver cómo el globo gira hacia Nariño, la cámara hace dolly y los
> municipios se encienden. La barra `EXPLORANDO // NARIÑO 000–100%` refleja ese progreso.

---

## 3. Personalización rápida

Todo está en constantes al inicio de `App.jsx`:

| Constante | Para qué |
|---|---|
| `COPY` | Titular (`h1`), subtítulo, CTAs, teléfono, enlaces de navegación. **Edita el texto aquí.** |
| `MEDIA_BASE` | Prefijo de rutas de medios. Vacío = raíz. En WordPress/Plesk apúntalo a tu carpeta de subidas. |
| `ASSETS` | Rutas de poster/video. |
| `GEOJSON_URL` | Ruta del GeoJSON municipal (ver §5). |
| `NEON` | Intensidad del neón del globo/HUD: `0.6` suave → `1.4` intenso (default `1.0`). |
| `LOGO_GOBERNACION` | Logo oficial horizontal (ver §4). |

**Tokens de color** (en el `<style>` de `HudStyles`, espejo de los del brief):
`--bg-base #E7EBEE`, `--neon #00A8FF`, `--neon-text #0059B3` (único azul permitido para texto),
`--ink #0A2540`, `--gn-navy #003366` (botón de accesibilidad), etc.

> **Regla de contraste (no negociable):** el azul neón `--neon` **no** se usa para texto sobre el
> fondo claro (no pasa contraste). Para enlaces azules usa `--neon-text` (#0059B3 ≈ 5.2:1). El CTA
> primario se rellena con `--neon-deep` (#0066CC) + texto blanco (≈ 5.2:1) y un *glow* neón — así
> luce "neón" y **pasa AA**. (white sobre #00A8FF ≈ 2.6:1 → reprueba; por eso no se usa).

---

## 4. Logo oficial (Ley 2345)

Existe **una sola** marca oficial: el logo de la **Gobernación de Nariño**. La dependencia se
representa como **logo oficial + texto** `Secretaría TIC, Innovación y Gobierno Abierto`
(Hind Madurai Medium ~16px, `#4D4D4D`). **Nunca** rotar, distorsionar, recolorear ni crear un logo "TIC".

1. Coloca el SVG horizontal oficial y reemplaza la constante:
   ```js
   const LOGO_GOBERNACION = '/ruta/al/logo-gobernacion-horizontal.svg';
   // (busca el comentario "TODO: replace with official SVG horizontal logo")
   ```
2. El logo **GOV.CO** del header ya apunta al SVG oficial provisto por el sitio.

---

## 5. El globo 3D (Tierra real) y el GeoJSON de Nariño

El globo es una **Tierra 3D real en WebGL (three.js)**, NO una imagen. Porta la técnica del repositorio
oficial **`GobernaciondeNarino/suite-oni`** (`assets/js/globo.js`):

- **Esfera con textura Blue Marble** (mapa real de la Tierra), `MeshPhongMaterial` con relieve/especular;
  carga en cascada **local → CDN → fallback procedimental** (si no hay red, dibuja continentes en canvas).
- **Atmósfera fresnel** (rim glow azul), **retícula HUD** giratoria y lectura de coordenadas.
- **Contorno REAL del departamento** (`narino-outline.json`, líneas oficiales) → neón que se enciende con el scroll.
- **64 municipios OFICIALES** como puntos con *glow* (`narino-municipios.geojson`: nombres `MPIO_CNMBR` +
  centroides `LATITUD`/`LONGITUD`), encendido progresivo desde el centro.
- **Marcador de Nariño** sobre la capital (Pasto) con núcleo + onda expansiva.
- **Comportamiento:** giro en reposo, *parallax*/arrastre con el mouse, *hover* con tooltip del municipio,
  y **zoom cinemático al departamento con el scroll** (sin secuestrar el scroll nativo).

> Los datos (`narino-municipios.geojson`, `narino-outline.json`) y la textura `earth-blue-marble.jpg`
> provienen del repositorio institucional **suite-oni** (DANE/IGAC) y vienen **empacados localmente**:
> el globo funciona sin red. Las capas extra de realismo (especular/relieve) se intentan por CDN y
> **fallan en silencio** si no hay conexión.

**Coordenadas/convención:** se usa exactamente la misma función `latLngAVector3` de suite-oni, así que
los puntos calzan con la textura y con su implementación. Para actualizar el dato oficial, reemplaza
`assets/data/narino-municipios.geojson` (esquema: `properties.kind==="municipio"`, `properties.name`,
`geometry Point`) y `assets/data/narino-outline.json` (array de polilíneas `[[lon,lat],…]`). Los
generadores están documentados en los scripts de build (Natural Earth / suite-oni).

---

## 6. Accesibilidad y cumplimiento

- Skip link `Ir al contenido`; landmarks `<header>/<nav aria-label="Principal">/<main>`; un solo `<h1>`.
- Contraste AA en todo el texto; azul neón nunca como texto sobre fondo claro.
- Operable por teclado; foco visible; **focus-trap** y `Esc` en el menú móvil; `aria-expanded`/`aria-controls`.
- `prefers-reduced-motion`: el globo se muestra **estático** (poster 4K, sin autorrotación ni scroll-motion);
  se desactivan scanline, pulsos y stagger.
- Canvas del globo y marco HUD son `aria-hidden`; hay **texto-equivalente** (`sr-only`) + el tag real
  `NARIÑO // 64 MUNICIPIOS`.
- Responsive 320px→desktop; el globo **se apila arriba** en móvil; sin scroll horizontal; sin widgets flotantes.
- El botón de accesibilidad es un placeholder: `// TODO: integrar widget de accesibilidad`.

---

## 7. Embeber en WordPress + Elementor + Astra

El componente está pensado para **bundlearse** y luego embeberse:

1. **Build:** `npm run build` → genera `dist/assets/*.js` y `*.css`.
2. Sube `dist/assets/*` y la carpeta `assets/` (placas, video y `data/`) a tu hosting
   (p. ej. `/wp-content/uploads/2026/06/tic-hero/`). Ajusta `MEDIA_BASE` en `App.jsx` antes del build
   para que apunte a esa carpeta (o usa rutas absolutas).
3. En Elementor, agrega un widget **HTML personalizado** donde quieras el banner:
   ```html
   <div id="tic-hero-root"></div>
   <link rel="stylesheet" href="/wp-content/uploads/2026/06/tic-hero/index.css">
   <script type="module" src="/wp-content/uploads/2026/06/tic-hero/index.js"></script>
   ```
   En `src/main.jsx` cambia el id de montaje a `tic-hero-root` (o crea un shortcode que imprima ese div).
4. **Astra:** usa una plantilla de página en blanco (sin contenedor/título) para el banner a ancho completo,
   o coloca el widget HTML en una sección *full-width*. El componente ya es `min-h-screen` + `overflow-hidden`.

> Alternativa shortcode: registra `[tic_hero]` que imprima el `<div id="tic-hero-root">` + el `<script>`;
> así el equipo de contenido lo inserta sin tocar HTML.

---

## 8. Fallback vanilla-JS / CDN (Plesk estático, sin build)

`fallback/index.html` es una versión **autónoma sin build**: carga `three.js` y `anime.js` por **CDN**
(import-map) y dibuja el **mismo globo 3D real** (costas + contorno de Nariño + municipios + zoom por scroll).

- Subir a Plesk: copia la carpeta `Landing/` (o al menos `fallback/index.html` + `assets/`) y abre
  `fallback/index.html`. Ajusta `DATA_BASE` y `POSTER` al inicio del `<script>` si cambias las rutas.
- Útil cuando no hay paso de compilación (Node) en el servidor.

---

## 9. Assets generados

- `hero-plate-globe-narino-4k.png` y `hero-plate-hud-frame-4k.png`: placas 4K generadas con
  **Higgsfield (Nano Banana Pro, 16:9, 4K)**. Versiones web `.jpg` para poster/fallback.
- `hero-loop.mp4/.webm`: video ambiente opcional. Si no está, el `<video>` se oculta solo (no rompe nada).
  Genera el loop con **Higgsfield** (image-to-video desde la placa del globo) — prompt en `assets/PROMPTS.md`.
- Todos los assets: estética HUD gris claro / neón, **sin texto, sin logos, sin rostros**
  (el logo oficial va aparte en el HTML, por Ley 2345).

---

## 10. Notas

- Tipografías por Google Fonts con `font-display:swap` (Hind Madurai, Nunito Sans, Share Tech Mono).
- `Share Tech Mono` se usa **solo** para micro-tags decorativos del HUD (coords, STATUS, barcodes), nunca
  para contenido real.
- Sin colores/eslóganes/imágenes de partidos o campañas.
- El video ambiente y la animación se desactivan con `prefers-reduced-motion`; nunca se secuestra el scroll nativo.

---

## 11. Plantilla de Elementor lista para importar (`plantillas/`)

Para usar la landing **sin compilar nada**, la carpeta [`plantillas/`](./plantillas/) trae una
**plantilla de página de Elementor** (`plantilla-tic-landing.json`, contenedores Flexbox, `version 0.4`)
que recrea **hero con globo 3D + 12 secciones** de ejemplo.

- Los **visuales de sección no son imágenes estáticas**: son **elementos animados con three.js**
  (`<div class="tic-fx" data-fx="network|particles|terrain|rings|hexspin">`) montados por un motor FX,
  para el aspecto cyber/HUD. El hero es el mismo globo 3D de Nariño.
- Importa el `.json` en *Elementor → Plantillas → Importar*; sube `plantillas/media/` a tu WordPress.
- Reproducible: `cd plantillas/src && node build-template.cjs`.
- Detalle completo en [`plantillas/README.md`](./plantillas/README.md).
