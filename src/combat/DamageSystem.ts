import type { DerivedStats } from '../types/index.js';

interface Combatant {
  level: number;
  stats: DerivedStats;
}

export class DamageSystem {
  calculateDamage(
    attacker: Combatant,
    defender: Combatant,
  ): { amount: number; isCrit: boolean; isDodge: boolean } {
    const dodgeRoll = Math.random();
    if (dodgeRoll < defender.stats.dodgeRate) {
      return { amount: 0, isCrit: false, isDodge: true };
    }

    let amount = attacker.stats.attack;

    const critRoll = Math.random();
    let isCrit = false;
    if (critRoll < attacker.stats.critRate) {
      amount *= 2;
      isCrit = true;
    }

    if (defender.stats.defense > 0) {
      const reduction = Math.min(defender.stats.defense, 50);
      amount = Math.round(amount * (1 - reduction / 100));
    }

    const levelMult = getLevelMultiplier(attacker.level, defender.level);
    amount = Math.round(amount * levelMult);

    return { amount, isCrit, isDodge: false };
  }

  applyDamage(
    target: { health: number; takeDamage(amount: number): void },
    amount: number,
  ): void {
    target.takeDamage(amount);
  }

  static getRandomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  getXPForKill(killerLevel: number, targetLevel: number): number {
    const base = 50;
    const diff = targetLevel - killerLevel;

    let multiplier = 1;

    if (diff > 0) {
      multiplier = 1 + Math.min(diff, 5) * 0.1;
    } else if (diff < 0) {
      multiplier = Math.max(1 + diff * 0.1, 0.1);
    }

    return Math.floor(base * multiplier);
  }
}

export function getLevelMultiplier(attackerLevel: number, defenderLevel: number): number {
  const diff = attackerLevel - defenderLevel;
  return 1 + Math.max(-0.5, Math.min(0.5, diff * 0.05));
}
