import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js';
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
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (group) => resolve(group),
        undefined,
        (err) => reject(new Error(`FBX load failed for ${url}: ${errMsg(err)}`)),
      );
    });
  }

  loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
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

    for (const [charId, charConfig] of Object.entries(config.characters)) {
      const modelUrl = this.resolveUrl(charConfig.modelUrl);

      // Load base model
      const model = await this.loadFBX(modelUrl);
      registry.set(`${charId}_model`, model);

      // Extract skeleton from the model's SkinnedMesh
      let targetSkinned: THREE.SkinnedMesh | undefined;
      model.traverse((child) => {
        const mesh = child as THREE.SkinnedMesh;
        if (mesh.isSkinnedMesh) {
          targetSkinned = mesh;
        }
      });

      // Load and retarget each animation
      for (const [animKey, animUrl] of Object.entries(charConfig.animations)) {
        const resolvedUrl = this.resolveUrl(animUrl);
        const fbx = await this.loadFBX(resolvedUrl);

        if (!fbx.animations || fbx.animations.length === 0) {
          console.warn(`No animations found in ${animUrl}`);
          continue;
        }

        let clip = fbx.animations[0];

        if (targetSkinned && targetSkinned.skeleton) {
          const animBones: THREE.Bone[] = [];
          fbx.traverse((child) => {
            const bone = child as THREE.Bone;
            if (bone.isBone) {
              animBones.push(bone);
            }
          });

          if (animBones.length > 0) {
            const sourceSkeleton = new THREE.Skeleton(animBones);
            const sourceHelper = new THREE.Group() as THREE.Group & { skeleton: THREE.Skeleton };
            sourceHelper.skeleton = sourceSkeleton;

            try {
              clip = retargetClip(targetSkinned, sourceHelper, clip);
            } catch (e) {
              console.warn(`retargetClip failed for ${animUrl}, using original clip:`, e);
            }
          }
        }

        registry.set(`${charId}_anim_${animKey}`, clip);
      }

      registry.set(`${charId}_config`, charConfig);
    }
  }
}
