import * as THREE from 'three';
import { CharacterState } from '../types/index.js';
import { Character } from './Character.js';

export class MovementController {
  private character: Character;
  private _targetQuat = new THREE.Quaternion();
  private _euler = new THREE.Euler();
  private _inputDir = new THREE.Vector3();

  private static readonly ROTATION_SPEED = 10;

  constructor(character: Character) {
    this.character = character;
  }

  handleMovement(input: { x: number; z: number }, dt: number): void {
    const len = Math.sqrt(input.x * input.x + input.z * input.z);

    if (len === 0) {
      this.character.stop();
      return;
    }

    const normX = input.x / len;
    const normZ = input.z / len;
    const velX = normX * this.character.speed;
    const velZ = normZ * this.character.speed;

    this.character.setVelocity(velX, velZ);

    if (this.character.fsm.getState() === CharacterState.Idle) {
      if (this.character.fsm.transition(CharacterState.Run)) {
        this.character.playAnimation('Run');
      }
    }

    this.rotateTowards(normX, normZ, dt);
  }

  private rotateTowards(x: number, z: number, dt: number): void {
    if (x === 0 && z === 0) return;

    this._euler.set(0, Math.atan2(x, z), 0);
    this._targetQuat.setFromEuler(this._euler);

    const mesh = this.character.mesh;
    if (!mesh) return;

    const t = Math.min(1, MovementController.ROTATION_SPEED * dt);
    mesh.quaternion.slerp(this._targetQuat, t);
  }

  reset(): void {
    this.character.stop();
    if (this.character.fsm.getState() !== CharacterState.Idle) {
      this.character.fsm.transition(CharacterState.Idle);
      this.character.playAnimation('Idle');
    }
    this.character.setVelocity(0, 0);
  }
}
