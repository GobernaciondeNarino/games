# Assets — Prompts de generación

Estética común a TODOS los assets: HUD sobre **gris claro**, primario **azul neón** (#00A8FF),
limpio e institucional, mucho espacio negativo. **Sin texto, sin letras, sin números, sin logos,
sin UI legible, sin rostros, sin personas.** (No incrustar marcas: el logo oficial va aparte en el
HTML, según Ley 2345 de 2023).

Los archivos `hero-plate-globe-narino.png` y `hero-plate-hud-frame.png` de esta carpeta se generaron
con **Higgsfield → Nano Banana Pro** (16:9, 4K) usando los prompts A1/A2. El loop de video se genera
con **Higgsfield (image-to-video desde A1)** o el prompt de la sección B.

---

## A) Placas fijas 4K (poster + fallback de reduced-motion) — 3840×2160, 16:9

### A1 · `hero-plate-globe-narino.png`
> Clean futuristic HUD scene on a light pale-gray studio background with a faint technical grid; a
> luminous holographic globe on the right showing a glowing neon-blue outline of a mountainous
> Colombian department (Nariño) with small glowing point markers; thin neon-blue connector lines,
> corner brackets and crosshair marks framing the composition; airy, minimal, high-tech, trustworthy,
> government-grade; ultra-detailed, 4K, 16:9, no text, no logos.

### A2 · `hero-plate-hud-frame.png`
> Minimal light-gray tech interface background, subtle hexagon micro-pattern and hairline grid,
> neon-blue glowing accents, cut-corner panels, barcode strip and small data nodes, lots of negative
> space, premium public-sector data-room aesthetic, 4K, 16:9, no text, no logos.

**Uso en el componente**
- `A1` → `ASSETS.posterGlobe`: poster del `<video>` y fallback estático del globo (reduced-motion /
  sin WebGL) y del `<noscript>`.
- `A2` → `ASSETS.hudFrame`: textura opcional de fondo del marco HUD (no requerida; el marco principal
  es SVG/CSS vivo).

---

## B) Video ambiente Higgsfield (loop, opcional, detrás de la superficie clara)

Generar en https://higgsfield.ai/ (image-to-video desde la placa A1 para máxima consistencia, o
text-to-video). Aspecto **16:9**, ≥1080p (4K si es posible), **8–12 s en loop perfecto**, **sin audio**.

> Cinematic slow push through a clean light-gray futuristic HUD environment with a faint grid; a
> luminous holographic globe of a mountainous Colombian department rotates gently on the right, its
> neon-blue outline and point markers softly pulsing; thin neon-blue connector lines, drifting data
> nodes, corner brackets and scanlines shimmer subtly; airy, minimal, elegant, trustworthy
> government/fintech tone; seamless loop, no text, no logos, no people; 16:9, 4K,
> photoreal-meets-motion-graphics.

- Cámara: push-in muy lento + deriva suave; primer y último frame emparejados para el loop.
- Exportar `hero-loop.mp4` (H.264) **y** `hero-loop.webm`; usar `A1` como `poster`.
- En el componente: `ASSETS.loopMp4` / `ASSETS.loopWebm`. El video se muestra muy tenue
  (`opacity-25`, `mix-blend-luminosity`) y se desactiva con `prefers-reduced-motion`.

---

## Modelos sugeridos (Higgsfield MCP)
- Imagen 4K/diagramas: **`nano_banana_pro`** (`resolution: "4k"`, `aspect_ratio: "16:9"`).
- Video image-to-video: **`kling3_0_turbo`** (single start-frame) o **`seedance_2_0`**; subir A1 como
  `start_image`, prompt de la sección B, `aspect_ratio: "16:9"`.
- Upscale a 4K si hace falta: **`upscale_image`** / **`upscale_video`** (Higgsfield) o **Magnific**.
