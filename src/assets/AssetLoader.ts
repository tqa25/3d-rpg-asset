import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AssetConfig } from '../types/index.js';
import { AssetRegistry } from './AssetRegistry.js';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export class AssetLoader {
  private manager: THREE.LoadingManager;
  private fbxLoader: FBXLoader;
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private _loaded = 0;
  private _total = 0;
  private onProgressCb: ((loaded: number, total: number) => void) | null = null;

  constructor() {
    THREE.Cache.enabled = true;
    this.manager = new THREE.LoadingManager();

    this.manager.onProgress = (_url: string, loaded: number, total: number) => {
      this._loaded = loaded;
      this._total = total;
      this.onProgressCb?.(loaded, total);
    };

    this.manager.onError = (url: string) => {
      console.error(`AssetLoader error loading: ${url}`);
    };

    this.fbxLoader = new FBXLoader(this.manager);
    this.gltfLoader = new GLTFLoader(this.manager);
    this.textureLoader = new THREE.TextureLoader(this.manager);
  }

  setOnProgress(cb: (loaded: number, total: number) => void): void {
    this.onProgressCb = cb;
  }

  getProgress(): { loaded: number; total: number } {
    return { loaded: this._loaded, total: this._total };
  }

  loadFBX(url: string): Promise<THREE.Group> {
    console.log(`[FBX] Đang tải: ${url}`);
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (group) => {
          console.log(`[FBX] ✅ Tải xong: ${url}`);
          resolve(group);
        },
        undefined,
        (err) => reject(new Error(`FBX load failed for ${url}: ${errMsg(err)}`)),
      );
    });
  }

  loadGLTF(url: string): Promise<THREE.Group> {
    console.log(`[GLTF] Đang tải: ${url}`);
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          console.log(`[GLTF] ✅ Tải xong: ${url}`);
          resolve(gltf.scene);
        },
        undefined,
        (err) => reject(new Error(`GLTF load failed for ${url}: ${errMsg(err)}`)),
      );
    });
  }

  loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => resolve(texture),
        undefined,
        (err) => reject(new Error(`Texture load failed for ${url}: ${errMsg(err)}`)),
      );
    });
  }

  private resolveUrl(path: string): string {
    const base = import.meta.env.BASE_URL || '/';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return base + path;
  }

  async loadAll(config: AssetConfig): Promise<void> {
    const registry = AssetRegistry.getInstance();

    const jobs: Promise<void>[] = [];

    for (const [charId, charConfig] of Object.entries(config.characters)) {
      console.log(`[FBX] 🔄 Lên lịch tải cho nhân vật: ${charId}`);
      const modelUrl = this.resolveUrl(charConfig.modelUrl);
      const isGLTF = /\.glb$/i.test(modelUrl) || /\.gltf$/i.test(modelUrl);
      if (isGLTF) {
        jobs.push(
          this.loadGLTF(modelUrl).then((model) => {
            registry.set(`${charId}_model`, model);
            console.log(`[GLTF] 📦 Lưu registry: ${charId}_model`);
          }),
        );
      } else {
        jobs.push(
          this.loadFBX(modelUrl).then((model) => {
            registry.set(`${charId}_model`, model);
            console.log(`[FBX] 📦 Lưu registry: ${charId}_model`);
          }),
        );
      }

      for (const [animKey, animUrl] of Object.entries(charConfig.animations)) {
        const resolvedUrl = this.resolveUrl(animUrl);
        jobs.push(
          this.loadFBX(resolvedUrl).then((fbx) => {
            if (fbx.animations && fbx.animations.length > 0) {
              registry.set(`${charId}_anim_${animKey}`, fbx.animations[0]);
              console.log(`[FBX] 📦 Lưu registry: ${charId}_anim_${animKey}`);
            }
          }),
        );
      }

      registry.set(`${charId}_config`, charConfig);
      console.log(`[FBX] ⚙️ Lưu registry: ${charId}_config`);
    }

    const results = await Promise.allSettled(jobs);
    let hasFailures = false;
    for (const r of results) {
      if (r.status === 'rejected') {
        console.warn('AssetLoader: individual asset load failed:', r.reason);
        hasFailures = true;
      }
    }
    if (hasFailures) {
      console.warn('AssetLoader: some assets failed to load, using partial results');
    }
  }
}
