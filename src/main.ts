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
import { CharacterState } from './types/index.js';
import { HitboxController } from './combat/HitboxController.js';
import { DamageSystem } from './combat/DamageSystem.js';

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

  const player = new Character(scene, 'player', {
    speed: 5,
    maxHealth: 100,
    attackDamage: 15,
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

  // ============ Enemy (box) ============
  const enemyMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xe94560 }),
  );
  enemyMesh.position.set(5, 1, 5);
  enemyMesh.castShadow = true;
  scene.add(enemyMesh);

  const enemy = new Character(scene, 'enemy_1', {
    speed: 0,
    maxHealth: 50,
    attackDamage: 5,
  });

  const enemyBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(5, 0.5, 5);
  const enemyBody = physics.world.createRigidBody(enemyBodyDesc);
  const enemyColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1.0, 0.5).setTranslation(0, 1.0, 0);
  const enemyCollider = physics.world.createCollider(enemyColliderDesc, enemyBody);
  enemy.setRigidBody(enemyBody, enemyCollider);

  const hitboxCtrl = new HitboxController(physics.world);
  hitboxCtrl.registerEntityCollider('player', collider);
  hitboxCtrl.registerEntityCollider('enemy_1', enemyCollider);
  hitboxCtrl.registerHitbox(
    'player_attack', body,
    { x: 0, y: 1, z: 1.5 }, { x: 1.0, y: 1.0, z: 1.0 },
    0.1, 0.5,
  );

  const damageSystem = new DamageSystem();
  let attackTriggered = false;
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
      attackTriggered = true;
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

    if (player.fsm.getState() === CharacterState.Attack && attackTriggered) {
      const animTime = player.mixer?.time ?? 0;
      for (const id of hitboxCtrl.update(dt, animTime, 'player')) {
        if (id === 'enemy_1') {
          const r = damageSystem.calculateDamage({ attackDamage: player.attackDamage }, {});
          if (!r.isDodge) {
            enemy.takeDamage(r.amount);
            hud.showDamage(r.amount, r.isCrit, enemyMesh.position);
          }
        }
      }
      attackTriggered = false;
    }

    if (enemy.fsm.getState() !== CharacterState.Attack &&
        enemy.fsm.getState() !== CharacterState.Hit &&
        enemy.fsm.getState() !== CharacterState.Die) {
      const dist = enemy.getPosition().distanceTo(player.getPosition());
      if (dist < 2.5) {
        enemy.attack();
        const r = damageSystem.calculateDamage({ attackDamage: enemy.attackDamage }, {});
        if (!r.isDodge) {
          player.takeDamage(r.amount);
          hud.showDamage(r.amount, r.isCrit, player.getPosition());
        }
      }
    }
  });

  loadingScreen.hide();
  engine.start();

  // ============ Load real FBX assets in background ============
  loadRealPlayerModel(scene, player, cameraController, loadingScreen);
}

async function loadRealPlayerModel(
  scene: THREE.Scene,
  player: Character,
  cameraController: CameraController,
  loadingScreen: LoadingScreen,
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

    const cfg = assetConfig.characters['vibe_knight'];
    const registry = AssetRegistry.getInstance();
    const model = registry.get('vibe_knight_model') as THREE.Group;
    model.scale.set(cfg.scale, cfg.scale, cfg.scale);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const oldPos = player.getPosition();
    model.position.copy(oldPos);

    player.setModel(model);
    for (const [key] of Object.entries(cfg.animations)) {
      const clip = registry.get(`vibe_knight_anim_${key}`);
      if (clip) player.addAnimation(key, clip);
    }
    player.playAnimation('Idle');

    cameraController.setTarget(model);
    cameraController.reset();

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
