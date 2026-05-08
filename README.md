# Ñaño 3D

Mini-juego web 3D con Three.js: la mascota **Ñaño** (robot turquesa) explora un escenario con lomas, escaleras y un **laberinto generado al azar en cada recarga**. Cámara orbital en tercera persona controlada por mouse.

## Controles

- **WASD / flechas** — moverse (relativo a la cámara)
- **Shift** — correr
- **Espacio** — saltar
- **Mouse arrastrar** — orbitar la cámara (yaw / pitch)
- **Rueda del mouse** — zoom

## Ejecutar

```bash
npm install      # instala three + vite y descarga RobotExpressive.glb
npm run dev      # http://localhost:5173
npm run build    # build de producción a dist/
```

## Stack

- [Three.js](https://threejs.org/) `r160`
- [Vite](https://vitejs.dev/) como dev server / bundler
- Modelo y animaciones: `RobotExpressive.glb` de los ejemplos oficiales de Three.js (Idle, Walking, Running, Jump). Re-pintado en runtime con la paleta verde/turquesa de Ñaño y un decal "ÑAÑO" en el pecho.

## Arquitectura (`src/`)

- `main.js` — bootstrap (escena, luces, loop), HUD de carga, ensamblaje de módulos.
- `terrain.js` — `PlaneGeometry` deformado por value-noise (FBM); zona autoría de escaleras; planicie del laberinto. `getHeightAt(x,z)` por muestreo bilineal.
- `maze.js` — generador recursive-backtracker (DFS); muros como `InstancedMesh` con AABBs para colisión circular contra el personaje.
- `character.js` — `GLTFLoader` + `AnimationMixer`; máquina de estados Idle/Walking/Running/Jump con `crossFadeTo`; tinte de materiales y `CanvasTexture` con "ÑAÑO".
- `controls.js` — teclado + mouse-drag (yaw/pitch acumulados, pitch acotado, zoom con rueda).
- `camera.js` — rig orbital tercera persona con cushion-raycast contra terreno y muros.
- `physics.js` — gravedad, salto, ground-snap por `getHeightAt`, step-up para escaleras, colisión circular contra muros del laberinto.

## Personalizar

- Para usar tu propio personaje rigged (p. ej. exportado de Mixamo en GLB con clips Idle/Walking/Running/Jump):
  1. Coloca el `.glb` en `public/models/`.
  2. Cambia la URL en `NanoCharacter.load()` (`src/character.js`).
  3. Si los clips tienen otros nombres, ajusta el `_setState` para que coincidan.
- Tamaño/forma del laberinto: parámetros `cols`, `rows`, `cellSize` en `src/maze.js`. Tamaño y relieve del terreno en `src/terrain.js` (`TERRAIN_SIZE`, `HEIGHT_SCALE`).

## Inspiración

- Demos de [SimonDev](https://simondev.io/demos/gamedev/) (octahedral imposters, character controllers).
- [Three.js Animation System](https://threejs.org/docs/#manual/en/introduction/Animation-system).
