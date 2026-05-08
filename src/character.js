import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Loads RobotExpressive.glb, manages animations, applies "Ñaño" branding
// (teal/green tint + chest decal). Exposes update(dt, opts).
export class NanoCharacter {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'Nano';
    this.mixer = null;
    this.actions = {};
    this._current = null;
    this.model = null;
    this._facingY = 0;
  }

  async load(url = '/models/RobotExpressive.glb') {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = false;
      }
    });
    // brand pass
    this._applyBrand(model);
    this._addChestDecal(model);

    this.model = model;
    this.root.add(model);
    model.scale.setScalar(0.55);

    this.mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(0);
      this.actions[clip.name] = action;
    }
    this._setState('Idle', 0);
    return this;
  }

  _applyBrand(model) {
    const teal = new THREE.Color(0x14b8a6);
    const green = new THREE.Color(0x22c55e);
    const dark = new THREE.Color(0x065f5b);
    model.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m.color) return;
        // Bias original color toward teal/green based on luminance.
        const orig = m.color.clone();
        const lum = 0.299 * orig.r + 0.587 * orig.g + 0.114 * orig.b;
        if (lum > 0.6) {
          m.color.copy(green).lerp(new THREE.Color(0xffffff), 0.2);
        } else if (lum > 0.3) {
          m.color.copy(teal);
        } else {
          m.color.copy(dark);
        }
        m.metalness = 0.1;
        m.roughness = 0.55;
      });
    });
  }

  _addChestDecal(model) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 80, cv.width, 96);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 70, cv.width, 10);
    ctx.fillRect(0, 176, cv.width, 10);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 130px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ÑAÑO', cv.width / 2, cv.height / 2);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    const decalGeom = new THREE.PlaneGeometry(0.9, 0.45);
    const decalMat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: false,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const decal = new THREE.Mesh(decalGeom, decalMat);
    decal.castShadow = false;
    decal.position.set(0, 1.05, 0.42);
    decal.renderOrder = 1;
    model.add(decal);
  }

  _setState(name, fade = 0.25) {
    const next = this.actions[name];
    if (!next) return;
    if (this._current === next) return;
    next.reset();
    next.setEffectiveWeight(1);
    next.play();
    if (this._current) {
      this._current.crossFadeTo(next, fade, false);
    }
    this._current = next;
  }

  update(dt, { speed, grounded, moveDir }) {
    if (!this.mixer) return;
    this.mixer.update(dt);

    // pick state
    if (!grounded) this._setState('Jump');
    else if (speed < 0.05) this._setState('Idle');
    else if (speed < 5.0) this._setState('Walking');
    else this._setState('Running');

    // face movement direction (smooth yaw)
    if (moveDir && (moveDir.x !== 0 || moveDir.z !== 0)) {
      const targetY = Math.atan2(moveDir.x, moveDir.z);
      let dy = targetY - this._facingY;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this._facingY += dy * Math.min(1, dt * 12);
      this.model.rotation.y = this._facingY;
    }
  }
}
