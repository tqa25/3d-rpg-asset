import { describe, it, expect } from 'vitest';
import { computeDerived } from '../combat/StatsSystem.js';

describe('StatsSystem', () => {
  it('returns zero derived stats when base and bonus are all zero', () => {
    const result = computeDerived({ str: 0, vit: 0, agi: 0 }, { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 });
    expect(result.maxHp).toBe(0);
    expect(result.attack).toBe(0);
    expect(result.defense).toBe(0);
    expect(result.critRate).toBe(0);
    expect(result.dodgeRate).toBe(0);
  });

  it('computes maxHp from vit * 10', () => {
    const result = computeDerived({ str: 0, vit: 5, agi: 0 }, { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 });
    expect(result.maxHp).toBe(50);
  });

  it('computes attack from str * 2 plus bonus', () => {
    const result = computeDerived({ str: 8, vit: 0, agi: 0 }, { attack: 3, defense: 0, critRate: 0, dodgeRate: 0 });
    expect(result.attack).toBe(19);
  });

  it('computes critRate from agi * 0.005', () => {
    const result = computeDerived({ str: 0, vit: 0, agi: 20 }, { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 });
    expect(result.critRate).toBe(0.1);
  });

  it('computes dodgeRate from agi * 0.003', () => {
    const result = computeDerived({ str: 0, vit: 0, agi: 20 }, { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 });
    expect(result.dodgeRate).toBe(0.06);
  });

  it('caps defense at 50', () => {
    const result = computeDerived({ str: 0, vit: 0, agi: 0 }, { attack: 0, defense: 100, critRate: 0, dodgeRate: 0 });
    expect(result.defense).toBe(50);
  });

  it('adds bonus critRate and dodgeRate to base', () => {
    const result = computeDerived({ str: 0, vit: 0, agi: 0 }, { attack: 0, defense: 0, critRate: 0.15, dodgeRate: 0.1 });
    expect(result.critRate).toBe(0.15);
    expect(result.dodgeRate).toBe(0.1);
  });
});
