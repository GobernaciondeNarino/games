# Ñaño 3D

Mini-juego web 3D con Three.js. La mascota **Ñaño** (robot bebé turquesa, estilo
chibi/Funko Pop) explora un mundo con lomas, escaleras y un **laberinto generado
al azar en cada recarga**. Recoge gemas brillantes para sumar puntos, juega en
la cancha de fútbol, visita la zona de tecnología y se cruza con otros robots
que deambulan libremente. Cámara orbital en tercera persona con el mouse.

## Despliegue en Plesk (sin terminal, sin instalación)

**Solo hay 2 archivos que subir** y el juego es 100 % estático (sin Node, npm,
ni paso de compilación):

```
nano/
├── index.html              ← TODO el código del juego está aquí dentro
└── vendor/
    └── three.module.js     ← la librería Three.js r160 (nunca cambia)
```

1. Sube la carpeta `nano/` completa a tu hosting (p. ej. `httpdocs/nano/`),
   conservando `vendor/three.module.js`.
2. Abre `https://tu-dominio/nano/` en el navegador.

**Por qué es a prueba de fallos:** todo el código del juego vive _dentro_ de
`index.html` (un único `<script type="module">`). El único recurso externo es
`vendor/three.module.js`, que es la librería y **nunca se modifica**. Así que no
existen archivos del juego que se puedan desincronizar entre sí: si actualizas
`index.html`, ya está todo actualizado.

> Si al abrirlo ves "No se pudo cargar vendor/three.module.js", falta subir la
> carpeta `vendor/`.
>
> Si tras actualizar sigues viendo la versión vieja, es la **caché del
> navegador**: recarga con `Ctrl + Shift + R` (o `Cmd + Shift + R`).

Requisitos del servidor (Plesk los cumple por defecto):
- Servir `.js` como `text/javascript` / `application/javascript`.
- No se requiere backend ni base de datos.

> Para probar en local: `python3 -m http.server` dentro de `nano/` y abrir
> `http://localhost:8000/`. (No funciona con `file://` por los módulos ES.)

## Controles

- **WASD / flechas** — moverse (relativo a la cámara)
- **Shift** — correr
- **Espacio** — saltar
- **Mouse arrastrar** — orbitar la cámara (yaw / pitch)
- **Rueda del mouse** — zoom

## Qué hay en el mundo

- **Ñaño** — robot chibi construido con primitivas (cabeza grande, antena,
  audífonos, camiseta "ÑAÑO", zapatillas). Animación procedural de idle, caminar,
  correr y saltar.
- **Laberinto** — recursive-backtracker, distinto en cada recarga, con muros
  sólidos.
- **Gemas brillantes** — esparcidas por el mundo y dentro del laberinto; al
  tocarlas suman puntos (HUD arriba a la derecha).
- **Cancha de fútbol** — fuera del laberinto, con líneas, arcos y un balón que
  Ñaño puede patear.
- **Zona de tecnología** — plaza con racks de servidores, una pantalla gigante
  y un anillo holográfico, todo con luces emisivas.
- **Robots NPC** — varios personajes de colores que caminan/corren a destinos
  aleatorios y chocan con el mundo, contigo y entre ellos.
- **Colisiones** — laberinto, árboles, rocas, arcos, props tecnológicos, NPCs y
  jugador comparten un mismo sistema de colisión.

## Estructura interna de `index.html`

El `<script type="module">` está dividido en secciones comentadas, en orden de
dependencia: `colliders` → `controls` → `physics` → `terrain` → `maze` →
`character` (Ñaño chibi + `ChibiRig`) → `npc` → `camera` → `collectibles` →
`zones` (fútbol + tecnología) → `main` (escena, luces, loop).

## Personalizar

Todo se edita dentro de `index.html`:

- **Colores de Ñaño:** la constante `NANO_COLORS`.
- **NPCs:** número en `new NPCManager(terrain, 9)` y paletas en `PALETTES`.
- **Gemas:** cantidad en `new Collectibles(terrain, 64)` y valor en `value: 10`.
- **Laberinto:** `cols`, `rows` en la clase `Maze`.
- **Zonas:** `MAZE_REGION`, `SOCCER_REGION`, `TECH_REGION`.

## Inspiración

- Demos de [SimonDev](https://simondev.io/demos/gamedev/).
- Spec del personaje: `../nano-toy.md`.
