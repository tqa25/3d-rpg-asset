export class AssetRegistry {
  private static _instance: AssetRegistry;

  static getInstance(): AssetRegistry {
    if (!AssetRegistry._instance) {
      AssetRegistry._instance = new AssetRegistry();
    }
    return AssetRegistry._instance;
  }

  private store = new Map<string, any>();

  private constructor() {}

  set(key: string, asset: any): void {
    this.store.set(key, asset);
  }

  get(key: string): any | undefined {
    return this.store.get(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  getAll(): Map<string, any> {
    return new Map(this.store);
  }
}
