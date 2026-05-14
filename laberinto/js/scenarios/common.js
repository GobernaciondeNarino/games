// Primitivos compartidos para construir los escenarios.

import * as THREE from 'three';

export function rand(a, b) { return a + Math.random() * (b - a); }

export function makeTree(color = 0x77a027, h = 3) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, h * 0.6, 8),
    new THREE.MeshLambertMaterial({ color: 0x915030 })
  );
  trunk.position.y = h * 0.3;
  trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color });
  for (let i = 0; i < 3; i++) {
    const layer = new THREE.Mesh(
      new THREE.ConeGeometry(h * (0.5 - i * 0.1), h * 0.5, 10),
      leafMat
    );
    layer.position.y = h * (0.7 + i * 0.2);
    layer.castShadow = true;
    g.add(layer);
  }
  return g;
}

export function makePalm() {
  const g = new THREE.Group();
  const trunkSegs = 5;
  for (let s = 0; s < trunkSegs; s++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 + s * 0.01, 0.22 + s * 0.01, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a5a3a })
    );
    seg.position.y = 0.5 + s * 0.9;
    seg.rotation.z = Math.sin(s * 0.7) * 0.04;
    seg.castShadow = true;
    g.add(seg);
  }
  const leafMat = new THREE.MeshLambertMaterial({
    color: 0x6CC04A,
    side: THREE.DoubleSide
  });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), leafMat);
    const a = (i / 9) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.9, 4.7, Math.sin(a) * 0.9);
    leaf.rotation.y = a;
    leaf.rotation.z = -0.4;
    leaf.rotation.x = 0.15;
    g.add(leaf);
  }
  for (let i = 0; i < 4; i++) {
    const coco = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x5D4037 })
    );
    const a = (i / 4) * Math.PI * 2;
    coco.position.set(Math.cos(a) * 0.45, 4.3, Math.sin(a) * 0.45);
    g.add(coco);
  }
  return g;
}

export function addRocks(group, obstacles, n, range = {}) {
  const {
    minX = -18, maxX = 18,
    minZ = -22, maxZ = 6,
    clearCenter = 2.5
  } = range;
  for (let i = 0; i < n; i++) {
    const radius = rand(0.4, 1.2);
    const r = new THREE.Mesh(
      new THREE.DodecahedronGeometry(radius),
      new THREE.MeshLambertMaterial({ color: 0x9E9E9E })
    );
    r.position.set(rand(minX, maxX), 0.4, rand(minZ, maxZ));
    if (Math.abs(r.position.x) < clearCenter) r.position.x += 3 * Math.sign(r.position.x || 1);
    r.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
    r.castShadow = true;
    group.add(r);
    obstacles.push({ type: 'circle', x: r.position.x, z: r.position.z, radius: radius * 0.85 });
  }
}

export function addReeds(group) {
  for (let i = 0; i < 18; i++) {
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, rand(1, 2), 6),
      new THREE.MeshLambertMaterial({ color: 0x6CC04A })
    );
    reed.position.set(rand(-14, 14), 0.7, rand(-20, -4));
    if (Math.abs(reed.position.x) < 2.5) reed.position.x += 3 * Math.sign(reed.position.x || 1);
    group.add(reed);
  }
}

// Cartel turístico (placa con el nombre del lugar — UX)
export function makeSignpost(text, color = 0xE76F51) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  post.position.y = 0.8;
  g.add(post);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.7, 0.1),
    new THREE.MeshLambertMaterial({ color })
  );
  board.position.y = 1.7;
  g.add(board);

  // Texto pintado en una textura de canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.7),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  front.position.set(0, 1.7, 0.055);
  g.add(front);
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.7),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  back.position.set(0, 1.7, -0.055);
  back.rotation.y = Math.PI;
  g.add(back);

  return g;
}

// Pequeña casita típica (tejado a dos aguas, balcón)
export function makeCasita(roofColor = 0xE76F51, wallColor = 0xFFFFFF) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.6, 1.8),
    new THREE.MeshLambertMaterial({ color: wallColor })
  );
  body.position.y = 0.8;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.55, 1.1, 4),
    new THREE.MeshLambertMaterial({ color: roofColor })
  );
  roof.position.y = 2.15;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  door.position.set(0, 0.4, 0.91);
  g.add(door);

  for (let i = -1; i <= 1; i += 2) {
    const window = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x26C6DA })
    );
    window.position.set(i * 0.6, 1.0, 0.91);
    g.add(window);
  }
  return g;
}
