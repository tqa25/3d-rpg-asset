import type { BaseStats } from '../types/index.js';

export interface MobConfig {
  id: string;
  name: string;
  level: number;
  stats: BaseStats;
  speed: number;
  attackRange: number;
  detectionRange: number;
  leashRange: number;
  patrolRadius: number;
  respawnDelay: number;
  attackCooldown: number;
}

export const MOB_CONFIGS: MobConfig[] = [
  {
    id: 'slime',
    name: 'Slime',
    level: 1,
    stats: { str: 2, vit: 3, agi: 1 },
    speed: 1.5,
    attackRange: 1.5,
    detectionRange: 6,
    leashRange: 12,
    patrolRadius: 4,
    respawnDelay: 5,
    attackCooldown: 2.0,
  },
  {
    id: 'wolf',
    name: 'Wolf',
    level: 2,
    stats: { str: 4, vit: 3, agi: 4 },
    speed: 2.5,
    attackRange: 2.0,
    detectionRange: 8,
    leashRange: 14,
    patrolRadius: 5,
    respawnDelay: 5,
    attackCooldown: 1.5,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    level: 3,
    stats: { str: 6, vit: 4, agi: 2 },
    speed: 2.0,
    attackRange: 2.5,
    detectionRange: 8,
    leashRange: 14,
    patrolRadius: 5,
    respawnDelay: 6,
    attackCooldown: 1.5,
  },
  {
    id: 'orc',
    name: 'Orc',
    level: 4,
    stats: { str: 8, vit: 6, agi: 3 },
    speed: 1.8,
    attackRange: 2.5,
    detectionRange: 10,
    leashRange: 16,
    patrolRadius: 4,
    respawnDelay: 6,
    attackCooldown: 1.2,
  },
  {
    id: 'dark_knight',
    name: 'Dark Knight',
    level: 5,
    stats: { str: 12, vit: 8, agi: 4 },
    speed: 2.0,
    attackRange: 3.0,
    detectionRange: 10,
    leashRange: 16,
    patrolRadius: 5,
    respawnDelay: 8,
    attackCooldown: 1.0,
  },
];
