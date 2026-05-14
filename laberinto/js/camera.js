// Cámara de tercera persona.
// Modo orbital (opcional, se activa con el interruptor de la pantalla inicial):
//   - Mouse arrastrar: gira alrededor del escenario
//   - Rueda: zoom · En táctil: un dedo orbita, dos dedos hacen pinch-zoom
//   - Tecla C: recentra la cámara
// Modo fijo (por defecto): cámara de seguimiento estable detrás del jugador,
// el mouse no afecta la cámara.

import * as THREE from 'three';

export let camera;

// La cámara orbital con mouse arranca DESHABILITADA por defecto.
let orbitEnabled = false;

const DEFAULT_YAW = 0;
const DEFAULT_PITCH = 0.42;
const DEFAULT_DIST = 14;

const orbit = {
  yaw: DEFAULT_YAW,
  pitch: DEFAULT_PITCH,
  distance: DEFAULT_DIST,
  minPitch: 0.08,
  maxPitch: 1.30,
  minDist: 6,
  maxDist: 30,
  target: new THREE.Vector3(0, 1.4, 0),
  desiredYaw: DEFAULT_YAW,
  desiredPitch: DEFAULT_PITCH,
  desiredDist: DEFAULT_DIST
};

const ROT_SENS = 0.005;
const ZOOM_SENS = 0.0018;

let canvasEl = null;
const pointers = new Map();
let lastPinchDist = 0;

export function initCamera(canvas) {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 9, 16);
  camera.lookAt(0, 1.4, 0);
  canvasEl = canvas;

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  applyCursor();
  return camera;
}

// Activa o desactiva la cámara orbital con mouse.
export function setOrbitEnabled(enabled) {
  orbitEnabled = !!enabled;
  if (!orbitEnabled) {
    // Volver a la vista fija estable
    pointers.clear();
    lastPinchDist = 0;
    orbit.desiredYaw = DEFAULT_YAW;
    orbit.desiredPitch = DEFAULT_PITCH;
    orbit.desiredDist = DEFAULT_DIST;
  }
  applyCursor();
}

export function isOrbitEnabled() {
  return orbitEnabled;
}

function applyCursor() {
  if (!canvasEl) return;
  canvasEl.style.cursor = orbitEnabled ? 'grab' : 'default';
  if (!orbitEnabled) canvasEl.classList.remove('grabbing');
}

function onPointerDown(e) {
  if (!orbitEnabled) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvasEl.classList.add('grabbing');
  try { canvasEl.setPointerCapture(e.pointerId); } catch (_) {}
}

function onPointerMove(e) {
  if (!orbitEnabled) return;
  const prev = pointers.get(e.pointerId);
  if (!prev) return;

  if (pointers.size >= 2) {
    // Pinch zoom con dos dedos
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.values()];
    const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (lastPinchDist > 0) {
      orbit.desiredDist = THREE.MathUtils.clamp(
        orbit.desiredDist - (d - lastPinchDist) * 0.04,
        orbit.minDist, orbit.maxDist
      );
    }
    lastPinchDist = d;
    return;
  }

  // Un puntero: orbitar
  const dx = e.clientX - prev.x;
  const dy = e.clientY - prev.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  orbit.desiredYaw -= dx * ROT_SENS;
  orbit.desiredPitch = THREE.MathUtils.clamp(
    orbit.desiredPitch + dy * ROT_SENS,
    orbit.minPitch, orbit.maxPitch
  );
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) lastPinchDist = 0;
  if (pointers.size === 0 && canvasEl) canvasEl.classList.remove('grabbing');
}

function onWheel(e) {
  if (!orbitEnabled) return;
  e.preventDefault();
  orbit.desiredDist = THREE.MathUtils.clamp(
    orbit.desiredDist + e.deltaY * ZOOM_SENS * orbit.desiredDist,
    orbit.minDist, orbit.maxDist
  );
}

// Yaw de cámara para que el movimiento WASD/joystick sea relativo a la vista.
export function getCameraYaw() {
  return orbit.yaw;
}

// Recentra la cámara detrás del jugador (solo tiene efecto en modo orbital).
export function recenterCamera(player) {
  if (!orbitEnabled) return;
  if (player) orbit.desiredYaw = player.rotation.y;
  orbit.desiredPitch = DEFAULT_PITCH;
  orbit.desiredDist = DEFAULT_DIST;
}

export function updateCamera(player) {
  if (!player) return;

  // En modo fijo, mantener la cámara anclada a los valores por defecto.
  if (!orbitEnabled) {
    orbit.desiredYaw = DEFAULT_YAW;
    orbit.desiredPitch = DEFAULT_PITCH;
    orbit.desiredDist = DEFAULT_DIST;
  }

  // Suavizado de los valores orbitales
  orbit.yaw += (orbit.desiredYaw - orbit.yaw) * 0.18;
  orbit.pitch += (orbit.desiredPitch - orbit.pitch) * 0.18;
  orbit.distance += (orbit.desiredDist - orbit.distance) * 0.12;

  // El objetivo sigue suavemente al jugador
  orbit.target.x += (player.position.x - orbit.target.x) * 0.15;
  orbit.target.y += (player.position.y + 1.4 - orbit.target.y) * 0.15;
  orbit.target.z += (player.position.z - orbit.target.z) * 0.15;

  const horiz = Math.cos(orbit.pitch) * orbit.distance;
  const cx = orbit.target.x + Math.sin(orbit.yaw) * horiz;
  const cz = orbit.target.z + Math.cos(orbit.yaw) * horiz;
  const cy = orbit.target.y + Math.sin(orbit.pitch) * orbit.distance;

  camera.position.set(cx, cy, cz);
  camera.lookAt(orbit.target);
}

// Actualiza la aguja de la brújula del HUD según el yaw de la cámara.
export function updateCompass() {
  const needle = document.getElementById('compass-needle');
  if (needle) needle.style.transform = `rotate(${orbit.yaw}rad)`;
}
