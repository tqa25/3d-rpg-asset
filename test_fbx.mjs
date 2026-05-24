import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Minimal DOM mock for FBXLoader
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement: () => ({}) };
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = await res.arrayBuffer();
  console.log(`Fetched ${url}: ${buf.byteLength} bytes`);
  return buf;
}

async function main() {
  const loader = new FBXLoader();

  // Load base model
  console.log('\n=== Loading Hero_base.fbx ===');
  const heroBuf = await fetchBuffer('http://localhost:5173/assets/Hero_base.fbx');
  const heroGroup = loader.parse(heroBuf, '/assets/');

  console.log('Children:', heroGroup.children.length);

  // Find bones
  const bones = [];
  heroGroup.traverse(c => { if (c.isBone) bones.push(c); });
  console.log('Bones:', bones.length);
  if (bones.length > 0) {
    console.log('Bone names:', bones.map(b => b.name).join(', '));
  }

  // Find skeleton
  let skeleton = null;
  heroGroup.traverse(c => { if (c.isSkinnedMesh) skeleton = c.skeleton; });
  if (skeleton) {
    console.log('Skeleton bones count:', skeleton.bones.length);
    console.log('Skeleton bone names:', skeleton.bones.map(b => b.name).join(', '));
  } else {
    // Check for bones in hierarchy
    console.log('No SkinnedMesh found. Checking hierarchy...');
    heroGroup.traverse(c => {
      if (c.isSkinnedMesh === false && c.type) {
        console.log(`  ${c.type}: "${c.name}"`);
      }
    });
    // Try to find bones in children
    for (const child of heroGroup.children) {
      console.log(`  Root child: ${child.type} "${child.name}"`);
      const subBones = [];
      child.traverse(c => { if (c.isBone) subBones.push(c); });
      if (subBones.length > 0) {
        console.log(`    Sub-bones: ${subBones.length} - ${subBones.map(b => b.name).join(', ')}`);
      }
    }
  }

  console.log('Hero animations:', heroGroup.animations?.length ?? 0);

  // Now load each animation file
  for (const animName of ['Idle', 'Run', 'Attack', 'Hit', 'Die']) {
    const url = `http://localhost:5173/assets/${animName}.fbx`;
    console.log(`\n=== Loading ${animName}.fbx ===`);
    try {
      const buf = await fetchBuffer(url);
      const group = loader.parse(buf, '/assets/');
      console.log('Anim clips:', group.animations?.length ?? 0);
      if (group.animations?.length > 0) {
        const clip = group.animations[0];
        console.log('Clip name:', clip.name);
        console.log('Duration:', clip.duration);
        console.log('Tracks:', clip.tracks.length);
        clip.tracks.slice(0, 5).forEach(t => {
          console.log(`  Track: "${t.name}" (${t.constructor.name})`);
        });

        // Check how many tracks match skeleton bone names
        if (skeleton) {
          const skelNames = new Set(skeleton.bones.map(b => b.name));
          let matching = 0;
          let nonMatching = [];
          for (const t of clip.tracks.slice(0, 10)) {
            // Track name format: "nodeName.property"
            const dotIdx = t.name.indexOf('.');
            const trackBone = dotIdx >= 0 ? t.name.substring(0, dotIdx) : t.name;
            if (skelNames.has(trackBone)) matching++;
            else nonMatching.push(trackBone);
          }
          console.log(`Matching bone tracks: ${matching}/${Math.min(10, clip.tracks.length)}`);
          if (nonMatching.length > 0) {
            console.log('Non-matching bone refs:', nonMatching.slice(0, 5).join(', '));
          }
        }
      } else {
        // Check what's in the group
        console.log('Group children:', group.children.length);
        const groupBones = [];
        group.traverse(c => { if (c.isBone) groupBones.push(c); });
        console.log('Bones in group:', groupBones.length);
        if (groupBones.length > 0) {
          console.log('Bone names:', groupBones.slice(0, 5).map(b => b.name).join(', '));
        }
        // Maybe animations are on children
        for (const child of group.children) {
          if (child.animations?.length) {
            console.log(`Child "${child.name}" has ${child.animations.length} animations`);
          }
        }
      }
    } catch (err) {
      console.error(`Error loading ${animName}.fbx:`, err.message);
    }
  }

  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
