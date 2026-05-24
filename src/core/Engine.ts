import * as THREE from 'three';

const MAX_DT = 1 / 20;

export class Engine {
  private static _instance: Engine | null = null;

  static getInstance(): Engine {
    if (!Engine._instance) throw new Error('Engine not initialized. Call Engine.create(container) first.');
    return Engine._instance;
  }

  static create(container: HTMLElement): Engine {
    if (Engine._instance) {
      Engine._instance.dispose();
    }
    Engine._instance = new Engine(container);
    return Engine._instance;
  }

  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly scene: THREE.Scene;

  private updateFns: ((dt: number) => void)[] = [];
  private rafId: number = 0;
  private lastTime: number = 0;
  private running = false;
  private hidden = false;

  private constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1a1a2e');

    this.resize = this.resize.bind(this);
    this.visibilityChange = this.visibilityChange.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.visibilityChange);
  }

  addUpdateFn(fn: (dt: number) => void): void {
    this.updateFns.push(fn);
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  resize(): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private visibilityChange(): void {
    this.hidden = document.hidden;
    if (!this.hidden) {
      this.lastTime = performance.now();
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(now: number): void {
    this.rafId = requestAnimationFrame(this.loop);

    if (this.hidden) {
      this.render();
      return;
    }

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, MAX_DT);

    for (let i = 0; i < this.updateFns.length; i++) {
      this.updateFns[i](dt);
    }

    this.render();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibilityChange);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.updateFns.length = 0;
    if (Engine._instance === this) {
      Engine._instance = null;
    }
  }
}
