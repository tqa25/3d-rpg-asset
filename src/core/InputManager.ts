export class InputManager {
  private keys = new Map<string, boolean>();
  private joystickX = 0;
  private joystickZ = 0;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.set(e.code, true);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.code, false);
  }

  private onBlur(): void {
    this.keys.clear();
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.keys.clear();
    }
  }

  isKeyDown(key: string): boolean {
    return this.keys.get(key) ?? false;
  }

  getMovementInput(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) z -= 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) z += 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;

    const len = Math.sqrt(x * x + z * z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  isAttackPressed(): boolean {
    return this.isKeyDown('Space');
  }

  setJoystickInput(x: number, z: number): void {
    this.joystickX = x;
    this.joystickZ = z;
  }

  getCombinedInput(): { x: number; z: number } {
    const jLen = Math.sqrt(this.joystickX * this.joystickX + this.joystickZ * this.joystickZ);
    if (jLen > 0.01) {
      return { x: this.joystickX, z: this.joystickZ };
    }
    return this.getMovementInput();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.keys.clear();
  }
}
