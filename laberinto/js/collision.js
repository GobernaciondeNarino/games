// Resolución de colisiones: detecta el suelo efectivo bajo el jugador
// (terreno o techo de muro) y lo empuja fuera de obstáculos laterales.

import * as THREE from 'three';
import { PLAYER_RADIUS } from './state.js?v=4';
import { obstacles, groundHeightAt } from './world.js?v=4';

export const collisionState = { currentFloorY: 0 };

export function resolveCollisions(player, playerInner) {
  const px = player.position.x;
  const pz = player.position.z;
  const playerY = playerInner ? playerInner.position.y : 0;

  // Paso 1: suelo efectivo (terreno o techo de muro)
  let newFloorY = groundHeightAt(px, pz);
  for (const obs of obstacles) {
    if (obs.type !== 'box' || !obs.topY) continue;
    const insideX = px > obs.minX && px < obs.maxX;
    const insideZ = pz > obs.minZ && pz < obs.maxZ;
    if (insideX && insideZ && playerY >= obs.topY - 0.05 && obs.topY > newFloorY) {
      newFloorY = obs.topY;
    }
  }
  collisionState.currentFloorY = newFloorY;

  // Paso 2: colisiones horizontales
  for (const obs of obstacles) {
    if (obs.type === 'circle') {
      const dx = player.position.x - obs.x;
      const dz = player.position.z - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = PLAYER_RADIUS + obs.radius;
      if (dist < minDist && dist > 0.0001) {
        const push = minDist - dist;
        player.position.x += (dx / dist) * push;
        player.position.z += (dz / dist) * push;
      }
    } else if (obs.type === 'box') {
      if (obs.topY && playerY >= obs.topY - 0.1) continue;
      const cx = THREE.MathUtils.clamp(player.position.x, obs.minX, obs.maxX);
      const cz = THREE.MathUtils.clamp(player.position.z, obs.minZ, obs.maxZ);
      const dx = player.position.x - cx;
      const dz = player.position.z - cz;
      const dist = Math.hypot(dx, dz);
      if (dist < PLAYER_RADIUS && dist > 0.0001) {
        const push = PLAYER_RADIUS - dist;
        player.position.x += (dx / dist) * push;
        player.position.z += (dz / dist) * push;
      } else if (dist <= 0.0001) {
        const dL = player.position.x - obs.minX;
        const dR = obs.maxX - player.position.x;
        const dN = player.position.z - obs.minZ;
        const dF = obs.maxZ - player.position.z;
        const minD = Math.min(dL, dR, dN, dF);
        if (minD === dL) player.position.x = obs.minX - PLAYER_RADIUS;
        else if (minD === dR) player.position.x = obs.maxX + PLAYER_RADIUS;
        else if (minD === dN) player.position.z = obs.minZ - PLAYER_RADIUS;
        else player.position.z = obs.maxZ + PLAYER_RADIUS;
      }
    }
  }
}
