import * as THREE from 'three'
import type { Ref } from 'vue'
import { MeteorPool } from '@/scene/meteor/meteorPool'
import type { MeteorInstance } from '@/scene/meteor/meteorPool'
import {
  CAMERA_HALF_FOV_TAN,
  CAMERA_Z,
  METEOR_ANGLE_MAX,
  METEOR_ANGLE_MIN,
  METEOR_BASE_INTERVAL,
  METEOR_MIN_INTERVAL,
  METEOR_SPEED,
  SCENE_ASPECT,
} from '@/constants/scene'

export interface MeteorSystemOptions {
  scene: THREE.Scene
  onlineCount: Ref<number>
}

export class MeteorSystem {
  private readonly pool: MeteorPool
  private readonly onlineCount: Ref<number>
  private elapsed: number = 0
  private nextSpawnAt: number

  constructor(options: MeteorSystemOptions) {
    this.pool = new MeteorPool(options.scene)
    this.onlineCount = options.onlineCount
    this.nextSpawnAt = 2 + Math.random() * 3
  }

  private calculateSpawnInterval(): number {
    const raw = METEOR_BASE_INTERVAL / Math.max(this.onlineCount.value, 1)
    return Math.max(Math.round(raw), METEOR_MIN_INTERVAL)
  }

  private spawnMeteor(): void {
    const instance = this.pool.acquire()
    if (!instance) return

    const depth = CAMERA_Z
    const halfHeight = CAMERA_HALF_FOV_TAN * depth
    const halfWidth = halfHeight * SCENE_ASPECT

    const x = halfWidth * (1.1 + Math.random() * 0.2)
    const y = halfHeight * (0.2 + Math.random() * 0.6)
    const z = -1 - Math.random() * 4

    instance.group.position.set(x, y, z)
    instance.group.visible = true
    instance.active = true
    instance.life = 0

    const angle = METEOR_ANGLE_MIN + Math.random() * (METEOR_ANGLE_MAX - METEOR_ANGLE_MIN)
    instance.velocity.set(Math.cos(angle) * METEOR_SPEED, Math.sin(angle) * METEOR_SPEED)
    instance.group.rotation.z = angle

    instance.head.visible = true
    for (let i = 0; i < instance.tailParticles.length; i++) {
      instance.tailParticles[i]!.position.set(-(i + 1) * 0.12, 0, 0)
      instance.tailParticles[i]!.visible = true
    }
  }

  private updateMeteor(instance: MeteorInstance, deltaTime: number): void {
    instance.group.position.x += instance.velocity.x * deltaTime
    instance.group.position.y += instance.velocity.y * deltaTime
    instance.life += deltaTime

    const depth = CAMERA_Z - instance.group.position.z
    const halfHeight = CAMERA_HALF_FOV_TAN * Math.max(depth, 0.001)
    const halfWidth = halfHeight * SCENE_ASPECT

    const posX = instance.group.position.x
    const posY = instance.group.position.y

    if (Math.abs(posX) > halfWidth * 1.5 || posY < -halfHeight * 1.5) {
      this.pool.release(instance)
    }
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime

    if (this.elapsed >= this.nextSpawnAt) {
      this.spawnMeteor()
      this.elapsed = 0
      const interval = this.calculateSpawnInterval()
      this.nextSpawnAt = interval + Math.random() * interval * 0.3
    }

    for (const instance of this.pool.getInstances()) {
      if (instance.active) {
        this.updateMeteor(instance, deltaTime)
      }
    }
  }

  dispose(): void {
    this.pool.dispose()
  }
}
