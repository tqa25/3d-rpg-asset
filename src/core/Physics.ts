import RAPIER from '@dimforge/rapier3d-compat';

const FIXED_DT = 1 / 60;
const MAX_STEPS = 4;

export interface PhysicsWorld {
  world: RAPIER.World;
  step(dt: number): void;
}

export async function initPhysics(): Promise<PhysicsWorld> {
  await RAPIER.init();

  const gravity = { x: 0, y: -9.81, z: 0 };
  const world = new RAPIER.World(gravity);

  let accumulator = 0;

  const step = (dt: number): void => {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      world.step();
      accumulator -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS) {
      accumulator = 0;
    }
  };

  return { world, step };
}
