# Ñaño 3D

Mini-juego web 3D con Three.js. La mascota **Ñaño** (robot bebé turquesa, estilo
chibi/Funko Pop) explora un mundo con lomas, escaleras y un **laberinto generado
al azar en cada recarga**. Recoge gemas brillantes para sumar puntos, juega en
la cancha de fútbol, visita la zona de tecnología y se cruza con otros robots
que deambulan libremente. Cámara orbital en tercera persona con el mouse.

## Despliegue en Plesk (sin terminal, sin instalación)

Proyecto **100 % estático y "buildless"**: no necesita Node, npm ni paso de
compilación. Todo —incluido Three.js— se sube tal cual. El personaje y todo el
escenario se construyen con primitivas de Three.js, **sin modelos externos**.

1. Sube **toda la carpeta `nano/`** a tu hosting (p. ej. `httpdocs/nano/`).
2. Abre `https://tu-dominio/nano/` en el navegador. Listo.

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
  jugador comparten un mismo sistema de colisión (`colliders.js`).

## Estructura

```
nano/
├── index.html              # importmap → vendor/three.module.js, HUD, arranca src/main.js
├── src/
│   ├── main.js             # escena, luces, loop, suavizado de movimiento, HUD
│   ├── terrain.js          # heightmap value-noise + escaleras + zonas planas
│   ├── maze.js             # laberinto recursive-backtracker
│   ├── character.js        # Ñaño chibi con primitivas + ChibiRig (animación)
│   ├── npc.js              # robots NPC con IA de deambulación + colisión
│   ├── collectibles.js     # gemas brillantes + lógica de puntaje
│   ├── zones.js            # cancha de fútbol + plaza tecnológica
│   ├── colliders.js        # mundo de colisión compartido (AABB + círculos)
│   ├── controls.js         # teclado + mouse drag
│   ├── camera.js           # rig orbital 3ª persona (anti-zoom + clamp de suelo)
│   └── physics.js          # gravedad, salto, ground-snap, step-up, colisión
└── vendor/
    └── three.module.js     # Three.js r160 (sin CDN)
```

## Movimiento fluido

- Velocidad horizontal con **aceleración/desaceleración** suave (`ACCEL`/`DECEL`
  en `src/main.js`).
- Animación del personaje 100 % procedural en `ChibiRig` (`character.js`):
  cadencia de pasos ligada a la velocidad real, balanceo de brazos y piernas,
  rebote del cuerpo, inclinación al correr, encogido en el salto, respiración y
  oscilación de antena en idle.
- La cámara hace *pull-in* rápido y *ease-out* lento ante obstáculos para evitar
  el "zoom raro" en pasillos, y nunca baja del nivel del suelo.

## Personalizar

- **Colores de Ñaño:** `NANO_COLORS` en `src/character.js`.
- **NPCs:** número y paletas en `src/npc.js` (`NPCManager`, `PALETTES`).
- **Gemas:** cantidad y valor en `src/collectibles.js`.
- **Laberinto:** `cols`, `rows` en `src/maze.js`.
- **Zonas:** `MAZE_REGION`, `SOCCER_REGION`, `TECH_REGION` en `src/terrain.js`.

## Inspiración

- Demos de [SimonDev](https://simondev.io/demos/gamedev/).
- Spec del personaje: `../nano-toy.md`.
