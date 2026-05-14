// Esmeraldas con pistas: gemas coleccionables en las esquinas del laberinto.
// Cada una revela una pista del lugar turístico y suma puntos.

import * as THREE from 'three';
import { state, POINTS_PER_HINT } from './state.js?v=4';
import { HINT_LIBRARY } from './levels.js?v=4';
import { showHintToast, updateHUD } from './hud.js?v=4';

export let activeEmeralds = [];

export function resetEmeralds() {
  activeEmeralds = [];
}

export function placeEmeraldHints(level, grid, startX, startZ, cellSize, cols, rows, levelGroup) {
  activeEmeralds = [];
  state.hintsInLevel = 0;

  const hints = HINT_LIBRARY[level.id] || ['Pista 1', 'Pista 2', 'Pista 3'];
  const corners = [
    { rRange: [0, 2], cRange: [0, 2] },
    { rRange: [0, 2], cRange: [cols - 3, cols - 1] },
    { rRange: [rows - 3, rows - 1], cRange: [0, 2] },
    { rRange: [rows - 3, rows - 1], cRange: [cols - 3, cols - 1] }
  ];
  const shuffled = corners.slice().sort(() => Math.random() - 0.5).slice(0, 3);

  shuffled.forEach((corner, idx) => {
    const r = corner.rRange[0] + Math.floor(Math.random() * (corner.rRange[1] - corner.rRange[0] + 1));
    const c = corner.cRange[0] + Math.floor(Math.random() * (corner.cRange[1] - corner.cRange[0] + 1));
    const x = startX + c * cellSize + cellSize / 2;
    const z = startZ + r * cellSize + cellSize / 2;
    placeEmerald(x, z, hints[idx], levelGroup);
  });

  state.hintsAvailableInLevel = activeEmeralds.length;
}

function placeEmerald(x, z, hint, levelGroup) {
  const group = new THREE.Group();

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55),
    new THREE.MeshLambertMaterial({ color: 0x6CC04A, emissive: 0x6CC04A, emissiveIntensity: 1.4 })
  );
  gem.position.y = 1.3;
  group.add(gem);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xA5D66A, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  aura.position.y = 1.3;
  group.add(aura);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 1.1, 24),
    new THREE.MeshBasicMaterial({ color: 0x6CC04A, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  group.add(halo);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 0.42, 8),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  pedestal.position.y = 0.21;
  group.add(pedestal);

  const gemLight = new THREE.PointLight(0x6CC04A, 1.2, 5);
  gemLight.position.y = 1.3;
  group.add(gemLight);

  group.position.set(x, 0, z);
  levelGroup.add(group);

  activeEmeralds.push({
    group, gem, aura, halo, gemLight, hint, x, z,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2
  });
}

export function checkEmeraldPickup(player) {
  if (!player) return;
  const px = player.position.x, pz = player.position.z;
  for (const em of activeEmeralds) {
    if (em.collected) continue;
    if (Math.hypot(px - em.x, pz - em.z) < 1.2) {
      em.collected = true;
      em.group.userData.fadeOut = { startTime: performance.now() };
      state.hintsCollected++;
      state.hintsInLevel++;
      state.points += POINTS_PER_HINT;
      showHintToast(em.hint);
      if (navigator.vibrate) navigator.vibrate(40);
      updateHUD();
    }
  }
}

export function animateEmeralds(dt, bobTime, levelGroup) {
  for (const em of activeEmeralds) {
    if (!em.collected) {
      em.gem.rotation.y += dt * 1.5;
      em.gem.rotation.x = Math.sin(bobTime * 1.2 + em.bobOffset) * 0.3;
      em.gem.position.y = 1.3 + Math.sin(bobTime * 2 + em.bobOffset) * 0.18;
      const pulse = 0.5 + 0.5 * Math.sin(bobTime * 2.5 + em.bobOffset);
      if (em.aura) {
        em.aura.material.opacity = 0.15 + pulse * 0.25;
        em.aura.position.y = em.gem.position.y;
        em.aura.scale.setScalar(1 + pulse * 0.15);
      }
      if (em.halo) {
        em.halo.material.opacity = 0.45 + pulse * 0.35;
        em.halo.scale.setScalar(1 + pulse * 0.2);
      }
      if (em.gemLight) em.gemLight.intensity = 0.8 + pulse * 0.8;
    } else if (em.group.userData.fadeOut) {
      const elapsed = (performance.now() - em.group.userData.fadeOut.startTime) / 1000;
      if (elapsed < 0.6) {
        em.group.position.y = elapsed * 4;
        em.group.scale.setScalar(1 - elapsed * 1.5);
        em.gem.rotation.y += dt * 8;
      } else if (em.group.parent) {
        levelGroup.remove(em.group);
        em.group.userData.fadeOut = null;
      }
    }
  }
}
