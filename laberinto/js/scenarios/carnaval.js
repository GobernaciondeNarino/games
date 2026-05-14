// CARNAVAL DE NEGROS Y BLANCOS — Pasto, Patrimonio UNESCO.
// Elementos: carrozas monumentales detalladas, arcos de globos, banderines,
// tarima de murga, confeti cayendo, faroles de colores, tribunas y cartel.

import * as THREE from 'three';
import { rand, makeSignpost } from './common.js?v=4';

const FIESTA = [0xE84393, 0x9C27B0, 0xFFC107, 0x6CC04A, 0x00AEEF, 0xFF7043, 0x7E57C2];

function makeCarroza(mainColor) {
  const c = new THREE.Group();
  // Plataforma con ruedas
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.6, 2.6),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  base.position.y = 0.5;
  c.add(base);
  for (const dx of [-1.6, 1.6]) for (const dz of [-1, 1]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12),
      new THREE.MeshLambertMaterial({ color: 0x212121 })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(dx, 0.4, dz);
    c.add(wheel);
  }
  // Cuerpo escultórico (pirámide de formas)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 1.8, 2.4, 8),
    new THREE.MeshLambertMaterial({ color: mainColor, emissive: mainColor, emissiveIntensity: 0.2 })
  );
  body.position.y = 2;
  body.castShadow = true;
  c.add(body);
  // Figura monumental coronando la carroza
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0xE9C46A })
  );
  head.position.y = 3.8;
  c.add(head);
  // Brazos extendidos
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 1, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0xE9C46A })
    );
    arm.position.set(sx * 1, 3.4, 0);
    arm.rotation.z = sx * 0.9;
    c.add(arm);
  }
  // Adornos giratorios
  const adorn = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.15, 8, 20),
    new THREE.MeshLambertMaterial({ color: 0xFFC107, emissive: 0xFFC107, emissiveIntensity: 0.4 })
  );
  adorn.position.y = 2;
  adorn.rotation.x = Math.PI / 2;
  adorn.userData.spin = { axis: 'y', speed: 0.8 };
  c.userData.adorn = adorn;
  c.add(adorn);
  return c;
}

export function decorateCarnaval(level, ctx) {
  const { group, obstacles } = ctx;

  // === Carrozas monumentales (decoración + obstáculo central) ===
  const carrozaCenter = makeCarroza(0xE84393);
  carrozaCenter.position.set(0, 0, -24);
  group.add(carrozaCenter);
  if (carrozaCenter.userData.adorn) ctx.animated.push(carrozaCenter.userData.adorn);
  obstacles.push({ type: 'box', minX: -2.4, maxX: 2.4, minZ: -25.4, maxZ: -22.6 });

  // Carrozas laterales de fondo
  [[-14, -32, 0x9C27B0], [13, -33, 0x00AEEF], [-9, -36, 0xFFC107]].forEach(([x, z, col]) => {
    const car = makeCarroza(col);
    car.position.set(x, 0, z);
    car.rotation.y = rand(-0.4, 0.4);
    group.add(car);
    if (car.userData.adorn) ctx.animated.push(car.userData.adorn);
  });

  // === Arcos de globos sobre el camino ===
  for (let a = 0; a < 4; a++) {
    const z = 4 - a * 6;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const ang = t * Math.PI;
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 12),
        new THREE.MeshLambertMaterial({
          color: FIESTA[(i + a) % FIESTA.length],
          emissive: FIESTA[(i + a) % FIESTA.length],
          emissiveIntensity: 0.25
        })
      );
      balloon.position.set(Math.cos(ang) * 6, 1 + Math.sin(ang) * 6, z);
      balloon.scale.y = 1.2;
      group.add(balloon);
    }
  }

  // === Globos sueltos flotando ===
  for (let i = 0; i < 14; i++) {
    const col = FIESTA[i % FIESTA.length];
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 14),
      new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 })
    );
    balloon.position.set(rand(-15, 15), rand(3, 8), rand(-26, 2));
    balloon.scale.y = 1.2;
    balloon.userData.float = { base: balloon.position.y, off: rand(0, Math.PI * 2), amp: 0.35 };
    ctx.animated.push(balloon);
    group.add(balloon);
  }

  // === Banderines a lo largo del camino ===
  for (let i = 0; i < 12; i++) {
    for (const side of [-1, 1]) {
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.7),
        new THREE.MeshLambertMaterial({
          color: FIESTA[i % FIESTA.length], side: THREE.DoubleSide
        })
      );
      flag.position.set(side * 8, 3.5, 5 - i * 2.5);
      flag.userData.flag = { off: rand(0, 6) };
      ctx.animated.push(flag);
      group.add(flag);
    }
  }

  // === Tarima de murga al fondo ===
  const tarima = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1, 3),
    new THREE.MeshLambertMaterial({ color: 0x6A1B9A })
  );
  tarima.position.set(0, 0.5, -39);
  group.add(tarima);
  // Músicos estilizados
  for (let i = 0; i < 5; i++) {
    const musician = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.8, 4, 8),
      new THREE.MeshLambertMaterial({ color: FIESTA[i % FIESTA.length] })
    );
    musician.position.set(-3 + i * 1.5, 1.6, -39);
    musician.userData.float = { base: 1.6, off: rand(0, 6), amp: 0.12 };
    ctx.animated.push(musician);
    group.add(musician);
  }

  // === Faroles de colores en postes ===
  for (let i = 0; i < 8; i++) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3, 6),
        new THREE.MeshLambertMaterial({ color: 0x4a148c })
      );
      post.position.set(side * 11, 1.5, 4 - i * 4);
      group.add(post);
      const col = FIESTA[(i + (side > 0 ? 3 : 0)) % FIESTA.length];
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 10),
        new THREE.MeshBasicMaterial({ color: col })
      );
      lantern.position.set(side * 11, 3, 4 - i * 4);
      group.add(lantern);
      const lanternLight = new THREE.PointLight(col, 0.6, 8);
      lanternLight.position.copy(lantern.position);
      group.add(lanternLight);
    }
  }

  // === Confeti cayendo ===
  for (let i = 0; i < 60; i++) {
    const confetti = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.15),
      new THREE.MeshBasicMaterial({
        color: FIESTA[i % FIESTA.length], side: THREE.DoubleSide
      })
    );
    confetti.position.set(rand(-20, 20), rand(1, 14), rand(-26, 6));
    confetti.userData.snow = { speed: rand(0.8, 1.8), sway: rand(0, 6), top: 14, bottom: 0.1, spin: true };
    ctx.animated.push(confetti);
    group.add(confetti);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('CARNAVAL NEGROS Y BLANCOS', 0xFFC107);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
