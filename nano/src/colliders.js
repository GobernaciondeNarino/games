// Shared collision world. Holds static axis-aligned and circular colliders
// (maze walls, trees, rocks, goals, tech props) plus a per-frame dynamic
// list (NPCs, the player) so everything can be pushed apart consistently.
//
// All collision is resolved in the XZ plane against vertical colliders that
// have a `topY` — an entity above a collider's top simply passes over it.

export class ColliderWorld {
  constructor() {
    this.static = [];   // never cleared
    this.dynamic = [];  // cleared & rebuilt every frame
  }

  addAABB(minX, minZ, maxX, maxZ, topY = Infinity) {
    this.static.push({ kind: 'aabb', minX, minZ, maxX, maxZ, topY });
  }

  addCircle(x, z, r, topY = Infinity) {
    this.static.push({ kind: 'circle', x, z, r, topY });
  }

  // Register a moving circle for this frame only (NPC / player body).
  addDynamic(x, z, r, topY, owner) {
    this.dynamic.push({ kind: 'circle', x, z, r, topY, owner });
  }

  clearDynamic() {
    this.dynamic.length = 0;
  }

  // Push a circle (pos = Vector3, mutated) out of every overlapping collider.
  // `skip` is an optional owner reference to ignore (so an NPC ignores itself).
  // Returns true if anything was contacted.
  resolveCircle(pos, radius, includeDynamic = true, skip = null) {
    let touched = false;
    const lists = includeDynamic ? [this.static, this.dynamic] : [this.static];
    for (const list of lists) {
      for (const c of list) {
        if (c.owner && c.owner === skip) continue;
        // an entity above the collider's top simply passes over it
        if (pos.y > c.topY + 0.05) continue;

        if (c.kind === 'aabb') {
          const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
          const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) || 0.0001;
            const push = (radius - d) / d;
            pos.x += dx * push;
            pos.z += dz * push;
            touched = true;
          }
        } else {
          const dx = pos.x - c.x;
          const dz = pos.z - c.z;
          const rr = radius + c.r;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2) || 0.0001;
            const push = (rr - d) / d;
            pos.x += dx * push;
            pos.z += dz * push;
            touched = true;
          }
        }
      }
    }
    return touched;
  }
}
