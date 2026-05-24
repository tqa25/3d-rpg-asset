import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { CharacterState } from '../types/index.js';
import { CharacterFSM } from './CharacterFSM.js';
import { ActionQueue } from './ActionQueue.js';

export class Character {
  readonly scene: THREE.Scene;
  readonly id: string;

  mesh: THREE.Group | null = null;
  mixer: THREE.AnimationMixer | null = null;
  animations: Map<string, THREE.AnimationClip> = new Map();
  currentAction: THREE.AnimationAction | null = null;
  body: RAPIER.RigidBody | null = null;
  collider: RAPIER.Collider | null = null;

  fsm: CharacterFSM;
  actionQueue: ActionQueue<string>;

  health: number;
  maxHealth: number;
  speed: number;
  attackDamage: number;

  isDead = false;

  _invincibilityTimer = 0;
  _invincibilityDuration: number;
  _attackCooldownTimer = 0;
  _attackCooldownDefault: number;

  private _position = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    id: string,
    config: { speed: number; maxHealth: number; attackDamage: number; attackCooldown?: number; invincibilityDuration?: number },
  ) {
    this.scene = scene;
    this.id = id;
    this.speed = config.speed;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.attackDamage = config.attackDamage;
    this._attackCooldownDefault = config.attackCooldown ?? 1.0;
    this._invincibilityDuration = config.invincibilityDuration ?? 0.5;
    this.fsm = new CharacterFSM();
    this.actionQueue = new ActionQueue<string>();
  }

  setModel(model: THREE.Group): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    this.mesh = model;
    this.scene.add(model);

    this.mixer = new THREE.AnimationMixer(model);
    this.mixer.addEventListener('finished', () => {
      const state = this.fsm.getState();
      if (state === CharacterState.Attack || state === CharacterState.Hit) {
        if (this.fsm.transition(CharacterState.Idle)) {
          this.playAnimation('Idle');
        }
      }
    });
  }

  addAnimation(name: string, clip: THREE.AnimationClip): void {
    this.animations.set(name, clip);
  }

  playAnimation(name: string, fadeIn = 0.2): void {
    const clip = this.animations.get(name);
    if (!clip || !this.mixer) return;

    const action = this.mixer.clipAction(clip);

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.crossFadeTo(action, fadeIn, false);
    }

    action.reset();
    if (name === 'Idle' || name === 'Run') {
      action.loop = THREE.LoopRepeat;
    } else {
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
    }
    action.play();
    this.currentAction = action;
  }

  setPosition(x: number, y: number, z: number): void {
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
    if (this.body) {
      this.body.setNextKinematicTranslation({ x, y, z });
    }
  }

  getPosition(): THREE.Vector3 {
    if (this.mesh) {
      return this.mesh.position.clone();
    }
    if (this.body) {
      const t = this.body.translation();
      return new THREE.Vector3(t.x, t.y, t.z);
    }
    return this._position.clone();
  }

  setVelocity(x: number, z: number): void {
    if (this.body) {
      this.body.setLinvel({ x, y: 0, z }, true);
    }
  }

  setRigidBody(body: RAPIER.RigidBody, collider: RAPIER.Collider): void {
    this.body = body;
    this.collider = collider;
  }

  update(dt: number): void {
    if (this.isDead || !this.mixer) return;

    if (this._invincibilityTimer > 0) {
      this._invincibilityTimer = Math.max(0, this._invincibilityTimer - dt);
    }
    if (this._attackCooldownTimer > 0) {
      this._attackCooldownTimer = Math.max(0, this._attackCooldownTimer - dt);
    }

    this.mixer.update(dt);

    if (!this.actionQueue.isEmpty()) {
      const queued = this.actionQueue.peek();
      if (queued === 'Attack' && this.fsm.canTransition(CharacterState.Attack)) {
        this.actionQueue.dequeue();
        if (this.fsm.transition(CharacterState.Attack)) {
          this.playAnimation('Attack');
        }
      }
    }
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;
    if (this._invincibilityTimer > 0) return;

    this.health = Math.max(0, this.health - amount);
    this._invincibilityTimer = this._invincibilityDuration;

    if (this.health <= 0) {
      this.isDead = true;
      this.actionQueue.clear();
      if (this.fsm.transition(CharacterState.Die)) {
        this.playAnimation('Die');
      }
    } else if (this.fsm.canTransition(CharacterState.Hit)) {
      if (this.fsm.transition(CharacterState.Hit)) {
        this.playAnimation('Hit');
      }
    }
  }

  attack(): void {
    if (this.isDead) return;
    if (this._attackCooldownTimer > 0) return;

    this._attackCooldownTimer = this._attackCooldownDefault;
    this.actionQueue.enqueue('Attack');

    if (this.fsm.canTransition(CharacterState.Attack)) {
      this.actionQueue.dequeue();
      if (this.fsm.transition(CharacterState.Attack)) {
        this.playAnimation('Attack');
      }
    }
  }

  canAttack(): boolean {
    return this._attackCooldownTimer <= 0 && !this.isDead;
  }

  move(x: number, z: number): void {
    if (this.isDead) return;

    const state = this.fsm.getState();
    if (state === CharacterState.Run) {
      this.setVelocity(x, z);
    } else if (state === CharacterState.Idle && (x !== 0 || z !== 0)) {
      if (this.fsm.transition(CharacterState.Run)) {
        this.setVelocity(x, z);
        this.playAnimation('Run');
      }
    }
  }

  stop(): void {
    this.setVelocity(0, 0);
    if (this.fsm.getState() === CharacterState.Run) {
      if (this.fsm.transition(CharacterState.Idle)) {
        this.playAnimation('Idle');
      }
    }
  }

  dispose(): void {
    this.isDead = true;
    if (this.mesh) {
      this.mesh.traverse((child) => {
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
      this.scene.remove(this.mesh);
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.animations.clear();
    this.actionQueue.clear();
    this.body = null;
    this.collider = null;
    this.currentAction = null;
    this.mixer = null;
    this.mesh = null;
  }
}
