const MAX_RADIUS = 30;
const BASE_SIZE = 120;
const THUMB_SIZE = 50;

export class VirtualJoystick {
  private base: HTMLElement;
  private thumb: HTMLElement;
  private container: HTMLElement;
  private active = false;
  private baseCenterX = 0;
  private baseCenterY = 0;
  private onInput: (x: number, z: number) => void;
  private onPointerDown: (e: PointerEvent) => void;
  private onPointerMove: (e: PointerEvent) => void;
  private onPointerUp: (e: PointerEvent) => void;

  constructor(onInput: (x: number, z: number) => void, container?: HTMLElement) {
    this.onInput = onInput;
    this.container = container ?? document.body;

    this.base = document.createElement('div');
    this.base.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: ${BASE_SIZE}px;
      height: ${BASE_SIZE}px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.1);
      z-index: 100;
      touch-action: none;
      cursor: pointer;
    `;

    this.thumb = document.createElement('div');
    this.thumb.style.cssText = `
      position: absolute;
      width: ${THUMB_SIZE}px;
      height: ${THUMB_SIZE}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      pointer-events: none;
      top: ${(BASE_SIZE - THUMB_SIZE) / 2}px;
      left: ${(BASE_SIZE - THUMB_SIZE) / 2}px;
      transition: transform 0.05s;
    `;

    this.base.appendChild(this.thumb);
    this.container.appendChild(this.base);

    this.onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      this.base.setPointerCapture(e.pointerId);
      const rect = this.base.getBoundingClientRect();
      this.baseCenterX = rect.left + rect.width / 2;
      this.baseCenterY = rect.top + rect.height / 2;
      this.active = true;
      this.handleMove(e.clientX, e.clientY);
    };

    this.onPointerMove = (e: PointerEvent) => {
      if (!this.active) return;
      e.preventDefault();
      this.handleMove(e.clientX, e.clientY);
    };

    this.onPointerUp = (e: PointerEvent) => {
      if (!this.active) return;
      e.preventDefault();
      this.active = false;
      this.thumb.style.transform = 'translate(0px, 0px)';
      this.onInput(0, 0);
    };

    this.base.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private handleMove(clientX: number, clientY: number): void {
    let dx = clientX - this.baseCenterX;
    let dy = clientY - this.baseCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS;
      dy = (dy / dist) * MAX_RADIUS;
    }

    const normalizedX = dist > 0 ? dx / MAX_RADIUS : 0;
    const normalizedZ = dist > 0 ? -(dy / MAX_RADIUS) : 0;
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedZ = Math.max(-1, Math.min(1, normalizedZ));

    this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    this.onInput(clampedX, clampedZ);
  }

  setVisible(visible: boolean): void {
    this.base.style.display = visible ? '' : 'none';
  }

  dispose(): void {
    this.base.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.base.remove();
  }
}
