import { CharacterState } from '../types/index.js';

const TRANSITIONS: Record<CharacterState, CharacterState[]> = {
  [CharacterState.Idle]: [CharacterState.Run, CharacterState.Attack, CharacterState.Hit, CharacterState.Die],
  [CharacterState.Run]: [CharacterState.Idle, CharacterState.Hit, CharacterState.Die],
  [CharacterState.Attack]: [CharacterState.Idle, CharacterState.Die],
  [CharacterState.Hit]: [CharacterState.Idle, CharacterState.Die],
  [CharacterState.Die]: [],
};

export class CharacterFSM {
  private state: CharacterState;

  constructor(initialState: CharacterState = CharacterState.Idle) {
    this.state = initialState;
  }

  transition(to: CharacterState): boolean {
    if (!this.canTransition(to)) return false;
    this.state = to;
    return true;
  }

  getState(): CharacterState {
    return this.state;
  }

  canTransition(to: CharacterState): boolean {
    const allowed = TRANSITIONS[this.state];
    return allowed.includes(to);
  }

  reset(): void {
    this.state = CharacterState.Idle;
  }
}
