// LAGUNA VERDE DEL AZUFRAL — cráter del volcán Azufral, Túquerres.
// Elementos: cono volcánico con cráter abierto, laguna turquesa esmeralda
// emisiva, fumarolas de vapor animadas, depósitos de azufre amarillo,
// rocas volcánicas, frailejones de páramo y cartel turístico.

import * as THREE from 'three';
import { rand, addRocks, makeSignpost } from './common.js';

export function decorateAzufral(level, ctx) {
  const { group, obstacles } = ctx;

  // === Cono del volcán Azufral con cráter abierto al fondo ===
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 16, 14, 28, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x8a8076, side: THREE.DoubleSide })
  );
  cone.position.set(0, 7, -40);
  cone.castShadow = true;
  group.add(cone);

  // Borde rocoso del cráter
  const craterRim = new THREE.Mesh(
    new THREE.TorusGeometry(7.2, 1.1, 12, 28),
    new THREE.MeshLambertMaterial({ color: 0x6b6258 })
  );
  craterRim.rotation.x = Math.PI / 2;
  craterRim.position.set(0, 14, -40);
  group.add(craterRim);

  // === Laguna Verde dentro del cráter (emisiva, turquesa) ===
  const lagoonFar = new THREE.Mesh(
    new THREE.CircleGeometry(6.5, 40),
    new THREE.MeshPhongMaterial({
      color: 0x26C6DA,
      emissive: 0x16a085,
      emissiveIntensity: 0.4,
      shininess: 100,
      transparent: true,
      opacity: 0.95
    })
  );
  lagoonFar.rotation.x = -Math.PI / 2;
  lagoonFar.position.set(0, 13.5, -40);
  group.add(lagoonFar);

  // === Laguna turquesa también en la zona jugable (charco geotérmico) ===
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(5, 36),
    new THREE.MeshPhongMaterial({
      color: 0x26C6DA,
      emissive: 0x16a085,
      emissiveIntensity: 0.35,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.1, -28);
  pool.userData.water = { off: 0 };
  ctx.animated.push(pool);
  group.add(pool);

  // Anillo de azufre amarillo alrededor del charco
  const sulfurRing = new THREE.Mesh(
    new THREE.RingGeometry(5, 6.5, 36),
    new THREE.MeshLambertMaterial({ color: 0xE6C200 })
  );
  sulfurRing.rotation.x = -Math.PI / 2;
  sulfurRing.position.set(0, 0.07, -28);
  group.add(sulfurRing);

  const poolLight = new THREE.PointLight(0x26C6DA, 1.6, 16);
  poolLight.position.set(0, 1.5, -28);
  group.add(poolLight);

  // === Fumarolas de vapor ascendente ===
  const fumaroleSpots = [
    [0, -40, 13.5], [-3, -38, 1], [3, -34, 1], [-6, -24, 0.5], [6, -22, 0.5], [0, -16, 0.5]
  ];
  fumaroleSpots.forEach(([x, z, y]) => {
    for (let i = 0; i < 5; i++) {
      const vapor = new THREE.Mesh(
        new THREE.SphereGeometry(rand(0.5, 1.0), 10, 10),
        new THREE.MeshLambertMaterial({
          color: i % 2 === 0 ? 0xFFFFFF : 0xFFF3C4,
          transparent: true,
          opacity: 0.7
        })
      );
      vapor.position.set(x + rand(-0.6, 0.6), y + i * 0.8, z + rand(-0.6, 0.6));
      vapor.userData.smoke = { baseY: vapor.position.y, off: rand(0, Math.PI * 2) };
      ctx.animated.push(vapor);
      group.add(vapor);
    }
  });

  // === Depósitos de azufre amarillo dispersos ===
  for (let i = 0; i < 10; i++) {
    const sulfur = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.3, 0.7)),
      new THREE.MeshLambertMaterial({ color: 0xE6C200, emissive: 0x4a3c00, emissiveIntensity: 0.3 })
    );
    sulfur.position.set(rand(-16, 16), 0.3, rand(-20, 5));
    if (Math.abs(sulfur.position.x) < 2.5) sulfur.position.x += 3 * Math.sign(sulfur.position.x || 1);
    group.add(sulfur);
  }

  // === Frailejones de páramo ===
  for (let i = 0; i < 14; i++) {
    const frailejon = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    trunk.position.y = 0.5;
    frailejon.add(trunk);
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x9aa86a })
    );
    crown.position.y = 1.1;
    crown.scale.y = 0.7;
    frailejon.add(crown);
    frailejon.position.set(rand(-16, 16), 0, rand(-20, 6));
    if (Math.abs(frailejon.position.x) < 2.5) frailejon.position.x += 3 * Math.sign(frailejon.position.x || 1);
    group.add(frailejon);
  }

  // === Rocas volcánicas como obstáculos ===
  addRocks(group, obstacles, 8, { minZ: -10, maxZ: 6 });

  // === Cartel turístico ===
  const sign = makeSignpost('LAGUNA VERDE AZUFRAL', 0x26C6DA);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
