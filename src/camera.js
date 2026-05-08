import * as THREE from 'three';

// Third-person orbital camera rig. Orbits around `target`; cushion-raycasts
// against terrain + maze so the camera doesn't punch through geometry.
export class CameraRig {
  constructor(camera, controls, obstacles) {
    this.camera = camera;
    this.controls = controls;
    this.obstacles = obstacles; // array of meshes for occlusion raycasts
    this.target = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();
    this._raycaster.far = 50;
    this._cur = new THREE.Vector3(0, 5, 10);
    this._headOffset = 1.5;
  }

  setTarget(v) {
    this.target.copy(v);
    this.target.y += this._headOffset;
  }

  update(dt, characterPos) {
    this.target.copy(characterPos);
    this.target.y += this._headOffset;

    const { yaw, pitch, distance } = this.controls;
    const cosP = Math.cos(pitch);
    this._desired.set(
      this.target.x + Math.sin(yaw) * cosP * distance,
      this.target.y + Math.sin(pitch) * distance,
      this.target.z + Math.cos(yaw) * cosP * distance
    );

    // Cushion: cast from target toward desired; if blocked, move closer.
    const dir = this._tmp.copy(this._desired).sub(this.target);
    const dist = dir.length();
    dir.normalize();
    this._raycaster.set(this.target, dir);
    this._raycaster.far = dist;
    const hits = this._raycaster.intersectObjects(this.obstacles, false);
    let final = this._desired;
    if (hits.length) {
      const h = hits[0];
      final = this._tmp.copy(this.target).addScaledVector(dir, Math.max(1.5, h.distance - 0.3));
    }

    // smooth lerp
    const k = 12;
    const t = 1 - Math.exp(-k * dt);
    this._cur.lerp(final, t);
    this.camera.position.copy(this._cur);
    this.camera.lookAt(this.target);
  }
}
