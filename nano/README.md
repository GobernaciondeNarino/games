# Ñaño 3D

Mini-juego web 3D con Three.js. La mascota **Ñaño** (robot turquesa estilo
chibi/Funko Pop: cabeza grande redondeada, antena, audífonos, torso-caja con
"ÑAÑO" y zapatillas) explora un mundo con lomas, escaleras y un **laberinto
generado al azar en cada recarga**. Recoge gemas brillantes para sumar puntos,
mete goles en la cancha de fútbol, visita la zona de tecnología y se cruza con
figuras encapuchadas que deambulan libremente. Cámara orbital en tercera
persona con el mouse.

## Estructura del proyecto

El juego es 100 % estático (sin Node, npm ni paso de compilación). Está
organizado en carpetas:

```
nano/
├── index.html              ← cáscara HTML (enlaza el CSS y el JS)
├── css/
│   └── style.css           ← estilos de la interfaz (HUD, marcador, pantalla de carga)
├── js/
│   └── main.js             ← TODO el código del juego (módulo ES nativo)
└── vendor/
    └── three.module.js     ← la librería Three.js r160 (nunca cambia)
```

`index.html` carga `css/style.css` y `js/main.js`; `js/main.js` importa la
librería desde `../vendor/three.module.js`.

## Despliegue en Plesk (sin terminal, sin instalación)

1. Sube la carpeta `nano/` **completa** a tu hosting (p. ej. `httpdocs/nano/`),
   conservando las carpetas `css/`, `js/` y `vendor/` tal cual.
2. Abre `https://tu-dominio/nano/` en el navegador.

> **Importante:** deben subirse las cuatro piezas (`index.html`, `css/`, `js/`
> y `vendor/`). Si falta alguna, el juego no carga.
>
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

- **Ñaño** — robot chibi construido con primitivas: cabeza grande y redondeada
  con ojos planos, boca sonriente, antena y audífonos; torso-caja blanco con
  "ÑAÑO" impreso; **brazos y piernas robóticos articulados** (rótulas de
  hombro, codo, cadera y rodilla) con manos de dedos y zapatillas deportivas.
  Animación procedural de idle, caminar, correr y saltar.
- **Laberinto** — recursive-backtracker, distinto en cada recarga, con muros
  sólidos.
- **Gemas brillantes** — esparcidas por el mundo y dentro del laberinto; al
  tocarlas suman puntos (HUD arriba a la derecha).
- **Cancha de fútbol** — con líneas, áreas penales, arcos y un balón en el
  centro a la altura de la rodilla. Si Ñaño lo patea dentro del arco, **suma un
  gol** (100 puntos) y el balón vuelve al centro.
- **Zona de tecnología** — plaza con racks de servidores, una pantalla gigante
  y un anillo holográfico, todo con luces emisivas.
- **NPC encapuchados** — figuras tipo "guardián" con capa, capucha de visor
  brillante, anillos de luz y cables luminosos; flotan y deambulan a destinos
  aleatorios chocando con el mundo, contigo y entre ellos.
- **Colisiones** — laberinto, árboles, rocas, arcos, props tecnológicos, NPCs y
  jugador comparten un mismo sistema de colisión.

## Estructura interna de `js/main.js`

El módulo está dividido en secciones comentadas, en orden de dependencia:
`colliders` → `controls` → `physics` → `terrain` → `maze` → `character`
(Ñaño + `ChibiRig`) → `npc` (figura encapuchada + `CloakedRig`) → `camera` →
`collectibles` → `zones` (fútbol + tecnología) → `main` (escena, luces, loop).

## Personalizar

Todo se edita dentro de `js/main.js`:

- **Colores de Ñaño:** la constante `NANO_COLORS`.
- **NPCs:** número en `new NPCManager(terrain, 9)` y paletas en `CLOAK_PALETTES`.
- **Gemas:** cantidad en `new Collectibles(terrain, 64)` y valor en `value: 10`.
- **Laberinto:** `cols`, `rows` en la clase `Maze`.
- **Zonas:** `MAZE_REGION`, `SOCCER_REGION`, `TECH_REGION`.

La interfaz (HUD, marcador, pantalla de carga) se edita en `css/style.css`.

## Inspiración

- Demos de [SimonDev](https://simondev.io/demos/gamedev/).
- Estructura de sitio estático: [kodeclubs.com](https://www.kodeclubs.com/).
