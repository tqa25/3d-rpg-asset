import * as THREE from 'three';
import { Character } from '../character/Character.js';
import { DamageSystem } from './DamageSystem.js';
import type { DerivedStats } from '../types/index.js';

export interface TargetInfo {
  entityId: string;
  position: THREE.Vector3;
}

export class TargetingSystem {
  private _target: TargetInfo | null = null;
  private damageSystem: DamageSystem;

  constructor() {
    this.damageSystem = new DamageSystem();
  }

  selectTarget(entityId: string, position: THREE.Vector3): void {
    this._target = { entityId, position: position.clone() };
  }

  clearTarget(): void {
    this._target = null;
  }

  getTarget(): TargetInfo | null {
    return this._target;
  }

  update(
    dt: number,
    player: Character,
    mobPositions: { id: string; position: THREE.Vector3; isDead: boolean }[],
    playerLevel: number,
    playerStats: DerivedStats,
  ): void {
    if (!this._target) return;

    // Find the mob in the mob list
    const mob = mobPositions.find(m => m.id === this._target!.entityId);

    // Clear target if mob is dead or gone
    if (!mob || mob.isDead) {
      this.clearTarget();
      return;
    }

    // Update stored position
    this._target.position.copy(mob.position);

    // Check distance
    const playerPos = player.getPosition();
    const dist = playerPos.distanceTo(mob.position);

    // Attack range for auto-attack
    const autoAttackRange = 3.0; // slightly larger than hitbox reach
    if (dist > autoAttackRange * 1.5) {
      // Too far — clear target
      this.clearTarget();
      return;
    }

    // Auto-attack if in range
    if (dist <= autoAttackRange && player.canAttack()) {
      player.attack();
    }
  }

  dispose(): void {
    this._target = null;
  }
}
