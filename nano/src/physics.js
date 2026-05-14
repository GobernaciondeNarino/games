// Vertical physics + ground snapping using terrain.getHeightAt for cheap,
// always-correct sampling (no raycast per frame). Step-up tolerance lets
// the character climb low ledges (stairs). Horizontal collision is resolved
// against the shared ColliderWorld (maze walls, props, NPCs).
export class Physics {
  constructor(terrain, colliders) {
    this.terrain = terrain;
    this.colliders = colliders;
    this.gravity = -25;
    this.jumpV = 8.5;
    this.stepHeight = 0.55;
    this.radius = 0.45;
  }

  groundAt(x, z) {
    return this.terrain.getHeightAt(x, z);
  }

  // Mutates state {position, velocityY, grounded}. moveXZ is a velocity vector.
  // `skip` is the player's own dynamic-collider token so it doesn't push itself.
  update(state, dt, moveXZ, jumpPressed, skip = null) {
    const pos = state.position;

    // --- horizontal step with stair tolerance ---
    if (moveXZ.lengthSq() > 0) {
      const nextX = pos.x + moveXZ.x * dt;
      const nextZ = pos.z + moveXZ.z * dt;
      const groundNext = this.groundAt(nextX, nextZ);
      const dy = groundNext - pos.y;
      // Allow walking up if step is small enough OR descending freely.
      if (dy <= this.stepHeight + 0.01 || !state.grounded) {
        pos.x = nextX;
        pos.z = nextZ;
        if (state.grounded && dy <= this.stepHeight + 0.01 && dy > 0) {
          pos.y = groundNext; // stair / slope step-up snap
        }
      }
    }

    // resolve against every collider in the world
    this.colliders.resolveCircle(pos, this.radius, true, skip);

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

    if (jumpPressed && state.grounded) {
      state.velocityY = this.jumpV;
      state.grounded = false;
    }
  }
}
