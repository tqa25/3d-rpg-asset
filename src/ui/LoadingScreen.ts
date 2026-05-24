export class LoadingScreen {
  private el: HTMLElement | null;
  private bar: HTMLElement | null;
  private text: HTMLElement | null;

  constructor() {
    this.el = document.getElementById('loading-screen');
    this.bar = document.getElementById('loading-bar') ?? null;
    this.text = document.getElementById('loading-text') ?? null;
  }

  setProgress(loaded: number, total: number): void {
    if (!this.bar) return;
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    this.bar.style.width = `${pct}%`;
    this.bar.textContent = `${pct}%`;
  }

  setText(text: string): void {
    if (!this.text) return;
    this.text.textContent = text;
  }

  hide(): void {
    this.el?.classList.add('hidden');
  }

  show(): void {
    this.el?.classList.remove('hidden');
  }
}
