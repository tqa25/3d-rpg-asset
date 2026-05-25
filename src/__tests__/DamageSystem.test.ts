import { describe, it, expect } from 'vitest';
import { DamageSystem, getLevelMultiplier } from '../combat/DamageSystem.js';
import type { DerivedStats } from '../types/index.js';

const ds = new DamageSystem();

const baseStats: DerivedStats = { maxHp: 100, attack: 20, defense: 0, critRate: 0, dodgeRate: 0 };

const makeDefender = (overrides?: Partial<DerivedStats>) => ({
  level: 1,
  stats: { ...baseStats, ...overrides },
});

const makeAttacker = (overrides?: Partial<DerivedStats>) => ({
  level: 1,
  stats: { ...baseStats, ...overrides },
});

describe('DamageSystem', () => {
  it('base damage equals attacker.stats.attack when no crit, dodge, or defense', () => {
    const result = ds.calculateDamage(makeAttacker({ attack: 15 }), makeDefender());
    expect(result.amount).toBe(15);
    expect(result.isCrit).toBe(false);
    expect(result.isDodge).toBe(false);
  });

  it('crit doubles damage when critRate is 100%', () => {
    const result = ds.calculateDamage(makeAttacker({ attack: 20, critRate: 1.0 }), makeDefender());
    expect(result.amount).toBe(40);
    expect(result.isCrit).toBe(true);
  });

  it('dodge returns 0 damage when dodgeRate is 100%', () => {
    const result = ds.calculateDamage(makeAttacker({ attack: 20 }), makeDefender({ dodgeRate: 1.0 }));
    expect(result.amount).toBe(0);
    expect(result.isDodge).toBe(true);
  });

  it('defense reduces damage', () => {
    const result = ds.calculateDamage(makeAttacker({ attack: 100 }), makeDefender({ defense: 20 }));
    expect(result.amount).toBe(80);
  });

  it('defense cannot reduce damage below 50% (capped)', () => {
    const result = ds.calculateDamage(makeAttacker({ attack: 100 }), makeDefender({ defense: 60 }));
    expect(result.amount).toBe(50);
  });
});

describe('getLevelMultiplier', () => {
  it('same level gives 1.0 multiplier', () => {
    expect(getLevelMultiplier(5, 5)).toBe(1.0);
  });

  it('+1 level gives 1.05 multiplier', () => {
    expect(getLevelMultiplier(6, 5)).toBe(1.05);
  });

  it('-1 level gives 0.95 multiplier', () => {
    expect(getLevelMultiplier(5, 6)).toBe(0.95);
  });

  it('+10 levels caps at 1.5', () => {
    expect(getLevelMultiplier(15, 5)).toBe(1.5);
  });

  it('-10 levels caps at 0.5', () => {
    expect(getLevelMultiplier(5, 15)).toBe(0.5);
  });
});
