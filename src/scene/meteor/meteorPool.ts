import * as THREE from 'three'
import { METEOR_HEAD_BRIGHTNESS, METEOR_POOL_SIZE, METEOR_TAIL_LENGTH } from '@/constants/scene'

export interface MeteorInstance {
  group: THREE.Group
  head: THREE.Mesh
  tailParticles: THREE.Mesh[]
  active: boolean
  velocity: THREE.Vector2
  life: number
}

function createMeteorInstance(scene: THREE.Scene): MeteorInstance {
  const group = new THREE.Group()

  const headGeo = new THREE.CircleGeometry(0.03, 8)
  const headMat = new THREE.MeshBasicMaterial({
    transparent: true,
    color: new THREE.Color().setScalar(METEOR_HEAD_BRIGHTNESS),
  })
  const head = new THREE.Mesh(headGeo, headMat)
  group.add(head)

  const tailParticles: THREE.Mesh[] = []

  for (let i = 0; i < METEOR_TAIL_LENGTH; i++) {
    const t = i / (METEOR_TAIL_LENGTH - 1)
    const width = 0.15 - t * (0.15 - 0.04)
    const height = 0.025 - t * (0.025 - 0.005)
    const opacity = 0.7 - t * (0.7 - 0.02)
    const brightness = 2.5 - t * (2.5 - 0.2)

    const geo = new THREE.PlaneGeometry(width, height)
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity,
      color: new THREE.Color().setScalar(brightness),
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.visible = false
    group.add(mesh)
    tailParticles.push(mesh)
  }

  group.visible = false
  scene.add(group)

  return {
    group,
    head,
    tailParticles,
    active: false,
    velocity: new THREE.Vector2(),
    life: 0,
  }
}

export class MeteorPool {
  private readonly instances: MeteorInstance[]
  private readonly scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.instances = Array.from({ length: METEOR_POOL_SIZE }, () => createMeteorInstance(scene))
  }

  acquire(): MeteorInstance | null {
    return this.instances.find((inst) => !inst.active) ?? null
  }

  release(instance: MeteorInstance): void {
    instance.active = false
    instance.group.visible = false
  }

  getInstances(): MeteorInstance[] {
    return this.instances
  }

  dispose(): void {
    for (const inst of this.instances) {
      for (const tail of inst.tailParticles) {
        tail.geometry.dispose()
        ;(tail.material as THREE.Material).dispose()
      }
      inst.head.geometry.dispose()
      ;(inst.head.material as THREE.Material).dispose()
      this.scene.remove(inst.group)
    }
  }
}
