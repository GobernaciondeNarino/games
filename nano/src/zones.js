import * as THREE from '../vendor/three.module.js';
import { SOCCER_REGION, TECH_REGION } from './terrain.js';

// Soccer field + technology plaza outside the maze. Both register solid
// colliders into the shared ColliderWorld so the player and NPCs bump into
// posts, racks and screens. The soccer ball is a light dynamic object the
// player can kick around.

const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...extra });

// thin painted line on the pitch
function line(group, x, z, w, h, y) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, h), mat(0xffffff, { roughness: 0.9 }));
  m.position.set(x, y + 0.03, z);
  m.receiveShadow = true;
  group.add(m);
}

class Ball {
  constructor(x, y, z, bounds) {
    this.radius = 0.5;
    this.bounds = bounds; // {minX,maxX,minZ,maxZ}
    this.pos = new THREE.Vector3(x, y + this.radius, z);
    this.vel = new THREE.Vector3();
    const m = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 20, 16), mat(0xffffff, { roughness: 0.4 }));
    // pentagon-ish dark patches
    const patchMat = mat(0x222222, { roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.16, 5), patchMat);
      const a = i / 6 * Math.PI * 2;
      p.position.set(Math.cos(a) * this.radius * 0.9, Math.sin(i) * 0.2, Math.sin(a) * this.radius * 0.9);
      p.lookAt(0, p.position.y, 0);
      p.position.multiplyScalar(1.001);
      m.add(p);
    }
    m.castShadow = true;
    this.mesh = m;
    this.groundY = y;
    this.mesh.position.copy(this.pos);
  }

  // Kick when the player overlaps; roll with friction; bounce off field edges.
  update(dt, playerPos, playerRadius) {
    // player kick
    const dx = this.pos.x - playerPos.x;
    const dz = this.pos.z - playerPos.z;
    const d = Math.hypot(dx, dz);
    const minD = this.radius + playerRadius;
    if (d < minD && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      const push = (minD - d);
      this.pos.x += nx * push;
      this.pos.z += nz * push;
      const kick = 8.5;
      this.vel.x = nx * kick;
      this.vel.z = nz * kick;
    }

    // integrate + friction
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    const fric = Math.pow(0.12, dt);
    this.vel.x *= fric;
    this.vel.z *= fric;
    if (this.vel.lengthSq() < 0.0004) this.vel.set(0, 0, 0);

    // bounce off field bounds
    const b = this.bounds;
    if (this.pos.x < b.minX + this.radius) { this.pos.x = b.minX + this.radius; this.vel.x *= -0.6; }
    if (this.pos.x > b.maxX - this.radius) { this.pos.x = b.maxX - this.radius; this.vel.x *= -0.6; }
    if (this.pos.z < b.minZ + this.radius) { this.pos.z = b.minZ + this.radius; this.vel.z *= -0.6; }
    if (this.pos.z > b.maxZ - this.radius) { this.pos.z = b.maxZ - this.radius; this.vel.z *= -0.6; }

    // visual roll
    this.mesh.position.set(this.pos.x, this.groundY + this.radius, this.pos.z);
    this.mesh.rotation.x += this.vel.z * dt / this.radius;
    this.mesh.rotation.z -= this.vel.x * dt / this.radius;
  }
}

function buildGoal(group, colliders, x, z, faceX, y) {
  // faceX = +1 / -1 — which way the goal opens. Posts are 0.18 thick.
  const postMat = mat(0xffffff, { roughness: 0.5 });
  const W = 7, H = 3, D = 2.2;
  const half = W / 2;
  const post = (px, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, H, 0.22), postMat);
    m.position.set(px, y + H / 2, pz);
    m.castShadow = true;
    group.add(m);
    colliders.addAABB(px - 0.18, pz - 0.18, px + 0.18, pz + 0.18, y + H);
  };
  post(x, z - half);
  post(x, z + half);
  post(x - faceX * D, z - half);
  post(x - faceX * D, z + half);
  // crossbars
  const bar = (bx, bz, len, axis) => {
    const geo = axis === 'z' ? new THREE.BoxGeometry(0.22, 0.22, len) : new THREE.BoxGeometry(len, 0.22, 0.22);
    const m = new THREE.Mesh(geo, postMat);
    m.position.set(bx, y + H, bz);
    m.castShadow = true;
    group.add(m);
  };
  bar(x, z, W, 'z');
  bar(x - faceX * D, z, W, 'z');
  bar(x - faceX * D / 2, z - half, D, 'x');
  bar(x - faceX * D / 2, z + half, D, 'x');
  // net (semi-transparent planes)
  const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), netMat);
  back.position.set(x - faceX * D, y + H / 2, z);
  back.rotation.y = Math.PI / 2;
  group.add(back);
}

