import * as THREE from 'three';

export class LODManager {
  private camera: THREE.Camera;
  private lods: THREE.LOD[] = [];

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  addLOD(object: THREE.LOD): void {
    this.lods.push(object);
  }

  removeLOD(object: THREE.LOD): void {
    const index = this.lods.indexOf(object);
    if (index !== -1) {
      this.lods.splice(index, 1);
    }
  }

  update(): void {
    for (let i = 0; i < this.lods.length; i++) {
      this.lods[i].update(this.camera);
    }
  }

  dispose(): void {
    this.lods.length = 0;
  }

  static createLOD(detailLevels: { distance: number; object: THREE.Object3D }[]): THREE.LOD {
    const lod = new THREE.LOD();
    for (const level of detailLevels) {
      lod.addLevel(level.object, level.distance);
    }
    return lod;
  }
}
