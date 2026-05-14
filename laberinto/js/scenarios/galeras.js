// VOLCÁN GALERAS — Urcunina sobre el valle de Atriz, Pasto.
// Elementos: cono volcánico imponente con cima nevada, cráter con lava,
// columna de humo animada, estribaciones rocosas, ciudad de Pasto al pie,
// flujos de lava petrificada y cartel turístico.

import * as THREE from 'three';
import { rand, addRocks, makeSignpost, makeCasita } from './common.js';

export function decorateGaleras(level, ctx) {
  const { group, obstacles } = ctx;

  // === Macizo volcánico de fondo ===
  // Cono principal ancho y alto
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(15, 20, 28),
    new THREE.MeshLambertMaterial({ color: 0x7a4a32 })
  );
  cone.position.set(0, 10, -46);
  cone.castShadow = true;
  group.add(cone);

  // Falda más oscura en la base (terreno volcánico)
  const skirt = new THREE.Mesh(
    new THREE.ConeGeometry(20, 8, 28),
    new THREE.MeshLambertMaterial({ color: 0x5a3826 })
  );
  skirt.position.set(0, 4, -46);
  group.add(skirt);

  // Cima nevada
  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(6, 7, 28),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  );
  snow.position.set(0, 16.5, -46);
  group.add(snow);

  // Cráter — anillo de roca + lava emisiva
  const craterRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.7, 10, 20),
    new THREE.MeshLambertMaterial({ color: 0x3a2418 })
  );
  craterRing.rotation.x = Math.PI / 2;
  craterRing.position.set(0, 19.5, -46);
  group.add(craterRing);

  const lava = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 20),
    new THREE.MeshBasicMaterial({ color: 0xFF5722 })
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(0, 19.7, -46);
  lava.userData.glow = { base: 0xFF5722, off: rand(0, 6) };
  ctx.animated.push(lava);
  group.add(lava);

  // Luz cálida del cráter
  const craterLight = new THREE.PointLight(0xFF7043, 2.2, 30);
  craterLight.position.set(0, 21, -46);
  group.add(craterLight);

  // === Columna de humo ascendente animada ===
  for (let i = 0; i < 9; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(rand(1.0, 1.9), 12, 12),
      new THREE.MeshLambertMaterial({ color: 0xE8E8E8, transparent: true, opacity: 0.85 })
    );
    puff.position.set(rand(-2.5, 2.5), 22 + i * 1.2, -46 + rand(-2.5, 2.5));
    puff.userData.smoke = { baseY: puff.position.y, off: rand(0, Math.PI * 2) };
    ctx.animated.push(puff);
    group.add(puff);
  }

  // === Flujos de lava petrificada bajando por la ladera ===
  for (let f = 0; f < 3; f++) {
    const angle = -Math.PI / 2 + f * 0.5 + rand(-0.15, 0.15);
    const flow = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 14),
      new THREE.MeshLambertMaterial({ color: 0x2a1810 })
    );
    flow.position.set(Math.cos(angle) * 7, 0.2, -40 + Math.sin(angle) * 7);
    flow.rotation.y = angle + Math.PI / 2;
    group.add(flow);
  }

  // === Estribaciones rocosas a los pies del volcán ===
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI - Math.PI / 2;
    const r = 14 + rand(0, 3);
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(1.4, 2.4)),
      new THREE.MeshLambertMaterial({ color: 0x6E5040 })
    );
    boulder.position.set(Math.cos(a) * r, 0.9, -44 + Math.sin(a) * r * 0.55);
    boulder.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
    boulder.castShadow = true;
    group.add(boulder);
  }

  // === Caserío de Pasto al pie del volcán (decoración panorámica) ===
  const roofColors = [0xE76F51, 0xF4A261, 0xE9C46A, 0xFF7043];
  for (let i = 0; i < 9; i++) {
    const casa = makeCasita(roofColors[i % roofColors.length], 0xF5F0E8);
    casa.position.set(rand(-22, 22), 0, rand(-34, -28));
    casa.scale.setScalar(rand(0.8, 1.2));
    casa.rotation.y = rand(0, Math.PI * 2);
    group.add(casa);
  }

  // Campanario de iglesia colonial de Pasto
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 6, 1.6),
    new THREE.MeshLambertMaterial({ color: 0xF5F0E8 })
  );
  tower.position.set(-6, 3, -31);
  tower.castShadow = true;
  group.add(tower);
  const towerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2, 4),
    new THREE.MeshLambertMaterial({ color: 0xE76F51 })
  );
  towerRoof.position.set(-6, 7, -31);
  towerRoof.rotation.y = Math.PI / 4;
  group.add(towerRoof);

  // === Rocas volcánicas dispersas como obstáculos en la zona jugable ===
  addRocks(group, obstacles, 6, { minZ: -8, maxZ: 6 });

  // === Cartel turístico ===
  const sign = makeSignpost('GALERAS · URCUNINA', 0xE76F51);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