export function buildSoccer(colliders) {
  const group = new THREE.Group();
  const R = SOCCER_REGION;
  const y = R.y;
  const halfW = R.w / 2 - 2;   // pitch margin
  const halfH = R.h / 2 - 2;
  const bounds = { minX: R.cx - halfW, maxX: R.cx + halfW, minZ: R.cz - halfH, maxZ: R.cz + halfH };

  // markings
  line(group, R.cx, bounds.minZ, halfW * 2, 0.18, y);
  line(group, R.cx, bounds.maxZ, halfW * 2, 0.18, y);
  line(group, bounds.minX, R.cz, 0.18, halfH * 2, y);
  line(group, bounds.maxX, R.cz, 0.18, halfH * 2, y);
  line(group, R.cx, R.cz, 0.18, halfH * 2, y); // halfway line
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.6, 40),
    mat(0xffffff, { roughness: 0.9, side: THREE.DoubleSide })
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(R.cx, y + 0.03, R.cz);
  group.add(circle);

  // goals at the two short ends (±X)
  buildGoal(group, colliders, bounds.minX + 0.5, R.cz, -1, y);
  buildGoal(group, colliders, bounds.maxX - 0.5, R.cz, 1, y);

  // corner flags
  for (const cx of [bounds.minX, bounds.maxX]) {
    for (const cz of [bounds.minZ, bounds.maxZ]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), mat(0xffe066));
      pole.position.set(cx, y + 0.7, cz);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), mat(0xff5252, { side: THREE.DoubleSide }));
      flag.position.set(cx + 0.27, y + 1.25, cz);
      group.add(pole, flag);
      colliders.addCircle(cx, cz, 0.18, y + 1.4);
    }
  }

  const ball = new Ball(R.cx, y, R.cz, bounds);
  group.add(ball.mesh);

  return {
    group,
    update(dt, playerPos, playerRadius) { ball.update(dt, playerPos, playerRadius); },
  };
}

export function buildTech(colliders) {
  const group = new THREE.Group();
  const R = TECH_REGION;
  const y = R.y;

  // plaza slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(R.w - 2, 0.2, R.h - 2), mat(0x6b7280, { roughness: 0.9 }));
  slab.position.set(R.cx, y + 0.1, R.cz);
  slab.receiveShadow = true;
  group.add(slab);

  const emissives = []; // collect emissive bits to pulse

  // server racks around the edges
  const rack = (rx, rz, rot) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 1.0), mat(0x1f2430, { metalness: 0.5, roughness: 0.4 }));
    body.position.y = 1.3;
    body.castShadow = true;
    g.add(body);
    for (let i = 0; i < 5; i++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x00e5a0, emissive: 0x00e5a0, emissiveIntensity: 1.4 })
      );
      led.position.set(0, 0.5 + i * 0.42, 0.53);
      g.add(led);
      emissives.push(led);
    }
    g.position.set(rx, y, rz);
    g.rotation.y = rot;
    group.add(g);
    colliders.addAABB(rx - 0.9, rz - 0.6, rx + 0.9, rz + 0.6, y + 2.6);
  };
  const hw = (R.w - 2) / 2, hh = (R.h - 2) / 2;
  rack(R.cx - hw + 1.5, R.cz - hh + 2, 0.2);
  rack(R.cx - hw + 1.5, R.cz + hh - 2, -0.2);
  rack(R.cx + hw - 1.5, R.cz - hh + 2, Math.PI - 0.2);
  rack(R.cx + hw - 1.5, R.cz + hh - 2, Math.PI + 0.2);

  // big screen
  const screenStand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.6), mat(0x2b3240));
  screenStand.position.set(R.cx, y + 1.2, R.cz - hh + 1.2);
  screenStand.castShadow = true;
  group.add(screenStand);
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0a2540, emissive: 0x2a7fff, emissiveIntensity: 0.8 })
  );
  screen.position.set(R.cx, y + 4, R.cz - hh + 1.2);
  screen.castShadow = true;
  group.add(screen);
  emissives.push(screen);
  colliders.addAABB(R.cx - 0.5, R.cz - hh + 0.9, R.cx + 0.5, R.cz - hh + 1.5, y + 2.4);

  // central holographic ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.16, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0x16f0d0, emissive: 0x16f0d0, emissiveIntensity: 1.6 })
  );
  ring.position.set(R.cx, y + 2.2, R.cz + 1);
  group.add(ring);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.0, 16), mat(0x2b3240, { metalness: 0.6 }));
  pedestal.position.set(R.cx, y + 0.5, R.cz + 1);
  pedestal.castShadow = true;
  group.add(pedestal);
  colliders.addCircle(R.cx, R.cz + 1, 0.95, y + 1.0);

  return {
    group,
    update(dt, t) {
      ring.rotation.y += dt * 0.8;
      ring.rotation.x = Math.sin(t * 0.5) * 0.3;
      const pulse = 1.2 + Math.sin(t * 4) * 0.4;
      for (const e of emissives) e.material.emissiveIntensity = pulse;
    },
  };
}
