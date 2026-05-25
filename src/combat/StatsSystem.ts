import type { BaseStats, BonusStats, DerivedStats } from '../types/index.js';

export function computeDerived(base: BaseStats, bonus: BonusStats): DerivedStats {
  return {
    maxHp: base.vit * 10,
    attack: base.str * 2 + bonus.attack,
    defense: Math.min(bonus.defense, 50),
    critRate: base.agi * 0.005 + bonus.critRate,
    dodgeRate: base.agi * 0.003 + bonus.dodgeRate,
  };
}
