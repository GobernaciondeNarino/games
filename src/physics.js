import * as THREE from 'three';

// Vertical physics + ground snapping using terrain.getHeightAt for cheap,
// always-correct sampling (no raycast per frame). Step-up tolerance lets
// the character climb low ledges (stairs).
export class Physics {
  constructor(terrain, maze) {
    this.terrain = terrain;
    this.maze = maze;
    this.gravity = -25;
    this.jumpV = 8.5;
    this.stepHeight = 0.55;
    this.radius = 0.45;
  }

  // Returns ground info for the given XZ position, considering maze wall tops.
  groundAt(x, z) {
    let y = this.terrain.getHeightAt(x, z);
    // (Maze sits flat on terrain plot; no special floor adjustment needed.)
    return y;
  }

  // Mutates state {position:Vector3, velocityY, grounded}. Inputs is move vector (xz).
  update(state, dt, moveXZ, jumpPressed) {
    const pos = state.position;

    // --- horizontal step with stair tolerance ---
    if (moveXZ.lengthSq() > 0) {
      const next = { x: pos.x + moveXZ.x * dt, z: pos.z + moveXZ.z * dt };
      // Maze collision (axis-aligned circle vs rects)
      const tmp = new THREE.Vector3(next.x, pos.y, next.z);
      this.maze.collideCircle(tmp, this.radius);
      next.x = tmp.x; next.z = tmp.z;

      const groundNext = this.groundAt(next.x, next.z);
      const dy = groundNext - pos.y;
      // Allow walking up if step is small enough OR descending freely.
      if (dy <= this.stepHeight + 0.01 || !state.grounded) {
        pos.x = next.x;
        pos.z = next.z;
        if (state.grounded && dy <= this.stepHeight + 0.01 && dy > 0) {
          // stair / slope step-up snap
          pos.y = groundNext;
        }
      }
    }

    // --- vertical integration ---
    state.velocityY += this.gravity * dt;
    pos.y += state.velocityY * dt;

    const groundY = this.groundAt(pos.x, pos.z);
    if (pos.y <= groundY) {
      pos.y = groundY;
      state.velocityY = 0;
      state.grounded = true;
    } else {
      state.grounded = false;
    }

    // Jump only when grounded.
    if (jumpPressed && state.grounded) {
      state.velocityY = this.jumpV;
      state.grounded = false;
    }
  }
}
