import * as THREE from 'three';

const GROUND_SIZE = 50;
const HALF_SIZE = GROUND_SIZE / 2;

export class WorldScene {
  private scene: THREE.Scene;
  private ground: THREE.Mesh | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  init(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4caf50'; // Màu nền xanh cỏ
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#2e7d32'; // Màu viền ô vuông (cỏ đậm)
    ctx.lineWidth = 2;
    const gridSize = 16;
    for (let i = 0; i <= 256; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GROUND_SIZE, GROUND_SIZE);

    const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.left = -HALF_SIZE;
    this.directionalLight.shadow.camera.right = HALF_SIZE;
    this.directionalLight.shadow.camera.top = HALF_SIZE;
    this.directionalLight.shadow.camera.bottom = -HALF_SIZE;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 60;
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a3a5c, 0.3);
    this.scene.add(this.hemisphereLight);

    this.scene.fog = new THREE.Fog(0x1a1a2e, 15, 40);
  }

  setSize(width: number, height: number): void {
  }

  getGroundHeight(): number {
    return 0;
  }

  getBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return {
      minX: -HALF_SIZE,
      maxX: HALF_SIZE,
      minZ: -HALF_SIZE,
      maxZ: HALF_SIZE,
    };
  }

  dispose(): void {
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      if (Array.isArray(this.ground.material)) {
        this.ground.material.forEach(m => m.dispose());
      } else {
        this.ground.material.dispose();
      }
      this.ground = null;
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
    if (this.hemisphereLight) {
      this.scene.remove(this.hemisphereLight);
      this.hemisphereLight = null;
    }
  }
}
