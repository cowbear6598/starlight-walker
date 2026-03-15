import * as THREE from 'three'
import type { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import type { EnvObjectType } from '@/scene/envObject/envObjectConfig'
import { ENV_OBJECT_TYPES } from '@/scene/envObject/envObjectConfig'
import type { EnvObjectEntry } from '@/scene/envObject/envObjectTypes'
import { createEnvObject } from '@/scene/envObject/envObjectTypes'
import type { StreetLampRefs } from '@/scene/envObject/createStreetLamp'
import type { MailboxRefs } from '@/scene/envObject/createMailbox'
import type { BenchRefs } from '@/scene/envObject/createBench'
import { repositionOnSurface } from '@/scene/shared'
import { ENV_OBJECT_THETA_MIN, ENV_OBJECT_THETA_MAX } from '@/constants/scene'

export class EnvObjectSpawner {
  private activeEntries: EnvObjectEntry[] = []
  private pool: Map<EnvObjectType, EnvObjectEntry[]> = new Map()
  private readonly _worldPos = new THREE.Vector3()
  private readonly _screenPos = new THREE.Vector3()

  constructor(
    private earth: THREE.Mesh,
    private camera: THREE.PerspectiveCamera,
    private toonGradientMap: THREE.DataTexture,
    private outlineObjects: THREE.Object3D[],
    private outlinePass: OutlinePass,
  ) {}

  private randomTheta(): number {
    const magnitude = ENV_OBJECT_THETA_MIN + Math.random() * (ENV_OBJECT_THETA_MAX - ENV_OBJECT_THETA_MIN)
    return Math.random() < 0.5 ? magnitude : -magnitude
  }

  private addToOutline(meshes: THREE.Mesh[]): void {
    for (const mesh of meshes) {
      this.outlineObjects.push(mesh)
    }
    this.outlinePass.selectedObjects = this.outlineObjects
  }

  private removeFromOutline(meshes: THREE.Mesh[]): void {
    for (const mesh of meshes) {
      const idx = this.outlineObjects.indexOf(mesh)
      if (idx !== -1) {
        this.outlineObjects.splice(idx, 1)
      }
    }
    this.outlinePass.selectedObjects = this.outlineObjects
  }

  private spawnEntry(type: EnvObjectType, theta: number, phi: number, visible: boolean): void {
    const poolForType = this.pool.get(type)
    let entry: EnvObjectEntry

    if (poolForType !== undefined && poolForType.length > 0) {
      entry = poolForType.pop()!
      repositionOnSurface(entry.group, theta, phi)
      entry.state = 'idle'
      entry.activatedTime = 0
      this.earth.add(entry.group)
    } else {
      entry = createEnvObject(type, this.toonGradientMap)
      repositionOnSurface(entry.group, theta, phi)
      this.earth.add(entry.group)
    }

    entry.phi = phi
    entry.group.visible = visible

    this.addToOutline(entry.meshes)
    this.activeEntries.push(entry)
  }

  spawnInitial(count: number): void {
    const charAngle = -this.earth.rotation.z + Math.PI / 2
    const offsets = [Math.PI * 0.18, -Math.PI * 0.18]

    for (let i = 0; i < Math.min(count, offsets.length); i++) {
      const phi = charAngle + offsets[i]!
      const typeIndex = Math.floor(Math.random() * ENV_OBJECT_TYPES.length)
      const type = ENV_OBJECT_TYPES[typeIndex]!
      const theta = this.randomTheta()

      this.spawnEntry(type, theta, phi, true)
    }
  }

  spawn(): boolean {
    const typeIndex = Math.floor(Math.random() * ENV_OBJECT_TYPES.length)
    const type = ENV_OBJECT_TYPES[typeIndex]!
    const spawnPhi = -this.earth.rotation.z + Math.PI * 0.78
    const theta = this.randomTheta()

    this.spawnEntry(type, theta, spawnPhi, false)

    return true
  }

  update(earthRotationZ: number): void {
    for (let i = this.activeEntries.length - 1; i >= 0; i--) {
      const entry = this.activeEntries[i]!
      entry.group.getWorldPosition(this._worldPos)
      this._screenPos.copy(this._worldPos)
      this._screenPos.project(this.camera)

      if (this._screenPos.x > 1.1) {
        this.despawn(i)
      }
    }
  }

  private despawn(index: number): void {
    const entry = this.activeEntries[index]
    if (entry === undefined) return

    this.activeEntries.splice(index, 1)
    this.earth.remove(entry.group)
    this.removeFromOutline(entry.meshes)

    this.resetEntryState(entry)

    let poolForType = this.pool.get(entry.type)
    if (poolForType === undefined) {
      poolForType = []
      this.pool.set(entry.type, poolForType)
    }
    poolForType.push(entry)
  }

  private resetEntryState(entry: EnvObjectEntry): void {
    if (entry.type === 'streetLamp') {
      const refs = entry.refs as StreetLampRefs
      refs.light.intensity = 0.08
      const mat = refs.bulbMesh.material
      if (mat instanceof THREE.MeshBasicMaterial) {
        mat.opacity = 0.25
      }
      return
    }

    if (entry.type === 'mailbox') {
      const refs = entry.refs as MailboxRefs
      refs.lidPivot.rotation.x = 0
      refs.flagPivot.rotation.z = 0
      for (const particle of refs.particles) {
        particle.mesh.visible = false
        const mat = particle.mesh.material
        if (mat instanceof THREE.MeshBasicMaterial) {
          mat.opacity = 0
        }
        particle.mesh.position.set(0, 0.44, 0.06)
        particle.mesh.rotation.set(0, 0, 0)
      }
      return
    }

    if (entry.type === 'bench') {
      const refs = entry.refs as BenchRefs
      refs.newspaperGroup.visible = true
      refs.newspaperGroup.position.set(0.05, 0.19, 0.02)
      refs.newspaperGroup.rotation.set(0, 0, 0)
      const mat = refs.newspaperMesh.material
      if (mat instanceof THREE.MeshBasicMaterial) {
        mat.opacity = 1
      }
      return
    }

    throw new Error(`Unknown EnvObjectType in resetEntryState: ${entry.type}`)
  }

  getActiveEntries(): readonly EnvObjectEntry[] {
    return this.activeEntries
  }

  dispose(): void {
    for (const entry of this.activeEntries) {
      this.earth.remove(entry.group)
      this.disposeEntry(entry)
    }
    this.activeEntries = []

    for (const entries of this.pool.values()) {
      for (const entry of entries) {
        this.disposeEntry(entry)
      }
    }
    this.pool.clear()
  }

  private disposeEntry(entry: EnvObjectEntry): void {
    entry.group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.geometry?.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        if (mat instanceof THREE.Material) {
          mat.dispose()
        }
      }
    })
  }
}
