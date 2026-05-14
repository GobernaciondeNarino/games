// PUEBLOS ANCESTRALES — Pastos y Quillacingas, hijos de la luna y del sol.
// Elementos: círculo ceremonial de monolitos tallados, gran luna llena, sol,
// fogata ritual central, petroglifos en el suelo, tótems, estrellas y cartel.

import * as THREE from 'three';
import { rand, makeSignpost } from './common.js';

export function decoratePueblos(level, ctx) {
  const { group, obstacles } = ctx;

  // === Luna llena gigante (Quilla) ===
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4 })
  );
  moon.position.set(9, 15, -34);
  group.add(moon);
  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.2 })
  );
  moonGlow.position.copy(moon.position);
  group.add(moonGlow);
  const moonLight = new THREE.PointLight(0xfff1c4, 1.4, 60);
  moonLight.position.copy(moon.position);
  group.add(moonLight);

  // === Sol (Inti) más pequeño al otro lado ===
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xFFB300 })
  );
  sun.position.set(-11, 13, -30);
  group.add(sun);
  // Rayos del sol
  for (let i = 0; i < 12; i++) {
    const ray = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 1.2, 4),
      new THREE.MeshBasicMaterial({ color: 0xFFC107 })
    );
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(-11 + Math.cos(a) * 2.4, 13 + Math.sin(a) * 2.4, -30);
    ray.rotation.z = a - Math.PI / 2;
    group.add(ray);
  }
  const sunLight = new THREE.PointLight(0xFFB300, 0.8, 40);
  sunLight.position.copy(sun.position);
  group.add(sunLight);

  // === Círculo ceremonial de monolitos tallados ===
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 8;
    const h = rand(3.5, 5.5);
    const monolith = new THREE.Group();
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, h, 1),
      new THREE.MeshLambertMaterial({ color: 0x5a4a6a })
    );
    stone.position.y = h / 2;
    stone.castShadow = true;
    monolith.add(stone);
    // Cabeza tallada (estilo San Agustín / Pasto)
    const headCarve = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x6a5a7a })
    );
    headCarve.position.y = h;
    monolith.add(headCarve);
    // Ojos emisivos
    for (const sx of [-0.25, 0.25]) {
      const eye = new THREE.Mesh(
        new THREE.CircleGeometry(0.1, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFC107 })
      );
      eye.position.set(sx, h + 0.1, 0.46);
      monolith.add(eye);
    }
    monolith.position.set(Math.cos(a) * r, 0, -20 + Math.sin(a) * r);
    monolith.rotation.y = -a + Math.PI / 2;
    group.add(monolith);
    obstacles.push({
      type: 'circle',
      x: monolith.position.x, z: monolith.position.z, radius: 0.9
    });
  }

  // === Fogata ritual central ===
  const fireGroup = new THREE.Group();
  // Leños
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x3a2418 })
    );
    const a = (i / 5) * Math.PI * 2;
    log.position.set(Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3);
    log.rotation.z = Math.cos(a) * 0.6;
    log.rotation.x = Math.sin(a) * 0.6;
    fireGroup.add(log);
  }
  // Llamas
  for (let i = 0; i < 6; i++) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.15, 0.3), rand(0.6, 1.2), 6),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xFF7043 : 0xFFC107
      })
    );
    flame.position.set(rand(-0.25, 0.25), 0.6, rand(-0.25, 0.25));
    flame.userData.flame = { base: flame.position.y, off: rand(0, 6) };
    ctx.animated.push(flame);
    fireGroup.add(flame);
  }
  fireGroup.position.set(0, 0, -20);
  group.add(fireGroup);
  const fireLight = new THREE.PointLight(0xFF7043, 2, 14);
  fireLight.position.set(0, 1.5, -20);
  fireLight.userData.flicker = true;
  ctx.animated.push(fireLight);
  group.add(fireLight);
  obstacles.push({ type: 'circle', x: 0, z: -20, radius: 1 });

  // === Tótems a lo largo del camino ===
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1]) {
      const totem = new THREE.Group();
      const colors = [0xE84393, 0xFFC107, 0x6CC04A, 0x00AEEF];
      for (let s = 0; s < 3; s++) {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.7),
          new THREE.MeshLambertMaterial({ color: colors[(i + s) % colors.length] })
        );
        seg.position.y = 0.4 + s * 0.7;
        totem.add(seg);
      }
      totem.position.set(side * 12, 0, 5 - i * 5);
      group.add(totem);
    }
  }

  // === Petroglifos en el suelo (espirales) ===
  for (let i = 0; i < 6; i++) {
    const glyph = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.7, 16),
      new THREE.MeshBasicMaterial({ color: 0xe8a020, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    glyph.rotation.x = -Math.PI / 2;
    glyph.position.set(rand(-14, 14), 0.06, rand(-18, 4));
    group.add(glyph);
  }

  // === Cielo estrellado ===
  for (let i = 0; i < 80; i++) {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.04, 0.12), 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true })
    );
    const a = rand(0, Math.PI * 2);
    const elev = rand(0.2, 0.95);
    const R = 90;
    star.position.set(
      Math.cos(a) * R * Math.sqrt(1 - elev * elev),
      elev * 60 + 10,
      Math.sin(a) * R * Math.sqrt(1 - elev * elev) - 15
    );
    star.userData.twinkle = { off: rand(0, 6) };
    ctx.animated.push(star);
    group.add(star);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('PUEBLOS ANCESTRALES', 0xe8a020);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
