// RESERVA RÍO ÑAMBÍ — bosque nublado, santuario de colibríes, Barbacoas.
// Elementos: dosel denso de bosque nublado, colibríes con alas que aletean,
// quebrada Sonora, heliconias y bromelias de colores, comederos de FELCA,
// niebla flotante y cartel turístico.

import * as THREE from 'three';
import { rand, makeTree, makeSignpost } from './common.js?v=4';

const HUMMING = [0xE84393, 0x26C6DA, 0xFFC107, 0x9C27B0, 0xFF7043, 0x6CC04A];

export function decorateNambi(level, ctx) {
  const { group, obstacles } = ctx;

  // === Dosel del bosque nublado ===
  for (let i = 0; i < 26; i++) {
    const t = makeTree(0x2E7D32, rand(4, 6));
    t.position.set(rand(-18, 18), 0, rand(-26, 6));
    if (Math.abs(t.position.x) < 2.8) t.position.x += 4 * Math.sign(t.position.x || 1);
    group.add(t);
    obstacles.push({ type: 'circle', x: t.position.x, z: t.position.z, radius: 0.5 });
  }
  // Árboles emergentes con musgo
  for (let i = 0; i < 5; i++) {
    const tall = makeTree(0x1f5e1f, rand(8, 11));
    tall.position.set(rand(-22, 22), 0, rand(-40, -30));
    group.add(tall);
  }

  // === Quebrada Sonora ===
  const stream = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 28),
    new THREE.MeshPhongMaterial({
      color: 0x4ec3e0, transparent: true, opacity: 0.78, shininess: 90
    })
  );
  stream.rotation.x = -Math.PI / 2;
  stream.rotation.z = 0.25;
  stream.position.set(9, 0.08, -9);
  group.add(stream);
  // Piedras del lecho
  for (let i = 0; i < 10; i++) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.2, 0.5)),
      new THREE.MeshLambertMaterial({ color: 0x6b6258 })
    );
    stone.position.set(9 + rand(-1.5, 1.5), 0.15, -9 + rand(-12, 12));
    group.add(stone);
  }

  // === Comederos de colibríes (FELCA) ===
  for (const [x, z] of [[-10, -14], [6, -20], [-5, 2]]) {
    const feeder = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2, 6),
      new THREE.MeshLambertMaterial({ color: 0x5D4037 })
    );
    pole.position.y = 1;
    feeder.add(pole);
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.2, 0.3, 12),
      new THREE.MeshLambertMaterial({ color: 0xE84393 })
    );
    bowl.position.y = 2;
    feeder.add(bowl);
    feeder.position.set(x, 0, z);
    group.add(feeder);
  }

  // === Colibríes con alas que aletean ===
  for (let i = 0; i < 16; i++) {
    const bird = new THREE.Group();
    const col = HUMMING[i % HUMMING.length];
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.45 })
    );
    body.scale.z = 1.6;
    bird.add(body);
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.25, 5),
      new THREE.MeshLambertMaterial({ color: 0x212121 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.z = 0.3;
    bird.add(beak);
    const wings = [];
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.16),
        new THREE.MeshLambertMaterial({
          color: 0xFFFFFF, transparent: true, opacity: 0.55, side: THREE.DoubleSide
        })
      );
      wing.position.set(sx * 0.15, 0.05, 0);
      bird.add(wing);
      wings.push(wing);
    }
    bird.position.set(rand(-15, 15), rand(2.5, 5.5), rand(-22, 4));
    bird.userData.humming = {
      baseY: bird.position.y, baseX: bird.position.x, off: rand(0, Math.PI * 2), wings
    };
    ctx.animated.push(bird);
    group.add(bird);
  }

  // === Heliconias y bromelias ===
  for (let i = 0; i < 18; i++) {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
      new THREE.MeshLambertMaterial({ color: 0x2E7D32 })
    );
    stem.position.y = 0.5;
    flower.add(stem);
    // Bráctea de heliconia (zigzag de hojas)
    const col = [0xE84393, 0xFF5252, 0xFFC107, 0xE76F51][i % 4];
    for (let b = 0; b < 4; b++) {
      const bract = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.4, 5),
        new THREE.MeshLambertMaterial({ color: col })
      );
      bract.position.set((b % 2 === 0 ? 0.12 : -0.12), 1 + b * 0.22, 0);
      bract.rotation.z = (b % 2 === 0 ? -1 : 1);
      flower.add(bract);
    }
    flower.position.set(rand(-16, 16), 0, rand(-22, 6));
    if (Math.abs(flower.position.x) < 2.5) flower.position.x += 3 * Math.sign(flower.position.x || 1);
    group.add(flower);
  }

  // === Niebla flotante ===
  for (let i = 0; i < 8; i++) {
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(rand(2.5, 4), 12, 12),
      new THREE.MeshLambertMaterial({ color: 0xE0F0E0, transparent: true, opacity: 0.16 })
    );
    mist.position.set(rand(-16, 16), rand(2, 6), rand(-25, 6));
    mist.userData.float = { base: mist.position.y, off: rand(0, 6), amp: 0.5 };
    ctx.animated.push(mist);
    group.add(mist);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('RESERVA RIO ÑAMBI', 0x6CC04A);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
