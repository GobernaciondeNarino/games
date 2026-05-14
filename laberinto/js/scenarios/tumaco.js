// TUMACO — La Perla del Pacífico.
// Elementos: mar del Pacífico con oleaje, arco natural del Morro, playa de arena,
// palmeras inclinadas, casas palafíticas afro sobre pilotes, canoas de pescadores,
// gaviotas, redes de pesca y cartel turístico.

import * as THREE from 'three';
import { rand, makePalm, makeSignpost } from './common.js';

export function decorateTumaco(level, ctx) {
  const { group, obstacles } = ctx;

  // === Mar del Pacífico ===
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 44, 1, 1),
    new THREE.MeshPhongMaterial({
      color: 0x0097C4, transparent: true, opacity: 0.92, shininess: 110, specular: 0xaaddff
    })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.05, -36);
  sea.userData.water = { off: 0 };
  ctx.animated.push(sea);
  group.add(sea);

  // Línea de costa de arena más oscura (mojada)
  const wetSand = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 6),
    new THREE.MeshLambertMaterial({ color: 0xc9a96a })
  );
  wetSand.rotation.x = -Math.PI / 2;
  wetSand.position.set(0, 0.06, -15);
  group.add(wetSand);

  // === Crestas de espuma del oleaje ===
  for (let i = 0; i < 10; i++) {
    const foam = new THREE.Mesh(
      new THREE.PlaneGeometry(rand(2.5, 5), 0.5),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.75 })
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(rand(-18, 18), 0.12, rand(-30, -16));
    foam.userData.wave = { baseZ: foam.position.z, off: rand(0, 6) };
    ctx.animated.push(foam);
    group.add(foam);
  }

  // === Arco natural del Morro ===
  const morro = new THREE.Group();
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(3, 1, 10, 20, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0x6b5040 })
  );
  arch.position.y = 0;
  morro.add(arch);
  // Base rocosa
  for (const sx of [-3, 3]) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, 2, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a4636 })
    );
    base.position.set(sx, -1, 0);
    morro.add(base);
  }
  // Vegetación en la cima del arco
  const morroVeg = new THREE.Mesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x4f7a1f })
  );
  morroVeg.position.set(0, 3.2, 0);
  morroVeg.scale.y = 0.5;
  morro.add(morroVeg);
  morro.position.set(10, 3, -26);
  morro.castShadow = true;
  group.add(morro);
  const morroSign = makeSignpost('EL MORRO', 0x6b5040);
  morroSign.scale.setScalar(0.7);
  morroSign.position.set(10, 0, -19);
  group.add(morroSign);

  // === Palmeras inclinadas hacia el mar ===
  for (let i = 0; i < 10; i++) {
    const palm = makePalm();
    palm.position.set(rand(-16, 16), 0, rand(-12, 6));
    if (Math.abs(palm.position.x) < 3) palm.position.x += 4 * Math.sign(palm.position.x || 1);
    palm.rotation.z = rand(-0.18, 0.18);
    palm.rotation.y = rand(0, 6);
    group.add(palm);
    obstacles.push({ type: 'circle', x: palm.position.x, z: palm.position.z, radius: 0.4 });
  }

  // === Casas palafíticas afro sobre pilotes ===
  const palafitoColors = [0x00AEEF, 0xE84393, 0xFFC107, 0x6CC04A];
  for (let i = 0; i < 6; i++) {
    const palafito = new THREE.Group();
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      const stilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6),
        new THREE.MeshLambertMaterial({ color: 0x5D4037 })
      );
      stilt.position.set(dx, 0.7, dz);
      palafito.add(stilt);
    }
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.4, 2.4),
      new THREE.MeshLambertMaterial({ color: palafitoColors[i % palafitoColors.length] })
    );
    body.position.y = 2.1;
    body.castShadow = true;
    palafito.add(body);
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.2, 2.8),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    roof.position.y = 2.9;
    palafito.add(roof);
    palafito.position.set(rand(-17, 17), 0, rand(-13, 4));
    if (Math.abs(palafito.position.x) < 4) palafito.position.x += 5 * Math.sign(palafito.position.x || 1);
    palafito.rotation.y = rand(0, 6);
    group.add(palafito);
    obstacles.push({ type: 'circle', x: palafito.position.x, z: palafito.position.z, radius: 1.5 });
  }

  // === Canoas de pescadores ===
  const canoeColors = [0xFF7043, 0x9C27B0, 0xFFC107];
  for (let i = 0; i < 3; i++) {
    const canoe = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 2.4, 4, 8),
      new THREE.MeshLambertMaterial({ color: canoeColors[i] })
    );
    canoe.rotation.z = Math.PI / 2;
    canoe.position.set(rand(-12, 12), 0.3, rand(-24, -18));
    canoe.rotation.y = rand(0, 6);
    canoe.userData.float = { base: 0.3, off: rand(0, 6), amp: 0.12 };
    ctx.animated.push(canoe);
    group.add(canoe);
  }

  // === Gaviotas ===
  for (let i = 0; i < 7; i++) {
    const gull = new THREE.Group();
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.15),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })
      );
      wing.position.x = sx * 0.3;
      gull.add(wing);
    }
    gull.position.set(rand(-15, 15), rand(5, 9), rand(-30, -10));
    gull.userData.humming = {
      baseY: gull.position.y, baseX: gull.position.x, off: rand(0, 6), wings: gull.children
    };
    ctx.animated.push(gull);
    group.add(gull);
  }

  // === Cartel turístico ===
  const sign = makeSignpost('TUMACO - PERLA DEL PACIFICO', 0x0077A3);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
