import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Engine } from './core/Engine.js';
import { initPhysics } from './core/Physics.js';
import { InputManager } from './core/InputManager.js';
import { AssetLoader } from './assets/AssetLoader.js';
import { loadAssetConfig } from './assets/AssetConfig.js';
import { AssetRegistry } from './assets/AssetRegistry.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { WorldScene } from './world/WorldScene.js';
import { Character } from './character/Character.js';
import { MovementController } from './character/MovementController.js';
import { CameraController } from './camera/CameraController.js';
import { HUD } from './ui/HUD.js';
import { VirtualJoystick } from './ui/VirtualJoystick.js';
import { AttackButton } from './ui/AttackButton.js';
import { CharacterState } from './types/index.js';
import { HitboxController } from './combat/HitboxController.js';
import { DamageSystem } from './combat/DamageSystem.js';
import { computeDerived } from './combat/StatsSystem.js';
import { MOB_CONFIGS } from './combat/mobConfigs.js';
import { MobAIController } from './combat/MobAIController.js';
import { TargetingSystem } from './combat/TargetingSystem.js';

async function main(): Promise<void> {
  const loadingScreen = new LoadingScreen();
  loadingScreen.setText('Initializing...');

  const container = document.getElementById('game-container')!;
  const engine = Engine.create(container);
  const scene = engine.getScene();
  const camera = engine.getCamera();

  loadingScreen.setText('Initializing physics...');
  const physics = await initPhysics();

  const inputManager = new InputManager();
  const world = new WorldScene(scene);
  world.init();

  // ============ Create player (placeholder box) ============
  const placeholderMat = new THREE.MeshStandardMaterial({ color: 0x4ecca3, emissive: 0x4ecca3, emissiveIntensity: 0.1 });
  const placeholderMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.6), placeholderMat);
  placeholderMesh.position.set(0, 1, 0);
  placeholderMesh.castShadow = true;
  scene.add(placeholderMesh);

  const playerStats = computeDerived(
    { str: 5, vit: 10, agi: 5 },
    { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 },
  );

  const player = new Character(scene, 'player', {
    speed: 5,
    stats: playerStats,
  });
  player.setModel(new THREE.Group().add(placeholderMesh));
  player.playAnimation('Idle');

  const bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
    .setTranslation(0, 0.5, 0);
  const body = physics.world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1.0, 0.5)
    .setTranslation(0, 1.0, 0);
  const collider = physics.world.createCollider(colliderDesc, body);
  player.setRigidBody(body, collider);

  const movementController = new MovementController(player);

  const cameraController = new CameraController(camera, scene);
  cameraController.setTarget(placeholderMesh);
  cameraController.setOffset(new THREE.Vector3(0, 8, 12));
  cameraController.reset();

  const hud = new HUD();
  hud.setCamera(camera);
  hud.updateHP(player.health, player.maxHealth);

  const joystick = new VirtualJoystick((x, z) => {
    inputManager.setJoystickInput(x, z);
  });

  const attackBtn = new AttackButton((pressed) => {
    inputManager.setTouchAttackPressed(pressed);
  });

  // ============ Spawn mobs ============
  const mobControllers: MobAIController[] = [];
  const mobColors = [0xe94560, 0xff6b35, 0x8e44ad, 0x2ecc71, 0xf1c40f];

  const hitboxCtrl = new HitboxController(physics.world);
  hitboxCtrl.registerEntityCollider('player', collider);
  hitboxCtrl.registerHitbox(
    'player_attack', body,
    { x: 0, y: 1, z: 1.5 }, { x: 1.0, y: 1.0, z: 1.0 },
    0.1, 0.5,
  );

  const SPAWN_MARGIN = 3;

  function getSpawnPosition(): { x: number; z: number } {
    const b = world.getBounds();
    let x: number, z: number;
    do {
      x = b.minX + SPAWN_MARGIN + Math.random() * (b.maxX - b.minX - SPAWN_MARGIN * 2);
      z = b.minZ + SPAWN_MARGIN + Math.random() * (b.maxZ - b.minZ - SPAWN_MARGIN * 2);
    } while (Math.abs(x) < SPAWN_MARGIN && Math.abs(z) < SPAWN_MARGIN);
    return { x, z };
  }

  // Spawn 3-5 mobs, cycling through configs
  const mobCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < mobCount; i++) {
    const cfg = MOB_CONFIGS[i % MOB_CONFIGS.length];
    const spawn = getSpawnPosition();
    const idx = i % mobColors.length;

    const mobStats = computeDerived(cfg.stats, { attack: 0, defense: 0, critRate: 0, dodgeRate: 0 });

    const mobMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: mobColors[idx] }),
    );
    mobMesh.position.set(spawn.x, 1, spawn.z);
    mobMesh.castShadow = true;
    scene.add(mobMesh);

    const mobChar = new Character(scene, `mob_${i}`, {
      speed: cfg.speed,
      stats: mobStats,
      level: cfg.level,
      attackCooldown: cfg.attackCooldown,
    });
    mobChar.setModel(new THREE.Group().add(mobMesh));

    const mobBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
      .setTranslation(spawn.x, 0.5, spawn.z);
    const mobBody = physics.world.createRigidBody(mobBodyDesc);
    const mobColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1.0, 0.5)
      .setTranslation(0, 1.0, 0);
    const mobCollider = physics.world.createCollider(mobColliderDesc, mobBody);
    mobChar.setRigidBody(mobBody, mobCollider);
    hitboxCtrl.registerEntityCollider(`mob_${i}`, mobCollider);

    const controller = new MobAIController(mobChar, cfg, new THREE.Vector3(spawn.x, 0.5, spawn.z), mobMesh);
    mobControllers.push(controller);
  }

  // ============ Targeting system ============
  const targetingSystem = new TargetingSystem();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  engine.renderer.domElement.addEventListener('pointerdown', (e) => {
    const rect = engine.renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // Collect all descendant meshes from mob controllers (handles both Mesh and Group)
    const mobTargets = new Map<THREE.Object3D, MobAIController>();
    for (const c of mobControllers) {
      if (c.isDead()) continue;
      c.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          mobTargets.set(child, c);
        }
      });
    }
    const intersects = raycaster.intersectObjects([...mobTargets.keys()], false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const controller = mobTargets.get(hitMesh);
      if (controller) {
        targetingSystem.selectTarget(controller.character.id, controller.character.getPosition());
      }
    } else {
      targetingSystem.clearTarget();
    }
  });

  const damageSystem = new DamageSystem();
  let attackKeyWasDown = false;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) movementController.reset();
  });

  // ============ Game loop (starts immediately) ============
  engine.addUpdateFn((dt) => {
    physics.step(dt);

    const input = inputManager.getCombinedInput();
    movementController.handleMovement(input, dt);

    const attackDown = inputManager.isAttackPressed();
    if (attackDown && !attackKeyWasDown) {
      player.attack();
    }
    attackKeyWasDown = attackDown;

    // Sync mesh position from physics body
    if (player.body && player.mesh) {
      const t = player.body.translation();
      const bounds = world.getBounds();
      const cx = Math.max(bounds.minX, Math.min(bounds.maxX, t.x));
      const cz = Math.max(bounds.minZ, Math.min(bounds.maxZ, t.z));
      player.mesh.position.set(cx, t.y, cz);
    }

    player.update(dt);
    cameraController.update(dt);
    hud.updateHP(player.health, player.maxHealth);

    // Player attack hitbox — active whenever player is in Attack state
    // HitboxController handles the active window + prevents double-hit
    if (player.fsm.getState() === CharacterState.Attack) {
      const animTime = player.mixer?.time ?? 0;
      for (const id of hitboxCtrl.update(dt, animTime, 'player')) {
        const mobController = mobControllers.find(m => m.character.id === id);
        if (mobController && !mobController.isDead()) {
          const r = damageSystem.calculateDamage(
            { level: player.level, stats: player.stats },
            { level: mobController.character.level, stats: mobController.character.stats },
          );
          if (!r.isDodge) {
            mobController.character.takeDamage(r.amount);
            hud.showDamage(r.amount, r.isCrit, mobController.mesh.position);
            if (mobController.character.isDead) {
              mobController.die();
            }
          }
        }
      }
    }

    // Auto-attack via targeting system
    const mobPositions = mobControllers.map(m => ({
      id: m.character.id,
      position: m.character.getPosition(),
      isDead: m.isDead(),
    }));
    targetingSystem.update(dt, player, mobPositions, player.level, player.stats);

    // Update each mob AI
    for (const mobController of mobControllers) {
      if (mobController.isDead()) continue;

      const action = mobController.update(dt, player.getPosition(), player.level, player.stats);
      if (action && action.type === 'attack' && !action.result.isDodge) {
        player.takeDamage(action.result.amount);
        hud.showDamage(action.result.amount, action.result.isCrit, mobController.character.getPosition());
      }
    }
  });

  loadingScreen.hide();
  engine.start();

  // ============ Load real FBX assets in background ============
  loadRealPlayerModel(scene, player, cameraController, loadingScreen, mobControllers);
}

