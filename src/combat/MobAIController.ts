import * as THREE from 'three';
import { Character } from '../character/Character.js';
import type { MobConfig } from './mobConfigs.js';
import { DamageSystem } from './DamageSystem.js';
import type { DerivedStats } from '../types/index.js';
import { CharacterState } from '../types/index.js';

type AIState = 'patrol' | 'chase' | 'attack' | 'return' | 'dead';

export interface AttackAction {
  type: 'attack';
  result: { amount: number; isCrit: boolean; isDodge: boolean };
}

export class MobAIController {
  character: Character;
  config: MobConfig;
  spawnPosition: THREE.Vector3;
  mesh: THREE.Mesh;
  private damageSystem: DamageSystem;
  private aiState: AIState = 'patrol';
  private _isDead = false;
  private _respawnTimer = 0;

  private _patrolTarget: THREE.Vector3 | null = null;
  private _patrolTimer = 0;
  private _waypointArrivedDist = 0.5;
  private _euler = new THREE.Euler();
  private _targetQuat = new THREE.Quaternion();

  constructor(
    character: Character,
    config: MobConfig,
    spawnPosition: THREE.Vector3,
    mesh: THREE.Mesh,
  ) {
    this.character = character;
    this.config = config;
    this.spawnPosition = spawnPosition.clone();
    this.mesh = mesh;
    this.damageSystem = new DamageSystem();
  }

  update(dt: number, playerPos: THREE.Vector3, playerLevel: number, playerStats: DerivedStats): AttackAction | null {
    if (this._isDead) {
      this._respawnTimer -= dt;
      if (this._respawnTimer <= 0) {
        this.respawn();
      }
      return null;
    }

    // Sync mesh from physics body
    if (this.character.body && this.character.mesh) {
      const t = this.character.body.translation();
      this.character.mesh.position.set(t.x, t.y, t.z);
    }

    const mobPos = this.character.getPosition();
    const distToPlayer = mobPos.distanceTo(playerPos);
    const distToSpawn = mobPos.distanceTo(this.spawnPosition);

    switch (this.aiState) {
      case 'patrol':
        return this.updatePatrol(dt, mobPos, distToPlayer, playerLevel, playerStats);
      case 'chase':
        return this.updateChase(dt, mobPos, playerPos, distToPlayer, distToSpawn, playerLevel, playerStats);
      case 'attack':
        return this.updateAttack(dt, mobPos, playerPos, distToPlayer, playerLevel, playerStats);
      case 'return':
        return this.updateReturn(dt, mobPos, distToSpawn, playerLevel, playerStats);
      default:
        return null;
    }
  }

  private updatePatrol(dt: number, mobPos: THREE.Vector3, distToPlayer: number, playerLevel: number, playerStats: DerivedStats): AttackAction | null {
    // Check aggro — transition handled on next frame
    if (distToPlayer <= this.config.detectionRange) {
      this.changeState('chase');
      return null;
    }

    // Pick new patrol waypoint if timer expired or none set
    this._patrolTimer -= dt;
    if (!this._patrolTarget || this._patrolTimer <= 0) {
      this._patrolTarget = this.randomPatrolPoint();
      this._patrolTimer = 3.0;
    }

    // Move toward patrol target
    const distToTarget = mobPos.distanceTo(this._patrolTarget);
    if (distToTarget > this._waypointArrivedDist) {
      this.moveToward(this._patrolTarget, dt, this.config.speed * 0.5);
    } else {
      this.stopMoving();
    }

    return null;
  }

  private updateChase(dt: number, mobPos: THREE.Vector3, playerPos: THREE.Vector3, distToPlayer: number, distToSpawn: number, playerLevel: number, playerStats: DerivedStats): AttackAction | null {
    // Check leash
    if (distToSpawn > this.config.leashRange) {
      this.changeState('return');
      return null;
    }

    // Check attack range — transition handled on next frame
    if (distToPlayer <= this.config.attackRange) {
      this.changeState('attack');
      return null;
    }

    // Chase player
    this.moveToward(playerPos, dt, this.config.speed);
    return null;
  }

  private updateAttack(dt: number, mobPos: THREE.Vector3, playerPos: THREE.Vector3, distToPlayer: number, playerLevel: number, playerStats: DerivedStats): AttackAction | null {
    // If player moved out of range, chase
    if (distToPlayer > this.config.attackRange * 1.2) {
      this.changeState('chase');
      return null;
    }

    // Attack if cooldown is ready
    if (this.character.canAttack()) {
      this.character.attack();
      const result = this.damageSystem.calculateDamage(
        { level: this.character.level, stats: this.character.stats },
        { level: playerLevel, stats: playerStats },
      );
      return { type: 'attack', result };
    }

    return null;
  }

  private updateReturn(dt: number, mobPos: THREE.Vector3, distToSpawn: number, _playerLevel: number, _playerStats: DerivedStats): AttackAction | null {
    const distToSpawnActual = mobPos.distanceTo(this.spawnPosition);
    if (distToSpawnActual <= this.config.patrolRadius) {
      this.changeState('patrol');
      return null;
    }

    this.moveToward(this.spawnPosition, dt, this.config.speed);
    return null;
  }

  private moveToward(target: THREE.Vector3, dt: number, speed: number): void {
    const mobPos = this.character.getPosition();
    const dx = target.x - mobPos.x;
    const dz = target.z - mobPos.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    if (len < 0.1) {
      this.stopMoving();
      return;
    }

    const normX = dx / len;
    const normZ = dz / len;

    this.character.setVelocity(normX * speed, normZ * speed);

    const state = this.character.fsm.getState();
    if (state === CharacterState.Idle || state === CharacterState.Attack || state === CharacterState.Hit) {
      if (this.character.fsm.transition(CharacterState.Run)) {
        this.character.playAnimation('Run');
      }
    }

    // Rotate toward movement direction
    this._euler.set(0, Math.atan2(normX, normZ), 0);
    this._targetQuat.setFromEuler(this._euler);

    const mesh = this.character.mesh;
    if (mesh) {
      const t = Math.min(1, 10 * dt);
      mesh.quaternion.slerp(this._targetQuat, t);
    }
  }

  private stopMoving(): void {
    this.character.setVelocity(0, 0);
    if (this.character.fsm.getState() === CharacterState.Run) {
      if (this.character.fsm.transition(CharacterState.Idle)) {
        this.character.playAnimation('Idle');
      }
    }
  }

  private randomPatrolPoint(): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.config.patrolRadius;
    return new THREE.Vector3(
      this.spawnPosition.x + Math.cos(angle) * radius,
      0.5,
      this.spawnPosition.z + Math.sin(angle) * radius,
    );
  }

  private changeState(newState: AIState): void {
    this.aiState = newState;
    if (newState === 'patrol') {
      this._patrolTarget = null;
      this._patrolTimer = 0;
    }
  }

  isDead(): boolean {
    return this._isDead;
  }

  die(): void {
    this._isDead = true;
    this._respawnTimer = this.config.respawnDelay;
    this.aiState = 'dead';
    this.stopMoving();
  }

  respawn(): void {
    this._isDead = false;
    this.character.health = this.character.stats.maxHp;
    this.character.isDead = false;
    this.character.fsm.reset();
    this.character.playAnimation('Idle');
    this.character.setPosition(this.spawnPosition.x, 0.5, this.spawnPosition.z);
    this.aiState = 'patrol';
    this._patrolTarget = null;
    this._patrolTimer = 0;
  }

  dispose(): void {
    this.character.dispose();
  }
}
