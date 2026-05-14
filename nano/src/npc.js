import * as THREE from '../vendor/three.module.js';
import { ChibiRig } from './character.js';

// Wandering NPC robots. Each one builds a recolored ChibiRig, picks random
// destinations, walks/runs toward them and resolves against the shared
// collider world (static props + the player + each other).

const PALETTES = [
  { teal: 0xff7043, tealDark: 0xe64a19, greenDark: 0x8d6e63 },
  { teal: 0x5c6bc0, tealDark: 0x3949ab, greenDark: 0x455a64 },
  { teal: 0xec407a, tealDark: 0xc2185b, greenDark: 0x6d4c41 },
  { teal: 0xffca28, tealDark: 0xf9a825, greenDark: 0x6d4c41 },
  { teal: 0x26c6da, tealDark: 0x0097a7, greenDark: 0x37474f },
  { teal: 0x9ccc65, tealDark: 0x689f38, greenDark: 0x4e342e },
];
const BASE = { white: 0xffffff, yellow: 0xe8a020, black: 0x111111, mouthPink: 0xe89999 };

const WORLD_LIMIT = 92;

class NPC {
  constructor(terrain, x, z, paletteIdx) {
    this.terrain = terrain;
    this.radius = 0.42;
    const palette = { ...BASE, ...PALETTES[paletteIdx % PALETTES.length] };
    this.rig = new ChibiRig(palette, { shirtText: null, withFace: true });
    this.rig.root.scale.setScalar(0.46);
    this.root = new THREE.Group();
    this.root.add(this.rig.root);
    this.pos = new THREE.Vector3(x, terrain.getHeightAt(x, z), z);
    this.root.position.copy(this.pos);

    this._moveDir = new THREE.Vector3();
    this.target = new THREE.Vector3(x, 0, z);
    this.pauseTimer = Math.random() * 2;
    this.running = false;
    this.retarget = 0;
    this._pickTarget();
  }

  _pickTarget() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 22;
    let tx = this.pos.x + Math.cos(ang) * dist;
    let tz = this.pos.z + Math.sin(ang) * dist;
    tx = THREE.MathUtils.clamp(tx, -WORLD_LIMIT, WORLD_LIMIT);
    tz = THREE.MathUtils.clamp(tz, -WORLD_LIMIT, WORLD_LIMIT);
    this.target.set(tx, 0, tz);
    this.running = Math.random() < 0.25;
    this.retarget = 4 + Math.random() * 5;
  }

  update(dt, colliders) {
    let speed = 0;
    this._moveDir.set(0, 0, 0);

    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
    } else {
      this.retarget -= dt;
      const dx = this.target.x - this.pos.x;
      const dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 1 || this.retarget <= 0) {
        this.pauseTimer = 0.4 + Math.random() * 1.8;
        this._pickTarget();
      } else {
        const maxSpeed = this.running ? 4.6 : 2.4;
        this._moveDir.set(dx / d, 0, dz / d);
        speed = maxSpeed;
        this.pos.x += this._moveDir.x * maxSpeed * dt;
        this.pos.z += this._moveDir.z * maxSpeed * dt;
      }
    }

    // collide against world + player + other NPCs (skip self)
    const before = this.pos.x + this.pos.z;
    colliders.resolveCircle(this.pos, this.radius, true, this);
    // if collision shoved us hard, repick a target so we don't grind a wall
    if (Math.abs(this.pos.x + this.pos.z - before) > 0.05 && Math.random() < 0.04) {
      this._pickTarget();
    }

    // stick to the ground
    this.pos.y = this.terrain.getHeightAt(this.pos.x, this.pos.z);
    this.root.position.copy(this.pos);

    this.rig.update(dt, {
      speed,
      grounded: true,
      moveDir: speed > 0.1 ? this._moveDir : null,
      running: this.running,
    });
  }
}

export class NPCManager {
  constructor(terrain, count = 8) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.npcs = [];
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 400) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      // keep spawns out on the open grass (away from maze plot center)
      if (Math.abs(x - 40) < 34 && Math.abs(z - 40) < 34) continue;
      const npc = new NPC(terrain, x, z, placed);
      this.npcs.push(npc);
      this.group.add(npc.root);
      placed++;
    }
  }

  // Register every NPC as a dynamic collider for this frame.
  addColliders(colliders) {
    for (const n of this.npcs) {
      colliders.addDynamic(n.pos.x, n.pos.z, n.radius, n.pos.y + 1.6, n);
    }
  }

  update(dt, colliders) {
    for (const n of this.npcs) n.update(dt, colliders);
  }
}