async function loadRealPlayerModel(
  scene: THREE.Scene,
  player: Character,
  cameraController: CameraController,
  loadingScreen: LoadingScreen,
  mobControllers: MobAIController[],
): Promise<void> {
  try {
    loadingScreen.setText('Loading 3D model...');
    loadingScreen.show();

    const assetConfig = await loadAssetConfig();
    const assetLoader = new AssetLoader();
    let total = 0;
    for (const c of Object.values(assetConfig.characters)) {
      total += 1 + Object.keys(c.animations).length;
    }
    assetLoader.setOnProgress((loaded, _total) => {
      loadingScreen.setProgress(loaded, total);
    });

    await assetLoader.loadAll(assetConfig);

    const registry = AssetRegistry.getInstance();

    // === Upgrade player to vibe_knight model ===
    const knightCfg = assetConfig.characters['vibe_knight'];
    const knightModel = registry.get('vibe_knight_model') as THREE.Group;
    knightModel.scale.set(knightCfg.scale, knightCfg.scale, knightCfg.scale);

    knightModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const oldPos = player.getPosition();
    knightModel.position.copy(oldPos);

    player.setModel(knightModel);
    for (const [key] of Object.entries(knightCfg.animations)) {
      const clip = registry.get(`vibe_knight_anim_${key}`);
      if (clip) {
        const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        player.addAnimation(normalizedKey, clip);
      }
    }
    player.playAnimation('Idle');

    cameraController.setTarget(knightModel);
    cameraController.reset();

    // === Upgrade mobs to zombie_girl model ===
    const zombCfg = assetConfig.characters['zombie_girl'];
    if (zombCfg) {
      const zombModelProto = registry.get('zombie_girl_model') as THREE.Group;
      for (const mc of mobControllers) {
        if (mc.isDead()) continue;

        const clone = zombModelProto.clone(true);
        clone.scale.set(zombCfg.scale, zombCfg.scale, zombCfg.scale);

        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const oldMobPos = mc.character.getPosition();
        clone.position.copy(oldMobPos);

        const mobChar = mc.character;
        mobChar.setModel(clone);
        for (const [key] of Object.entries(zombCfg.animations)) {
          const clip = registry.get(`zombie_girl_anim_${key}`);
          if (clip) {
            const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            mobChar.addAnimation(normalizedKey, clip);
          }
        }
        mobChar.playAnimation('Idle');

        mc.mesh = clone;
      }
    }

    loadingScreen.hide();
  } catch (err) {
    console.warn('Failed to load 3D model, using placeholder:', err);
    loadingScreen.hide();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  const ls = new LoadingScreen();
  ls.setText(`Failed: ${err instanceof Error ? err.message : String(err)}`);
});
