import * as THREE from '../vendor/three.module.js';
import { MAZE_REGION } from './terrain.js';

// Glowing gems scattered across the world. Each one spins, bobs and is
// emissive so it reads as "shiny". Walking into one collects it for points.

const GEM_COLORS = [0x39ff14, 0x18e0ff, 0xffd000, 0xff3df0, 0xff5a3c];

export class Collectibles {
  constructor(terrain, count = 60) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.gems = [];
    this.score = 0;
    this.pickupRadius = 1.2;

    const geo = new THREE.OctahedronGeometry(0.42, 0);
    for (let i = 0; i < count; i++) {
      let x, z;
      // bias roughly half the gems into the maze area, half in the open world
      if (i % 2 === 0) {
        x = MAZE_REGION.cx + (Math.random() - 0.5) * (MAZE_REGION.w - 6);
        z = MAZE_REGION.cz + (Math.random() - 0.5) * (MAZE_REGION.h - 6);
      } else {
        x = (Math.random() - 0.5) * 170;
        z = (Math.random() - 0.5) * 170;
      }
      const color = GEM_COLORS[i % GEM_COLORS.length];
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 1.3,
          metalness: 0.3,
          roughness: 0.15,
        })
      );
      const baseY = terrain.getHeightAt(x, z) + 0.9;
      m.position.set(x, baseY, z);
      m.castShadow = true;
      // faint glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16 })
      );
      m.add(halo);
      this.group.add(m);
      this.gems.push({ mesh: m, baseY, alive: true, spin: Math.random() * Math.PI * 2, value: 10 });
    }
  }

  // Returns points gained this frame (0 if none).
  update(dt, t, playerPos) {
    let gained = 0;
    for (const g of this.gems) {
      if (!g.alive) continue;
      g.mesh.rotation.y += dt * 1.8;
      g.mesh.position.y = g.baseY + Math.sin(t * 2.2 + g.spin) * 0.18;
      const dx = g.mesh.position.x - playerPos.x;
      const dz = g.mesh.position.z - playerPos.z;
      const dy = g.mesh.position.y - playerPos.y;
      if (dx * dx + dz * dz + dy * dy < this.pickupRadius * this.pickupRadius) {
        g.alive = false;
        g.mesh.visible = false;
        this.score += g.value;
        gained += g.value;
      }
    }
    return gained;
  }

  get remaining() {
    return this.gems.reduce((n, g) => n + (g.alive ? 1 : 0), 0);
  }
}
