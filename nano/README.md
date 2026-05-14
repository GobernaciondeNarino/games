# Ñaño 3D

Mini-juego web 3D con Three.js: la mascota **Ñaño** (robot turquesa) explora un
escenario con lomas, escaleras y un **laberinto generado al azar en cada
recarga**. Cámara orbital en tercera persona controlada con el mouse.

## Despliegue en Plesk (sin terminal, sin instalación)

Este proyecto es **100 % estático y "buildless"**: no necesita Node, ni npm, ni
paso de compilación. Three.js está incluido localmente en `vendor/`.

1. Sube **toda la carpeta `nano/`** a tu hosting (por ejemplo a
   `httpdocs/nano/` en Plesk).
2. Abre `https://tu-dominio/nano/` en el navegador. Listo.

Requisitos del servidor (Plesk los cumple por defecto):
- Servir archivos `.js` con tipo `text/javascript` / `application/javascript`.
- Servir `.glb` como binario (cualquier `Content-Type` sirve; se descarga como
  `arraybuffer`).
- No se requiere ningún backend ni base de datos.

> Para probar en local sin Plesk basta cualquier servidor estático, p. ej.
> `python3 -m http.server` dentro de `nano/` y abrir `http://localhost:8000/`.
> (No funciona con `file://` por las restricciones de los módulos ES.)

## Controles

- **WASD / flechas** — moverse (relativo a la cámara)
- **Shift** — correr
- **Espacio** — saltar
- **Mouse arrastrar** — orbitar la cámara (yaw / pitch)
- **Rueda del mouse** — zoom

## Estructura

```
nano/
├── index.html              # importmap → vendor/, arranca src/main.js
├── src/
│   ├── main.js             # escena, luces, loop, suavizado de movimiento
│   ├── terrain.js          # heightmap value-noise + escaleras + getHeightAt
│   ├── maze.js             # laberinto recursive-backtracker + colisión
│   ├── character.js        # GLTF + AnimationMixer + branding "ÑAÑO"
│   ├── controls.js         # teclado + mouse drag
│   ├── camera.js           # rig orbital tercera persona
│   └── physics.js          # gravedad, salto, ground-snap, step-up
├── vendor/                 # Three.js r160 incluido (sin CDN)
│   ├── three.module.js
│   └── addons/
│       ├── loaders/GLTFLoader.js
│       └── utils/BufferGeometryUtils.js
└── models/
    └── RobotExpressive.glb # personaje + animaciones (ejemplo oficial three.js)
```

## Movimiento fluido

- Velocidad horizontal con **aceleración/desaceleración** suave (arranques y
  frenados sin saltos) — ver constantes `ACCEL` / `DECEL` en `src/main.js`.
- La velocidad de reproducción de las animaciones **Walking/Running** se ajusta
  a la velocidad real del personaje para evitar el "patinaje" de pies.
- Crossfades con *warping* entre caminar y correr para mantener la cadencia.
- `Jump` es `LoopOnce` con `clampWhenFinished`; rotación del modelo interpolada
  hacia la dirección de avance.

## Personalizar

- **Personaje propio:** coloca tu `.glb` rigged (clips `Idle`, `Walking`,
  `Running`, `Jump`) en `models/` y cambia la ruta en `NanoCharacter.load()`
  (`src/character.js`). Si los clips tienen otros nombres, ajusta `_setState`.
- **Laberinto:** parámetros `cols`, `rows`, `cellSize` en `src/maze.js`.
- **Terreno:** `TERRAIN_SIZE`, `HEIGHT_SCALE` y la zona de escaleras en
  `src/terrain.js`.

## Inspiración

- Demos de [SimonDev](https://simondev.io/demos/gamedev/).
- [Three.js Animation System](https://threejs.org/docs/#manual/en/introduction/Animation-system).
