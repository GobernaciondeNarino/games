// VOLCÁN NEVADO DEL CUMBAL — punto más alto de Nariño.
// Elementos: dos conos nevados (La Plazuela y Mundo Nuevo), glaciar, fumarolas
// de azufre, Laguna de La Bolsa de aguas grises, pajonales de páramo,
// manchas de nieve, copos cayendo y cartel turístico.

import * as THREE from 'three';
import { rand, makeSignpost } from './common.js';

export function decorateCumbal(level, ctx) {
  const { group, obstacles } = ctx;

  // === Cono principal (La Plazuela) con glaciar ===
  const mainCone = new THREE.Mesh(
    new THREE.ConeGeometry(11, 16, 24),
    new THREE.MeshLambertMaterial({ color: 0x8E8E8E })
  );
  mainCone.position.set(-6, 8, -36);
  mainCone.castShadow = true;
  group.add(mainCone);
  const mainSnow = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 7, 24),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  );
  mainSnow.position.set(-6, 13.5, -36);
  group.add(mainSnow);
  // Glaciar colgante (lengua de hielo bajando)
  const glacier = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 8),
    new THREE.MeshPhongMaterial({ color: 0xE3F4FF, shininess: 90, transparent: true, opacity: 0.9 })
  );
  glacier.position.set(-3, 4, -30);
  glacier.rotation.x = 0.4;
  group.add(glacier);

  // === Cono secundario (Mundo Nuevo) ===
  const secCone = new THREE.Mesh(
    new THREE.ConeGeometry(8, 11, 24),
    new THREE.MeshLambertMaterial({ color: 0x8E8E8E })
  );
  secCone.position.set(9, 5.5, -37);
  secCone.castShadow = true;
  group.add(secCone);
  const secSnow = new THREE.Mesh(
    new THREE.ConeGeometry(3.6, 4, 24),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  );
  secSnow.position.set(9, 9.5, -37);
  group.add(secSnow);

  // === Fumarolas de azufre en las cimas ===
  for (let i = 0; i < 6; i++) {
    const fume = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.5, 1.0), 12, 12),
      new THREE.MeshLambertMaterial({
        color: i % 2 === 0 ? 0xFFFFFF : 0xFFD54F,
        transparent: true,
        opacity: 0.8
      })
    );
    fume.position.set(-6 + rand(-1.5, 1.5), 16 + i * 0.7, -36 + rand(-1.5, 1.5));
    fume.userData.smoke = { baseY: fume.position.y, off: rand(0, Math.PI * 2) };
    ctx.animated.push(fume);
    group.add(fume);
  }

  // === Laguna de La Bolsa (aguas grises, al pie del volcán) ===
  const lagoon = new THREE.Mesh(
    new THREE.CircleGeometry(5, 36),
    new THREE.MeshPhongMaterial({
      color: 0x9aa0a8, shininess: 50, transparent: true, opacity: 0.92
    })
  );
  lagoon.rotation.x = -Math.PI / 2;
  lagoon.position.set(12, 0.08, -22);
  lagoon.userData.water = { off: 0 };
  ctx.animated.push(lagoon);
  group.add(lagoon);
  const lagoonShore = new THREE.Mesh(
    new THREE.RingGeometry(5, 6.5, 36),
    new THREE.MeshLambertMaterial({ color: 0x7a8068 })
  );
  lagoonShore.rotation.x = -Math.PI / 2;
  lagoonShore.position.set(12, 0.05, -22);
  group.add(lagoonShore);
  const lagoonSign = makeSignpost('LAGUNA DE LA BOLSA', 0x9aa0a8);
  lagoonSign.scale.setScalar(0.7);
  lagoonSign.position.set(12, 0, -16);
  group.add(lagoonSign);

  // === Pajonales de páramo (vegetación dorada) ===
  for (let i = 0; i < 22; i++) {
    const tuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.9, 6),
      new THREE.MeshLambertMaterial({ color: 0xE9C46A })
    );
    tuft.position.set(rand(-16, 16), 0.45, rand(-20, 6));
    if (Math.abs(tuft.position.x) < 2.5) tuft.position.x += 4 * Math.sign(tuft.position.x || 1);
    group.add(tuft);
  }

  // === Manchas de nieve en el suelo ===
  for (let i = 0; i < 10; i++) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(rand(1.2, 2.6), 16),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.75 })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(rand(-15, 15), 0.07, rand(-20, 5));
    group.add(patch);
  }

  // === Copos de nieve cayendo ===
  for (let i = 0; i < 40; i++) {
    const flake = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    flake.position.set(rand(-22, 22), rand(2, 18), rand(-26, 8));
    flake.userData.snow = { speed: rand(0.6, 1.4), sway: rand(0, 6), top: 18, bottom: 0.2 };
    ctx.animated.push(flake);
    group.add(flake);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('NEVADO DEL CUMBAL', 0xB3E5FC);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
