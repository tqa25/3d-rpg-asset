export enum CharacterState {
  Idle = 'Idle',
  Run = 'Run',
  Attack = 'Attack',
  Hit = 'Hit',
  Die = 'Die',
}

export type TransitionMap = Record<CharacterState, CharacterState[]>;

export interface InputState {
  x: number;
  z: number;
}

export interface EntityData {
  id: string;
  health: number;
  maxHealth: number;
  speed: number;
  attackDamage: number;
  state: CharacterState;
}

export interface CharacterConfig {
  name: string;
  modelUrl: string;
  scale: number;
  animations: Record<string, string>;
}

export interface AssetConfig {
  characters: Record<string, CharacterConfig>;
}
