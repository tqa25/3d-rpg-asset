export class DamageSystem {
  calculateDamage(
    attacker: { attackDamage: number },
    defender: { defense?: number },
  ): { amount: number; isCrit: boolean; isDodge: boolean } {
    const rand = Math.random();

    if (rand < 0.1) {
      return { amount: 0, isCrit: false, isDodge: true };
    }

    let amount = attacker.attackDamage;
    let isCrit = false;

    if (Math.random() < 0.15) {
      amount *= 2;
      isCrit = true;
    }

    if (defender.defense !== undefined && defender.defense > 0) {
      const reduction = Math.min(defender.defense, 50);
      amount = Math.round(amount * (1 - reduction / 100));
    }

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
