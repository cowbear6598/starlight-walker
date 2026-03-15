import * as THREE from 'three'
import type { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { createNpc, repositionNpc } from '@/scene/npc/createNpc'
import type { NpcRefs } from '@/scene/npc/createNpc'
import { NPC_THETA } from '@/scene/npc/npcConfig'
import type { NpcData } from '@/scene/npc/npcConfig'

interface ActiveNpcEntry {
  npcRefs: NpcRefs
  npcData: NpcData
  phi: number
}

export class NpcSpawner {
  private shuffledQueue: NpcData[] = []
  private activeNpcs: ActiveNpcEntry[] = []
  private pool: Map<string, NpcRefs> = new Map()
  private lastQueueTailId: string | null = null

  constructor(
    private npcList: NpcData[],
    private textureMap: Map<string, THREE.Texture>,
    private earth: THREE.Mesh,
    private camera: THREE.PerspectiveCamera,
    private toonGradientMap: THREE.DataTexture,
    private outlineObjects: THREE.Object3D[],
    private outlinePass: OutlinePass,
    private maxAlive: number,
  ) {
    this.reshuffleQueue()
  }

  private reshuffleQueue(): void {
    const copy = [...this.npcList]

    // Fisher-Yates 洗牌
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!]
    }

    // 避免洗牌後第一個與上一輪最後一個相同
    if (
      copy.length > 1 &&
      this.lastQueueTailId !== null &&
      copy[0]!.id === this.lastQueueTailId
    ) {
      const swapIndex = Math.floor(Math.random() * (copy.length - 1)) + 1;
      [copy[0], copy[swapIndex]] = [copy[swapIndex]!, copy[0]!]
    }

    this.shuffledQueue = copy
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

  spawn(): boolean {
    if (this.activeNpcs.length >= this.maxAlive) return false

    const npcData = this.shuffledQueue.shift()
    if (npcData === undefined) return false

    if (this.shuffledQueue.length === 0) {
      this.lastQueueTailId = npcData.id
      this.reshuffleQueue()
    }

    const phi = this.calculateSpawnPhi(this.earth.rotation.z)

    let npcRefs: NpcRefs
    const pooled = this.pool.get(npcData.id)

    if (pooled !== undefined) {
      npcRefs = pooled
      this.pool.delete(npcData.id)
      repositionNpc(npcRefs, NPC_THETA, phi)
      npcRefs.group.visible = false
      this.earth.add(npcRefs.group)
    } else {
      const texture = this.textureMap.get(npcData.id)
      if (!texture) {
        console.warn(`[NpcSpawner] Missing texture for NPC: ${npcData.id}`)
        return false
      }
      npcRefs = createNpc(npcData, texture, this.earth, this.toonGradientMap, NPC_THETA, phi)
    }

    this.addToOutline(npcRefs.bodyMeshes)

    this.activeNpcs.push({ npcRefs, npcData, phi })
    return true
  }

  private despawn(index: number): void {
    const entry = this.activeNpcs[index]
    if (entry === undefined) return

    const { npcRefs, npcData } = entry
    this.activeNpcs.splice(index, 1)

    this.earth.remove(npcRefs.group)

    this.removeFromOutline(npcRefs.bodyMeshes)

    this.pool.set(npcData.id, npcRefs)
  }

  update(earthRotationZ: number): void {
    const worldPos = new THREE.Vector3()
    const screenPos = new THREE.Vector3()

    for (let i = this.activeNpcs.length - 1; i >= 0; i--) {
      const entry = this.activeNpcs[i]!
      entry.npcRefs.group.getWorldPosition(worldPos)
      screenPos.copy(worldPos)
      screenPos.project(this.camera)

      if (screenPos.x > 1.1) {
        this.despawn(i)
      }
    }
  }

  // 計算讓 NPC 生成在畫面左邊界外的 phi 值
  private calculateSpawnPhi(earthRotationZ: number): number {
    return -earthRotationZ + Math.PI * 0.78
  }

  getActiveNpcRefsList(): NpcRefs[] {
    return this.activeNpcs.map((entry) => entry.npcRefs)
  }

  getActiveEntries(): ActiveNpcEntry[] {
    return this.activeNpcs
  }

  dispose(): void {
    for (const { npcRefs } of this.activeNpcs) {
      this.earth.remove(npcRefs.group)
      this.disposeNpcRefs(npcRefs)
    }
    this.activeNpcs = []

    for (const npcRefs of this.pool.values()) {
      this.disposeNpcRefs(npcRefs)
    }
    this.pool.clear()
  }

  private disposeNpcRefs(npcRefs: NpcRefs): void {
    npcRefs.group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.geometry?.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        if (mat instanceof THREE.Material) {
          const matAny = mat as unknown as Record<string, unknown>
          for (const key of Object.keys(matAny)) {
            const value = matAny[key]
            if (value instanceof THREE.Texture) {
              value.dispose()
            }
          }
          mat.dispose()
        }
      }
    })
  }
}
