import * as THREE from 'three';

export class EquipmentManager {
  private mesh: THREE.Group;
  private slots: Map<string, THREE.Object3D> = new Map();

  constructor(mesh: THREE.Group) {
    this.mesh = mesh;
  }

  equip(slot: string, object: THREE.Object3D): void {
    this.unequip(slot);
    this.mesh.add(object);
    this.slots.set(slot, object);
  }

  unequip(slot: string): void {
    const existing = this.slots.get(slot);
    if (existing) {
      this.mesh.remove(existing);
      this.slots.delete(slot);
    }
  }

  dispose(): void {
    for (const [, obj] of this.slots) {
      this.mesh.remove(obj);
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const mat = child.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    }
    this.slots.clear();
  }
}
