// Mundo: escena, render, suelo, portal, construcción y limpieza de niveles,
// y animación de la decoración (humo, flotantes, agua, nieve, etc.).

import * as THREE from 'three';
import { buildSky, applySkyConfig } from './sky.js';
import { buildMaze } from './maze.js';
import { decorateLevel } from './scenarios/index.js';
import { placeEmeraldHints, resetEmeralds } from './emeralds.js';

export let scene, renderer, clock;
export let levelGroup;
export let portal = null;
let portalGlow = null;

export const obstacles = [];
let animatedDecor = [];

export function initWorld() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87eeff, 55, 150);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  clock = new THREE.Clock();

  buildSky(scene);

  levelGroup = new THREE.Group();
  scene.add(levelGroup);

  return renderer.domElement;
}

// Altura del terreno: plana dentro del laberinto, ondulada fuera.
export function groundHeightAt(wx, wz) {
  const insideMaze = Math.abs(wx) <= 20 && wz >= -25 && wz <= 11;
  if (insideMaze) return 0;
  return Math.sin(wx * 0.2) * 0.5 + Math.cos(wz * 0.15) * 0.5;
}

function clearLevel() {
  while (levelGroup.children.length) {
    const o = levelGroup.children[0];
    levelGroup.remove(o);
    o.traverse?.(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
  obstacles.length = 0;
  animatedDecor = [];
  resetEmeralds();
}

export function buildLevel(level, player, jumpState, playerInner) {
  clearLevel();
  const colors = level.colors;
  applySkyConfig(scene, level.sky);

  // Suelo principal deformado en los bordes
  const groundGeo = new THREE.PlaneGeometry(100, 120, 36, 36);
  const groundMat = new THREE.MeshLambertMaterial({ color: colors.ground });
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const worldX = pos.getX(i);
    const worldZ = -pos.getY(i);
    pos.setZ(i, groundHeightAt(worldX, worldZ));
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  levelGroup.add(ground);

  // Camino dorado central
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 36),
    new THREE.MeshLambertMaterial({ color: 0xf9b958, transparent: true, opacity: 0.75 })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.05, -7);
  path.receiveShadow = true;
  levelGroup.add(path);

  // Decoración temática detallada del escenario
  decorateLevel(level, { group: levelGroup, obstacles, animated: animatedDecor });

  // Laberinto + esmeraldas
  buildMaze(level, levelGroup, obstacles,
    (lvl, grid, sx, sz, cs, cols, rows) =>
      placeEmeraldHints(lvl, grid, sx, sz, cs, cols, rows, levelGroup));

  // Portal final
  portal = new THREE.Group();
  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.18, 16, 60),
    new THREE.MeshBasicMaterial({ color: 0xFFC107 })
  );
  portalRing.rotation.x = Math.PI / 2;
  portalRing.position.y = 1.6;
  portal.add(portalRing);

  portalGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  portalGlow.position.y = 1.6;
  portalGlow.rotation.x = -Math.PI / 2;
  portal.add(portalGlow);

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, 1.4, 12),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  pillar.position.y = 0.7;
  pillar.castShadow = true;
  portal.add(pillar);

  const portalLight = new THREE.PointLight(0xE8A020, 1.5, 12);
  portalLight.position.y = 2;
  portal.add(portalLight);

  portal.position.set(0, 0, -18);
  levelGroup.add(portal);

  // Reposicionar jugador
  if (player) {
    player.position.set(0, 0, 8);
    player.rotation.y = 0;
    if (playerInner) playerInner.position.y = 0;
    if (jumpState) { jumpState.isJumping = false; jumpState.velocity = 0; }
  }
}

// Animación de toda la decoración: cada mesh declara su tipo en userData.
export function animateDecoration(dt, bobTime) {
  if (portal) {
    portal.rotation.y += dt * 0.6;
    if (portalGlow) portalGlow.material.opacity = 0.4 + Math.sin(bobTime * 3) * 0.2;
  }

  for (const o of animatedDecor) {
    const ud = o.userData;
    if (ud.float) {
      o.position.y = ud.float.base + Math.sin(bobTime + ud.float.off) * (ud.float.amp ?? 0.3);
    }
    if (ud.humming) {
      const h = ud.humming;
      o.position.y = h.baseY + Math.sin(bobTime * 1.8 + h.off) * 0.4;
      o.position.x = h.baseX + Math.cos(bobTime * 0.9 + h.off) * 0.6;
      if (h.wings) {
        const flap = Math.sin(bobTime * 35 + h.off) * 0.7;
        h.wings.forEach((w, i) => { w.rotation.z = i === 0 ? flap : -flap; });
      }
    }
    if (ud.smoke) {
      const s = ud.smoke;
      const cycle = (bobTime * 0.5 + s.off) % 4;
      o.position.y = s.baseY + cycle * 0.9;
      o.material.opacity = 0.85 * (1 - cycle / 4);
      o.scale.setScalar(1 + cycle * 0.25);
    }
    if (ud.snow) {
      const s = ud.snow;
      o.position.y -= s.speed * dt;
      o.position.x += Math.sin(bobTime * 2 + s.sway) * dt * 0.4;
      if (s.spin) o.rotation.z += dt * 3;
      if (o.position.y < s.bottom) {
        o.position.y = s.top;
        o.position.x += Math.random() * 2 - 1;
      }
    }
    if (ud.flame) {
      o.scale.y = 1 + Math.sin(bobTime * 12 + ud.flame.off) * 0.25;
      o.position.y = ud.flame.base + Math.sin(bobTime * 8 + ud.flame.off) * 0.05;
    }
    if (ud.flag) {
      o.rotation.y = Math.sin(bobTime * 3 + ud.flag.off) * 0.5;
    }
    if (ud.spin) {
      o.rotation[ud.spin.axis] += dt * ud.spin.speed;
    }
    if (ud.water) {
      if (ud.water.baseY === undefined) ud.water.baseY = o.position.y;
      ud.water.off += dt;
      o.position.y = ud.water.baseY + Math.sin(ud.water.off * 1.2) * 0.05;
    }
    if (ud.wave) {
      o.position.z = ud.wave.baseZ + Math.sin(bobTime * 1.5 + ud.wave.off) * 1.5;
      o.material.opacity = 0.5 + 0.3 * (0.5 + 0.5 * Math.sin(bobTime * 1.5 + ud.wave.off));
    }
    if (ud.twinkle) {
      o.material.opacity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(bobTime * 3 + ud.twinkle.off));
    }
    if (ud.glow) {
      const g = 0.5 + 0.5 * Math.sin(bobTime * 4 + ud.glow.off);
      o.material.color.setHex(0xFF5722).offsetHSL(0, 0, g * 0.1);
    }
    if (ud.flicker) {
      o.intensity = 1.5 + Math.sin(bobTime * 15) * 0.5 + Math.random() * 0.3;
    }
  }
}

export function onResize(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
