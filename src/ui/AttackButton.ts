const BUTTON_SIZE = 64;

export class AttackButton {
  private el: HTMLElement;
  private onAttack: (pressed: boolean) => void;
  private onPointerDown: (e: PointerEvent) => void;
  private onPointerUp: (e: PointerEvent) => void;
  private onPointerLeave: (e: PointerEvent) => void;

  constructor(onAttack: (pressed: boolean) => void, container?: HTMLElement) {
    this.onAttack = onAttack;
    const c = container ?? document.body;

    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: ${BUTTON_SIZE}px;
      height: ${BUTTON_SIZE}px;
      border-radius: 50%;
      background: rgba(233, 69, 96, 0.85);
      border: 3px solid rgba(255, 255, 255, 0.6);
      color: #fff;
      font-size: 28px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      touch-action: none;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 0 16px rgba(233, 69, 96, 0.4);
      transition: transform 0.1s, background 0.1s;
    `;
    this.el.textContent = '⚔';

    c.appendChild(this.el);

    this.onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      this.el.setPointerCapture(e.pointerId);
      this.el.style.transform = 'scale(0.85)';
      this.el.style.background = 'rgba(200, 40, 70, 0.95)';
      this.onAttack(true);
    };

    this.onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      this.el.style.transform = '';
      this.el.style.background = '';
      this.onAttack(false);
    };

    this.onPointerLeave = (e: PointerEvent) => {
      this.el.style.transform = '';
      this.el.style.background = '';
      this.onAttack(false);
    };

    this.el.addEventListener('pointerdown', this.onPointerDown);
    this.el.addEventListener('pointerup', this.onPointerUp);
    this.el.addEventListener('pointerleave', this.onPointerLeave);
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? '' : 'none';
  }

  dispose(): void {
    this.el.removeEventListener('pointerdown', this.onPointerDown);
    this.el.removeEventListener('pointerup', this.onPointerUp);
    this.el.removeEventListener('pointerleave', this.onPointerLeave);
    this.el.remove();
  }
}
