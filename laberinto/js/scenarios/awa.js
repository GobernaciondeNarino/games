// SELVA DEL PACÍFICO — territorio del pueblo Awá (Awá-Coaiquer).
// Elementos: selva densa de árboles altos, choza Awá tradicional sobre pilotes,
// río selvático, lianas colgantes, helechos gigantes, mariposas, niebla baja
// y cartel turístico.

import * as THREE from 'three';
import { rand, makeTree, makeSignpost } from './common.js?v=4';

export function decorateAwa(level, ctx) {
  const { group, obstacles } = ctx;

  // === Selva densa de árboles altos ===
  for (let i = 0; i < 24; i++) {
    const t = makeTree(0x4f7a1f, rand(3, 5.5));
    t.position.set(rand(-19, 19), 0, rand(-26, 6));
    if (Math.abs(t.position.x) < 2.8) t.position.x += 4 * Math.sign(t.position.x || 1);
    t.rotation.y = rand(0, 6);
    group.add(t);
    obstacles.push({ type: 'circle', x: t.position.x, z: t.position.z, radius: 0.5 });
  }

  // Árboles emergentes gigantes de fondo
  for (let i = 0; i < 6; i++) {
    const giant = makeTree(0x3a5e16, rand(7, 10));
    giant.position.set(rand(-22, 22), 0, rand(-40, -30));
    group.add(giant);
  }

  // === Choza Awá tradicional sobre pilotes ===
  const hut = new THREE.Group();
  // Pilotes
  for (const dx of [-1.3, 1.3]) for (const dz of [-1.3, 1.3]) {
    const stilt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x5D4037 })
    );
    stilt.position.set(dx, 0.8, dz);
    hut.add(stilt);
  }
  // Plataforma
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.25, 3.2),
    new THREE.MeshLambertMaterial({ color: 0x8a5a3a })
  );
  platform.position.y = 1.7;
  hut.add(platform);
  // Paredes de caña
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.6, 2.8),
    new THREE.MeshLambertMaterial({ color: 0xa07a4a })
  );
  walls.position.y = 2.6;
  walls.castShadow = true;
  hut.add(walls);
  // Techo de palma a cuatro aguas
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 2, 4),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
  );
  roof.position.y = 4.4;
  roof.rotation.y = Math.PI / 4;
  hut.add(roof);
  // Escalera
  const ladder = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.15, 2),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  ladder.position.set(0, 0.9, 2);
  ladder.rotation.x = 0.7;
  hut.add(ladder);
  hut.position.set(-9, 0, -22);
  group.add(hut);
  obstacles.push({ type: 'circle', x: -9, z: -22, radius: 2 });

  // Segunda choza más pequeña
  const hut2 = hut.clone();
  hut2.position.set(10, 0, -25);
  hut2.scale.setScalar(0.85);
  group.add(hut2);
  obstacles.push({ type: 'circle', x: 10, z: -25, radius: 1.7 });

  // === Río selvático cruzando ===
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 30),
    new THREE.MeshPhongMaterial({
      color: 0x2a6b4a, transparent: true, opacity: 0.8, shininess: 60
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.rotation.z = 0.15;
  river.position.set(-12, 0.08, -8);
  group.add(river);

  // === Lianas colgantes ===
  for (let i = 0; i < 16; i++) {
    const liana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, rand(1.5, 3.5), 5),
      new THREE.MeshLambertMaterial({ color: 0x3a5e16 })
    );
    liana.position.set(rand(-18, 18), rand(3, 5), rand(-24, 4));
    liana.userData.float = { base: liana.position.y, off: rand(0, 6), amp: 0.15 };
    ctx.animated.push(liana);
    group.add(liana);
  }

  // === Helechos gigantes en el suelo ===
  for (let i = 0; i < 18; i++) {
    const fern = new THREE.Group();
    for (let l = 0; l < 6; l++) {
      const frond = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x5a8a2a, side: THREE.DoubleSide })
      );
      const a = (l / 6) * Math.PI * 2;
      frond.position.set(Math.cos(a) * 0.5, 0.5, Math.sin(a) * 0.5);
      frond.rotation.y = a;
      frond.rotation.z = -0.5;
      fern.add(frond);
    }
    fern.position.set(rand(-17, 17), 0, rand(-22, 6));
    if (Math.abs(fern.position.x) < 2.5) fern.position.x += 3 * Math.sign(fern.position.x || 1);
    group.add(fern);
  }

  // === Mariposas revoloteando ===
  const wingColors = [0x00AEEF, 0xFFC107, 0xE84393, 0xFF7043];
  for (let i = 0; i < 10; i++) {
    const butterfly = new THREE.Group();
    const col = wingColors[i % wingColors.length];
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(
        new THREE.CircleGeometry(0.2, 8),
        new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide })
      );
      wing.position.x = sx * 0.18;
      butterfly.add(wing);
    }
    butterfly.position.set(rand(-15, 15), rand(1.5, 4), rand(-22, 4));
    butterfly.userData.humming = {
      baseY: butterfly.position.y, baseX: butterfly.position.x,
      off: rand(0, 6), wings: butterfly.children
    };
    ctx.animated.push(butterfly);
    group.add(butterfly);
  }

  // === Niebla baja ===
  for (let i = 0; i < 6; i++) {
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(rand(2, 3.5), 12, 12),
      new THREE.MeshLambertMaterial({ color: 0xdce8d0, transparent: true, opacity: 0.16 })
    );
    mist.position.set(rand(-15, 15), rand(1.5, 4), rand(-24, 5));
    group.add(mist);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('SELVA AWA - PIEDEMONTE', 0x4f7a1f);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
