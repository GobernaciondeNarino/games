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

### Cache-busting (`?v=N`)

Para evitar que el navegador o el servidor sirvan archivos viejos en caché,
**todos los imports llevan un parámetro de versión** `?v=4`
(p. ej. `import ... from './state.js?v=4'`) y lo mismo `index.html` con
`main.js?v=4` y `styles.css?v=4`.

> **Cada vez que modifiques los archivos JS/CSS, sube el número de versión
> en TODOS los archivos a la vez** (`?v=4` → `?v=5`, etc.). Así el navegador
> está obligado a descargar la versión nueva. El número debe ser el mismo en
> todos los archivos para que los módulos compartan una sola instancia.

### Si aún ves un error de módulo

Si en la consola aparece `does not provide an export named 'XXXX'`, el
servidor tiene una versión vieja de ese archivo. Solución:

1. Sube **todos** los archivos de la lista de abajo, respetando las carpetas
   (`css/`, `js/`, `js/scenarios/`).
2. Sube el número `?v=N` o borra la caché del navegador (**Ctrl + F5**).
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

En la pantalla inicial hay un interruptor **"Cámara orbital con mouse"**:

- **Desactivado (por defecto)**: cámara fija de seguimiento. El mouse no afecta
  la cámara — más cómodo y estable para la mayoría de jugadores.
- **Activado**: permite girar libremente el escenario con el mouse.

| Acción | Teclado / Mouse | Táctil |
|--------|-----------------|--------|
| Moverse | `W A S D` o flechas | Joystick virtual (abajo izquierda) |
| Saltar | `Espacio` | Botón ▲ (abajo derecha) |
| Girar la cámara *(solo si la orbital está activada)* | Arrastrar con el mouse | Arrastrar un dedo sobre la escena |
| Acercar / alejar — zoom *(solo orbital)* | Rueda del mouse | Pellizcar con dos dedos |
| Recentrar la cámara *(solo orbital)* | Tecla `C` | — |

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
- **Cámara orbital con mouse opcional**: interruptor en la pantalla inicial
  para activarla/desactivarla; permite girar el escenario, hacer zoom y
  recentrar. Desactivada por defecto.
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
- **Cache-busting `?v=N`**: todos los imports y los enlaces de `index.html`
  llevan versión, para que el navegador/servidor no sirvan archivos viejos
  en caché (causa de que el error de `state.js` persistiera tras subir el fix).
- **Cámara orbital opcional**: ahora arranca desactivada; interruptor en la
  pantalla inicial para activarla cuando se quiera.
- Se quitaron los `<link rel="preload">` de los GLB (generaban warnings de
  consola); la precarga real la hace `preloadCharacters()` en `player.js`.
- Detector de fallo de carga en `index.html`: si los módulos no arrancan,
  muestra un mensaje claro en vez del spinner infinito.
- Limpieza de imports sin usar y del animador de agua.

---

## Stack

- [Three.js](https://threejs.org/) `r160` vía importmap (CDN unpkg) — sin
  paso de build, son archivos estáticos.
- Modelos GLB de los personajes guía de la Gobernación de Nariño.

Para desarrollo local basta con servir la carpeta con cualquier servidor
estático (por ejemplo `python3 -m http.server`) y abrir `/laberinto/`.
