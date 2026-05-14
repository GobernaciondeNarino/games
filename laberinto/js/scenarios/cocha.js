// LAGUNA DE LA COCHA (Lago Guamuez) — El Encano.
// Elementos: gran espejo de agua, Isla La Corota arbolada, muelle de madera,
// lanchas de colores típicas, casas de El Encano de tejados coloridos,
// juncos y aves acuáticas, montañas verdes de fondo.

import * as THREE from 'three';
import { rand, makeTree, addReeds, makeSignpost, makeCasita } from './common.js';

export function decorateCocha(level, ctx) {
  const { group, obstacles } = ctx;

  // === Cordillera verde de fondo ===
  for (let i = 0; i < 5; i++) {
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(rand(8, 12), rand(8, 14), 12),
      new THREE.MeshLambertMaterial({ color: 0x4f7a1f })
    );
    hill.position.set(-30 + i * 15, rand(3, 5), -42 + rand(-3, 3));
    group.add(hill);
  }

  // === Espejo de agua de La Cocha ===
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(15, 56),
    new THREE.MeshPhongMaterial({
      color: 0x1d5179,
      transparent: true,
      opacity: 0.92,
      shininess: 90,
      specular: 0x88ccff
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.12, -30);
  water.userData.water = { off: 0 };
  ctx.animated.push(water);
  group.add(water);

  // Borde de totora/arena
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(15, 19, 56),
    new THREE.MeshLambertMaterial({ color: 0x8a9a4a })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(0, 0.06, -30);
  group.add(shore);

  // === Isla La Corota (parque nacional más pequeño) ===
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 3.2, 0.8, 28),
    new THREE.MeshLambertMaterial({ color: 0x2E7D32 })
  );
  island.position.set(2, 0.5, -31);
  island.castShadow = true;
  group.add(island);
  // Bosque denso de la isla
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const t = makeTree(0x2E7D32, rand(2, 3.2));
    t.position.set(2 + Math.cos(a) * rand(0.5, 1.8), 0.85, -31 + Math.sin(a) * rand(0.5, 1.8));
    group.add(t);
  }
  // Cartel de La Corota
  const corotaSign = makeSignpost('ISLA LA COROTA', 0x2E7D32);
  corotaSign.scale.setScalar(0.7);
  corotaSign.position.set(2, 0.9, -28.5);
  group.add(corotaSign);

  // === Muelle de madera que se adentra en la laguna ===
  for (let i = 0; i < 6; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.15, 1),
      new THREE.MeshLambertMaterial({ color: 0x8a5a3a })
    );
    plank.position.set(0, 0.25, -13 - i * 1.05);
    group.add(plank);
  }
  // Postes del muelle
  for (let i = 0; i < 4; i++) {
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1, 6),
        new THREE.MeshLambertMaterial({ color: 0x5D4037 })
      );
      post.position.set(sx, 0, -14 - i * 1.6);
      group.add(post);
    }
  }

  // === Lanchas de colores típicas de El Encano ===
  const boatColors = [0xE84393, 0xFFC107, 0x00AEEF, 0x6CC04A];
  for (let i = 0; i < 4; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.6, 4, 8),
      new THREE.MeshLambertMaterial({ color: boatColors[i] })
    );
    hull.rotation.z = Math.PI / 2;
    boat.add(hull);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.12, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    stripe.position.y = 0.2;
    boat.add(stripe);
    boat.position.set(rand(-9, 9), 0.35, -26 + rand(-3, 3));
    boat.rotation.y = rand(0, Math.PI * 2);
    boat.userData.float = { base: 0.35, off: rand(0, Math.PI * 2), amp: 0.12 };
    ctx.animated.push(boat);
    group.add(boat);
  }

  // === Casas de El Encano con tejados de colores ===
  const roofs = [0xE84393, 0xFFC107, 0x00AEEF, 0x6CC04A, 0xFF7043, 0x9C27B0];
  for (let i = 0; i < 8; i++) {
    const casa = makeCasita(roofs[i % roofs.length], 0xFFFFFF);
    casa.position.set(rand(-20, 20), 0, rand(-12, 4));
    if (Math.abs(casa.position.x) < 4) casa.position.x += 5 * Math.sign(casa.position.x || 1);
    casa.rotation.y = rand(0, Math.PI * 2);
    casa.scale.setScalar(rand(0.85, 1.1));
    group.add(casa);
    obstacles.push({ type: 'circle', x: casa.position.x, z: casa.position.z, radius: 1.3 });
  }

  // === Juncos y aves ===
  addReeds(group);
  for (let i = 0; i < 5; i++) {
    const bird = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    bird.position.set(rand(-12, 12), rand(3, 6), -30 + rand(-8, 8));
    bird.userData.float = { base: bird.position.y, off: rand(0, 6), amp: 0.4 };
    ctx.animated.push(bird);
    group.add(bird);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('LAGUNA DE LA COCHA', 0x1d5179);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
