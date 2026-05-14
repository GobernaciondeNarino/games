// Jugador: carga/precarga del GLB, construcción del avatar, física de salto
// y movimiento relativo a la cámara orbital.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CHARACTERS } from './levels.js';
import { state, GRAVITY, JUMP_VELOCITY } from './state.js';
import { getCameraYaw } from './camera.js';
import { resolveCollisions, collisionState } from './collision.js';

const gltfLoader = new GLTFLoader();
gltfLoader.crossOrigin = 'anonymous';

export let player = null;
export let playerInner = null;
let playerShadow = null;
let playerMixer = null;
const playerActions = {};

export const jumpState = { velocity: 0, isJumping: false };
export let isMoving = false;

// Joystick táctil (lo alimenta controls.js)
export const joystick = { active: false, dx: 0, dy: 0 };

const characterCache = {
  nino: { promise: null, gltf: null, error: null },
  nina: { promise: null, gltf: null, error: null }
};

export function preloadCharacters() {
  Object.keys(CHARACTERS).forEach(charId => {
    if (characterCache[charId].promise) return;
    characterCache[charId].promise = new Promise((resolve, reject) => {
      gltfLoader.load(
        CHARACTERS[charId].model,
        gltf => { characterCache[charId].gltf = gltf; resolve(gltf); },
        undefined,
        err => { characterCache[charId].error = err; reject(err); }
      );
    });
  });
}

export function loadCharacterGLB(charId, onProgress) {
  return new Promise((resolve, reject) => {
    if (characterCache[charId]?.gltf) {
      if (onProgress) onProgress({ lengthComputable: true, loaded: 1, total: 1 });
      resolve(characterCache[charId].gltf);
      return;
    }
    if (characterCache[charId]?.promise) {
      characterCache[charId].promise
        .then(gltf => {
          if (onProgress) onProgress({ lengthComputable: true, loaded: 1, total: 1 });
          resolve(gltf);
        })
        .catch(reject);
      return;
    }
    gltfLoader.load(
      CHARACTERS[charId].model,
      gltf => { characterCache[charId].gltf = gltf; resolve(gltf); },
      xhr => { if (onProgress) onProgress(xhr); },
      err => reject(err)
    );
  });
}

export function buildPlayerGLB(gltf) {
  const model = gltf.scene;

  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material && child.material.map) {
        child.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const targetHeight = 2.4;
  const scale = (size.y > 0) ? targetHeight / size.y : 1;

  model.position.set(-center.x, -box.min.y, -center.z);

  const inner = new THREE.Group();
  inner.add(model);
  inner.scale.setScalar(scale);
  inner.rotation.y = Math.PI;
  playerInner = inner;

  if (gltf.animations && gltf.animations.length > 0) {
    playerMixer = new THREE.AnimationMixer(model);
    const idleClip = gltf.animations.find(a => /idle|stand|wait|reposo|quieto/i.test(a.name)) || gltf.animations[0];
    const walkClip = gltf.animations.find(a => /walk|run|move|caminar|correr|andar/i.test(a.name));
    if (idleClip) {
      playerActions.idle = playerMixer.clipAction(idleClip);
      playerActions.idle.play();
    }
    if (walkClip && walkClip !== idleClip) {
      playerActions.walk = playerMixer.clipAction(walkClip);
      playerActions.walk.play();
      playerActions.walk.weight = 0;
    }
  }

  const group = new THREE.Group();
  group.add(inner);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);
  playerShadow = shadow;

  group.position.set(0, 0, 8);
  player = group;
  return group;
}

export function doJump() {
  if (state.playing && state.canMove && !jumpState.isJumping) {
    jumpState.isJumping = true;
    jumpState.velocity = JUMP_VELOCITY;
    if (navigator.vibrate) navigator.vibrate(25);
  }
}

const keys = {};
export function setKey(k, v) { keys[k] = v; }

// Actualiza al jugador cada frame. Devuelve true si llegó al portal.
export function updatePlayer(dt, bobTime, portal) {
  if (playerMixer) playerMixer.update(dt);
  if (!player) return false;

  resolveCollisions(player, playerInner);

  // Física de salto + ground snap
  if (playerInner) {
    const floorY = collisionState.currentFloorY;
    const onGround = playerInner.position.y <= floorY + 0.01;
    if (jumpState.isJumping || !onGround) {
      if (!jumpState.isJumping) {
        jumpState.isJumping = true;
        if (jumpState.velocity > 0) jumpState.velocity = 0;
      }
      jumpState.velocity -= GRAVITY * dt;
      playerInner.position.y += jumpState.velocity * dt;
      if (playerInner.position.y <= floorY) {
        playerInner.position.y = floorY;
        jumpState.isJumping = false;
        jumpState.velocity = 0;
      }
    } else {
      playerInner.position.y += (floorY - playerInner.position.y) * 0.25;
    }
    if (playerShadow) {
      const altOverFloor = playerInner.position.y - floorY;
      const f = THREE.MathUtils.clamp(1 - altOverFloor * 0.22, 0.45, 1);
      playerShadow.scale.setScalar(f);
      playerShadow.material.opacity = 0.35 * f;
      playerShadow.position.y = floorY + 0.03;
    }
  }

  let reachedPortal = false;

  if (state.playing && state.canMove) {
    const speed = 7;
    let fwd = 0, side = 0;
    if (keys['w'] || keys['arrowup'])    fwd += 1;
    if (keys['s'] || keys['arrowdown'])  fwd -= 1;
    if (keys['a'] || keys['arrowleft'])  side -= 1;
    if (keys['d'] || keys['arrowright']) side += 1;

    if (joystick.active) {
      const m = Math.hypot(joystick.dx, joystick.dy);
      if (m > 0.15) {
        side += joystick.dx;
        fwd -= joystick.dy;
      }
    }

    // Movimiento relativo a la cámara orbital
    const yaw = getCameraYaw();
    const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    let dx = forwardX * fwd + rightX * side;
    let dz = forwardZ * fwd + rightZ * side;

    isMoving = (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001);

    if (isMoving) {
      const len = Math.hypot(dx, dz);
      if (len > 1) { dx /= len; dz /= len; }
      player.position.x += dx * speed * dt;
      player.position.z += dz * speed * dt;
      player.position.x = THREE.MathUtils.clamp(player.position.x, -19, 19);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -24, 12);

      resolveCollisions(player, playerInner);

      const targetRot = Math.atan2(-dx, -dz);
      let diff = targetRot - player.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.rotation.y += diff * 0.18;

      if (!playerActions.walk && playerInner && !jumpState.isJumping) {
        const bob = Math.abs(Math.sin(bobTime * 9)) * 0.08;
        playerInner.position.y = collisionState.currentFloorY + bob;
      }
    }

    if (playerActions.idle && playerActions.walk) {
      const targetIdle = isMoving ? 0 : 1;
      const targetWalk = isMoving ? 1 : 0;
      playerActions.idle.weight += (targetIdle - playerActions.idle.weight) * 0.12;
      playerActions.walk.weight += (targetWalk - playerActions.walk.weight) * 0.12;
    }

    if (portal) {
      const distToPortal = player.position.distanceTo(portal.position);
      if (distToPortal < 2.5 && !state.questionOpen) reachedPortal = true;
    }
  }

  return reachedPortal;
}
