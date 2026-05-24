import RAPIER from '@dimforge/rapier3d-compat';

interface HitboxEntry {
  collider: RAPIER.Collider;
  parentBody: RAPIER.RigidBody;
  offset: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  activeStart: number;
  activeEnd: number;
  hasHit: Set<string>;
}

export class HitboxController {
  private world: RAPIER.World;
  private hitboxes: Map<string, HitboxEntry> = new Map();
  private entityToHandle: Map<string, number> = new Map();
  private handleToEntity: Map<number, string> = new Map();

  constructor(world: RAPIER.World) {
    this.world = world;
  }

  registerEntityCollider(entityId: string, collider: RAPIER.Collider): void {
    const handle = collider.handle;
    this.entityToHandle.set(entityId, handle);
    this.handleToEntity.set(handle, entityId);
  }

  unregisterEntityCollider(entityId: string): void {
    const handle = this.entityToHandle.get(entityId);
    if (handle !== undefined) {
      this.handleToEntity.delete(handle);
    }
    this.entityToHandle.delete(entityId);
  }

  registerHitbox(
    id: string,
    parentBody: RAPIER.RigidBody,
    offset: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    activeStart: number,
    activeEnd: number,
  ): void {
    this.removeHitbox(id);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
      .setSensor(true)
      .setTranslation(offset.x, offset.y, offset.z);
    const collider = this.world.createCollider(colliderDesc, parentBody);

    this.hitboxes.set(id, {
      collider,
      parentBody,
      offset,
      size,
      activeStart,
      activeEnd,
      hasHit: new Set(),
    });
  }

  update(dt: number, currentAnimTime: number, attackingId: string): string[] {
    const hitEntities = new Set<string>();
    const attackerHandle = this.entityToHandle.get(attackingId);

    for (const [, entry] of this.hitboxes) {
      const isActive = currentAnimTime >= entry.activeStart && currentAnimTime <= entry.activeEnd;
      if (!isActive) continue;

      this.world.intersectionPairsWith(
        entry.collider,
        (otherCollider: RAPIER.Collider) => {
          if (otherCollider.handle === attackerHandle) return;

          const entityId = this.handleToEntity.get(otherCollider.handle);
          if (entityId != null && !entry.hasHit.has(entityId)) {
            entry.hasHit.add(entityId);
            hitEntities.add(entityId);
          }
        },
      );
    }

    return Array.from(hitEntities);
  }

  removeHitbox(id: string): void {
    const entry = this.hitboxes.get(id);
    if (!entry) return;
    this.world.removeCollider(entry.collider, true);
    this.hitboxes.delete(id);
  }

  resetAll(): void {
    for (const [, entry] of this.hitboxes) {
      entry.hasHit.clear();
    }
  }

  dispose(): void {
    for (const [id] of this.hitboxes) {
      this.removeHitbox(id);
    }
    this.entityToHandle.clear();
    this.handleToEntity.clear();
  }
}
