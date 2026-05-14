# Aventura Nariño v3 — Laberintos del territorio

Juego web 3D educativo (Three.js) sobre los lugares turísticos y los pueblos
ancestrales del departamento de Nariño. El jugador recorre 10 escenarios
detallados, atraviesa un laberinto generado al azar, recoge esmeraldas con
pistas y responde preguntas al llegar al portal de cada mundo.

Esta carpeta `/laberinto` es una versión **modular y enriquecida** del juego
original de un solo archivo HTML.

---

## ⚠️ IMPORTANTE: cómo publicar / verificar la subida

El juego usa **módulos ES** (`<script type="module">`). El navegador carga
cada archivo `.js` por separado: **si falta UN solo archivo, o uno está
desactualizado, el juego se queda en "Cargando el territorio nariñense…"**.

Si ves en la consola un error tipo
`does not provide an export named 'XXXX'`, significa que el servidor tiene
una versión **vieja** de ese archivo. Solución:

1. Sube **todos** los archivos de la lista de abajo, respetando las carpetas
   (`css/`, `js/`, `js/scenarios/`).
2. Borra la caché del navegador o recarga con **Ctrl + F5**.
3. Verifica que `js/state.js` contenga al final:
   ```js
   export const POINTS_PER_HINT = 2;
   export const POINTS_PER_CORRECT_ANSWER = 10;
   ```

### Archivos que deben existir en el servidor (26 en total)

```
laberinto/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── main.js          ← punto de entrada
    ├── state.js         ← estado global + constantes (POINTS_PER_*)
    ├── levels.js        ← datos de los 10 niveles, personajes y pistas
    ├── sky.js           ← domo de cielo con gradiente por nivel
    ├── world.js         ← escena, suelo, portal, animación de decoración
    ├── maze.js          ← generador de laberinto (DFS + verificación BFS)
    ├── emeralds.js      ← esmeraldas con pistas coleccionables
    ├── collision.js     ← colisiones y altura del terreno
    ├── camera.js        ← cámara orbital (mouse / rueda / pinch)
    ├── player.js        ← carga del GLB, salto y movimiento
    ├── controls.js      ← teclado + joystick táctil
    ├── hud.js           ← marcadores, toasts, preguntas, transiciones
    ├── game.js          ← flujo: preguntas, avance de nivel, victoria/derrota
    └── scenarios/
        ├── index.js     ← despachador de escenarios
        ├── common.js    ← primitivos compartidos (árboles, casitas, carteles…)
        ├── galeras.js   ← Volcán Galeras
        ├── cocha.js     ← Laguna de La Cocha
        ├── lajas.js     ← Santuario de Las Lajas
        ├── azufral.js   ← Laguna Verde del Azufral
        ├── cumbal.js    ← Volcán Nevado del Cumbal
        ├── carnaval.js  ← Carnaval de Negros y Blancos
        ├── awa.js       ← Selva del Pacífico (pueblo Awá)
        ├── nambi.js     ← Reserva Río Ñambí
        ├── tumaco.js    ← Tumaco
        └── pueblos.js   ← Pueblos Ancestrales
```

Los modelos 3D de los personajes (`nina.glb`, `nino-indigena.glb`) se cargan
desde `https://guaguas.narino.gov.co/wp-app/` — no es necesario subirlos
dentro de `/laberinto`.

---

## Cómo jugar

| Acción | Teclado / Mouse | Táctil |
|--------|-----------------|--------|
| Moverse | `W A S D` o flechas | Joystick virtual (abajo izquierda) |
| Saltar | `Espacio` | Botón ▲ (abajo derecha) |
| Girar la cámara alrededor del escenario | Arrastrar con el mouse | Arrastrar un dedo sobre la escena |
| Acercar / alejar (zoom) | Rueda del mouse | Pellizcar con dos dedos |
| Recentrar la cámara detrás del jugador | Tecla `C` | — |

Objetivo de cada mundo:
1. Encuentra la **entrada verdadera** del laberinto (hay 2 entradas, solo una
   lleva al portal; la otra es un callejón sin salida).
2. Recoge las **💎 esmeraldas** — cada una revela una pista del lugar y suma
   puntos.
3. Llega al **portal dorado** y responde la pregunta.
4. Acierta para avanzar; cada fallo cuesta una vida (3 vidas en total).

Puntuación: **+2** por esmeralda, **+10** por respuesta correcta.

---

## Mejoras de esta versión (v3)

- **Escenarios detallados**: cada sitio turístico tiene su propio módulo con
  elementos reconocibles — el cráter humeante de Galeras y el caserío de
  Pasto, el muelle y las lanchas de La Cocha, la basílica neogótica de Las
  Lajas sobre el cañón, las fumarolas del Azufral, los conos gemelos nevados
  del Cumbal, las carrozas monumentales del Carnaval, las chozas sobre
  pilotes del pueblo Awá, los colibríes de Río Ñambí, el arco del Morro y los
  palafitos de Tumaco, y el círculo de monolitos de los Pueblos Ancestrales.
- **Cámara orbital con mouse**: se puede girar libremente alrededor del
  escenario, hacer zoom y recentrar.
- **Movimiento relativo a la cámara**: el personaje avanza hacia donde mira
  la cámara, no en una dirección fija.
- **Brújula** en el HUD y **pantalla de transición animada** entre mundos.
- **Código modular** en `js/` (un archivo por responsabilidad) y CSS externo,
  más fácil de mantener que el HTML monolítico original.

---

## Historial de correcciones

- **Fix arranque**: `emeralds.js` y `game.js` importaban `POINTS_PER_HINT` /
  `POINTS_PER_CORRECT_ANSWER` desde `state.js`, pero estaban definidos en
  `levels.js`. Se movieron a `state.js` para que la cadena de módulos cargue.
- Se quitaron los `<link rel="preload">` de los GLB (generaban warnings de
  consola); la precarga real la hace `preloadCharacters()` en `player.js`.
- Limpieza de imports sin usar y del animador de agua.

---

## Stack

- [Three.js](https://threejs.org/) `r160` vía importmap (CDN unpkg) — sin
  paso de build, son archivos estáticos.
- Modelos GLB de los personajes guía de la Gobernación de Nariño.

Para desarrollo local basta con servir la carpeta con cualquier servidor
estático (por ejemplo `python3 -m http.server`) y abrir `/laberinto/`.
