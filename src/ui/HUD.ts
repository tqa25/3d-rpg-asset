import * as THREE from 'three';

export class HUD {
  private container: HTMLElement;
  private hpBar: HTMLElement;
  private hpFill: HTMLElement;
  private hpText: HTMLElement;
  private levelText: HTMLElement;
  private zoneText: HTMLElement;
  private camera: THREE.Camera | null = null;

  constructor(container?: HTMLElement) {
    this.container = container ?? document.getElementById('game-container') ?? document.body;

    const style = document.createElement('style');
    style.textContent = `
      .hud-damage {
        position: fixed;
        pointer-events: none;
        font-weight: bold;
        z-index: 60;
        text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5);
        transition: all 1s ease-out;
      }
    `;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 50;
      user-select: none;
    `;

    this.hpBar = document.createElement('div');
    this.hpBar.style.cssText = `
      width: 200px;
      max-width: 200px;
      height: 24px;
      background: rgba(0,0,0,0.5);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    `;

    this.hpFill = document.createElement('div');
    this.hpFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: #4ecca3;
      border-radius: 4px;
      transition: width 0.3s ease, background 0.3s ease;
    `;
    this.hpBar.appendChild(this.hpFill);

    this.hpText = document.createElement('div');
    this.hpText.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      font-family: sans-serif;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    `;
    this.hpBar.appendChild(this.hpText);

    this.levelText = document.createElement('div');
    this.levelText.style.cssText = `
      color: #fff;
      font-size: 14px;
      opacity: 0.8;
      margin-top: 4px;
      font-family: sans-serif;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    `;
    this.levelText.textContent = 'Lv.1';

    this.zoneText = document.createElement('div');
    this.zoneText.style.cssText = `
      color: #fff;
      font-size: 11px;
      opacity: 0.5;
      margin-top: 2px;
      font-family: sans-serif;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    `;
    this.zoneText.textContent = 'Starting Zone';

    wrapper.appendChild(this.hpBar);
    wrapper.appendChild(this.levelText);
    wrapper.appendChild(this.zoneText);
    this.container.appendChild(wrapper);
  }

  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  updateHP(current: number, max: number): void {
    const pct = max > 0 ? (current / max) * 100 : 0;
    this.hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    this.hpText.textContent = `HP: ${current}/${max}`;

    if (pct <= 25) {
      this.hpFill.style.background = '#e94560';
    } else if (pct <= 50) {
      this.hpFill.style.background = '#ffd700';
    } else {
      this.hpFill.style.background = '#4ecca3';
    }
  }

  updateLevel(level: number): void {
    this.levelText.textContent = `Lv.${level}`;
  }

  updateZone(name: string): void {
    this.zoneText.textContent = name;
  }

  showDamage(amount: number, isCrit: boolean, worldPos: { x: number; y: number; z: number }): void {
    if (!this.camera) return;

    const vec = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    vec.project(this.camera);

    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'hud-damage';
    el.textContent = isCrit ? `CRIT! ${amount}` : `${amount}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = isCrit ? '#ffd700' : '#e94560';
    el.style.fontSize = isCrit ? '20px' : '14px';
    el.style.transform = 'translate(-50%, -50%)';

    this.container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -150%)';
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 1000);
  }

  dispose(): void {
    const els = this.container.querySelectorAll('.hud-damage');
    els.forEach(el => el.remove());
    this.container.querySelectorAll('div').forEach(el => {
      if (el.parentElement === this.container) {
        el.remove();
      }
    });
  }
}
