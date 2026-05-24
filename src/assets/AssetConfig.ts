import type { AssetConfig } from '../types/index.js';

export type { AssetConfig, CharacterConfig } from '../types/index.js';

export async function loadAssetConfig(): Promise<AssetConfig> {
  const base = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${base}assets/assets-config.json`);
  if (!response.ok) {
    throw new Error(
      `Failed to load asset config: ${response.status} ${response.statusText}`,
    );
  }
  try {
    const data = (await response.json()) as AssetConfig;
    return data;
  } catch (err) {
    throw new Error(
      `Invalid asset config JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
