// SANTUARIO DE LAS LAJAS — basílica neogótica sobre el cañón del Guáitara, Ipiales.
// Elementos: cañón profundo con el río al fondo, basílica neogótica detallada
// (tres torres, agujas, rosetón, arcos apuntados, puente-cripta), velas votivas,
// cipreses, farolas y cartel turístico.

import * as THREE from 'three';
import { rand, makeSignpost } from './common.js';

export function decorateLajas(level, ctx) {
  const { group, obstacles } = ctx;

  // === Paredes del cañón del Guáitara ===
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(8, 14, 50),
      new THREE.MeshLambertMaterial({ color: 0x6b4a32 })
    );
    wall.position.set(side * 26, 3, -18);
    group.add(wall);
  }

  // === Río Guáitara al fondo del cañón ===
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 7),
    new THREE.MeshPhongMaterial({
      color: 0x0077A3, transparent: true, opacity: 0.9, shininess: 80
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, -3.5, -36);
  group.add(river);
  for (let i = 0; i < 10; i++) {
    const foam = new THREE.Mesh(
      new THREE.PlaneGeometry(rand(1.5, 3), 0.3),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 })
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(rand(-25, 25), -3.4, rand(-39, -33));
    foam.userData.float = { base: -3.4, off: rand(0, 6), amp: 0.05 };
    ctx.animated.push(foam);
    group.add(foam);
  }

  // === BASÍLICA NEOGÓTICA detallada ===
  const stone = new THREE.MeshLambertMaterial({ color: 0xe9c46a });
  const stoneDark = new THREE.MeshLambertMaterial({ color: 0xc99a4a });
  const spireMat = new THREE.MeshLambertMaterial({ color: 0xE76F51 });
  const gold = new THREE.MeshBasicMaterial({ color: 0xFFC107 });

  const basilica = new THREE.Group();

  // Nave central
  const nave = new THREE.Mesh(new THREE.BoxGeometry(6, 9, 5), stone);
  nave.position.y = 4.5;
  nave.castShadow = true;
  basilica.add(nave);

  // Contrafuertes laterales (estilo gótico)
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.8), stoneDark);
      buttress.position.set(sx * 3.1, 3, -1.5 + i * 1.5);
      basilica.add(buttress);
    }
  }

  // Rosetón
  const rose = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.75, 16), spireMat);
  rose.position.set(0, 6, 2.55);
  basilica.add(rose);
  const roseCore = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16),
    new THREE.MeshBasicMaterial({ color: 0x26C6DA }));
  roseCore.position.set(0, 6, 2.54);
  basilica.add(roseCore);

  // Portal con arco apuntado
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.6),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 }));
  portal.position.set(0, 1.6, 2.55);
  basilica.add(portal);
  const arch = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1, 3),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 }));
  arch.position.set(0, 3.2, 2.55);
  basilica.add(arch);

  // Vitrales con arcos apuntados a los lados
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const vitral = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.4),
        new THREE.MeshLambertMaterial({
          color: [0xE84393, 0x26C6DA, 0xFFC107, 0x6CC04A][i + (sx > 0 ? 2 : 0)],
          emissive: 0x442200, emissiveIntensity: 0.3
        }));
      vitral.position.set(sx * 2, 3.5 + i * 2, 2.52);
      basilica.add(vitral);
    }
  }

  // Tres torres con agujas y cruces doradas
  const towerData = [
    { x: -3.2, h: 11, base: 0 },
    { x: 3.2, h: 11, base: 0 },
    { x: 0, h: 13, base: -1 }
  ];
  towerData.forEach(t => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.6, t.h, 1.6), stone);
    tower.position.set(t.x, t.h / 2, t.base);
    tower.castShadow = true;
    basilica.add(tower);
    // Aguja
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 8), spireMat);
    spire.position.set(t.x, t.h + 1.5, t.base);
    basilica.add(spire);
    // Pináculos en las esquinas de cada torre
    for (const dx of [-0.6, 0.6]) for (const dz of [-0.6, 0.6]) {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 6), spireMat);
      pin.position.set(t.x + dx, t.h + 0.35, t.base + dz);
      basilica.add(pin);
    }
    // Cruz dorada
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), gold);
    cv.position.set(t.x, t.h + 3.4, t.base);
    basilica.add(cv);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), gold);
    ch.position.set(t.x, t.h + 3.5, t.base);
    basilica.add(ch);
  });

  // Puente-cripta que cruza el cañón (la basílica se asienta sobre arcos)
  for (let i = 0; i < 4; i++) {
    const archPier = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 5), stoneDark);
    archPier.position.set(-3 + i * 2, -3, -1);
    basilica.add(archPier);
  }

  basilica.position.set(0, 2, -34);
  group.add(basilica);

  // Foco que ilumina la fachada
  const facadeLight = new THREE.SpotLight(0xfff0d0, 2.5, 40, Math.PI / 5, 0.4);
  facadeLight.position.set(0, 8, -14);
  facadeLight.target.position.set(0, 6, -34);
  group.add(facadeLight);
  group.add(facadeLight.target);

  // === Velas votivas a los lados del laberinto ===
  for (let i = -3; i <= 3; i++) {
    if (Math.abs(i) < 1) continue;
    for (const side of [-1, 1]) {
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8),
        new THREE.MeshLambertMaterial({ color: 0xFFFFF0 })
      );
      candle.position.set(side * 16, 0.3, 9 + i * 0.7);
      group.add(candle);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.22, 6),
        new THREE.MeshBasicMaterial({ color: 0xFFC107 })
      );
      flame.position.set(side * 16, 0.66, 9 + i * 0.7);
      flame.userData.flame = { base: 0.66, off: rand(0, 6) };
      ctx.animated.push(flame);
      group.add(flame);
    }
  }

  // === Cipreses y farolas a lo largo del camino ===
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const cypress = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 4, 8),
        new THREE.MeshLambertMaterial({ color: 0x2E5A1F })
      );
      cypress.position.set(side * 13, 2, 6 - i * 5);
      cypress.castShadow = true;
      group.add(cypress);
    }
  }

  // === Cartel turístico ===
  const sign = makeSignpost('SANTUARIO LAS LAJAS', 0xe9c46a);
  sign.position.set(-6, 0, 9);
  group.add(sign);
}
