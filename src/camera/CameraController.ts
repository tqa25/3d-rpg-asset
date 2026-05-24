import * as THREE from 'three';

const DEFAULT_OFFSET = new THREE.Vector3(0, 8, 10);
const DEFAULT_FOLLOW_SPEED = 0.05;

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private target: THREE.Object3D | THREE.Vector3 | null = null;
  private offset: THREE.Vector3;
  private followSpeed: number;
  private targetPosition: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.offset = DEFAULT_OFFSET.clone();
    this.followSpeed = DEFAULT_FOLLOW_SPEED;
    this.targetPosition = new THREE.Vector3();
  }

  setTarget(target: THREE.Object3D | THREE.Vector3): void {
    this.target = target;
    this.reset();
  }

  setOffset(offset: THREE.Vector3): void {
    this.offset.copy(offset);
  }

  setFollowSpeed(alpha: number): void {
    this.followSpeed = alpha;
  }

  update(dt: number): void {
    if (!this.target) return;

    if (this.target instanceof THREE.Vector3) {
      this.targetPosition.copy(this.target);
    } else {
      this.targetPosition.copy(this.target.position);
    }

    const desired = this.targetPosition.clone().add(this.offset);
    this.camera.position.lerp(desired, this.followSpeed);

    this.camera.lookAt(this.targetPosition);
  }

  getOffset(): THREE.Vector3 {
    return this.offset.clone();
  }

  reset(): void {
    if (!this.target) return;

    if (this.target instanceof THREE.Vector3) {
      this.targetPosition.copy(this.target);
    } else {
      this.targetPosition.copy(this.target.position);
    }

    this.camera.position.copy(this.targetPosition).add(this.offset);
    this.camera.lookAt(this.targetPosition);
  }
}
