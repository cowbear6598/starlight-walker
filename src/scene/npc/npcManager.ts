import * as THREE from 'three'
import type { Ref } from 'vue'
import { repositionNpc } from '@/scene/npc/createNpc'
import type { NpcRefs } from '@/scene/npc/createNpc'
import { NPC_THETA } from '@/scene/npc/npcConfig'
import type { NpcData } from '@/scene/npc/npcConfig'
import { EARTH_Y } from '@/constants/scene'

export interface NpcVisibilityState {
  username: string
  visible: boolean
  showName: boolean
  screenX: number
  screenY: number
  rotation: number
}

const VISIBLE_DOT_THRESHOLD = Math.cos(Math.PI / 3)
const WAVE_DOT_THRESHOLD = Math.cos(Math.PI / 6)
const NAME_DOT_THRESHOLD = Math.cos(Math.PI / 10)

const SPAWN_PROBABILITY = 0.7
const MIN_PHI_SEPARATION = Math.PI / 2.5
const MAX_PHI_GENERATION_ATTEMPTS = 20

export class NpcManager {
  private npcRefsList: NpcRefs[]
  private camera: THREE.PerspectiveCamera
  private visibilityStates: Ref<NpcVisibilityState[]>
  private earth: THREE.Mesh
  private _interactionDispose: (() => void) | null = null
  private _clickFeedbackTimers: Set<ReturnType<typeof setTimeout>> = new Set()

  private readonly _worldPos = new THREE.Vector3()
  private readonly _screenPos = new THREE.Vector3()
  private readonly _worldPos2 = new THREE.Vector3()
  private readonly _screenPos2 = new THREE.Vector3()

  private _spawnDecided: boolean[] = []
  private _shouldSpawn: boolean[] = []
  private _currentPhis: number[] = []
  private _smoothScreenX: number[] = []
  private _smoothScreenY: number[] = []
  private _smoothRotation: number[] = []

  constructor(
    npcRefsList: NpcRefs[],
    camera: THREE.PerspectiveCamera,
    visibilityStates: Ref<NpcVisibilityState[]>,
    earth: THREE.Mesh,
    initialPhis: number[],
  ) {
    this.npcRefsList = npcRefsList
    this.camera = camera
    this.visibilityStates = visibilityStates
    this.earth = earth
    this._spawnDecided = new Array(npcRefsList.length).fill(false)
    this._shouldSpawn = new Array(npcRefsList.length).fill(false)
    this._currentPhis = [...initialPhis]
    this._smoothScreenX = new Array(npcRefsList.length).fill(0)
    this._smoothScreenY = new Array(npcRefsList.length).fill(0)
    this._smoothRotation = new Array(npcRefsList.length).fill(0)
  }

  update(earthRotationZ: number, currentTimeSeconds: number): void {
    const charDirX = Math.sin(earthRotationZ)
    const charDirY = Math.cos(earthRotationZ)
    const charDirZ = 0

    const newStates: NpcVisibilityState[] = []

    for (let i = 0; i < this.npcRefsList.length; i++) {
      const npcRefs = this.npcRefsList[i]!
      const pos = npcRefs.group.position
      const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)

      const npcDirX = len > 0 ? pos.x / len : 0
      const npcDirY = len > 0 ? pos.y / len : 0
      const npcDirZ = len > 0 ? pos.z / len : 0

      const dot = charDirX * npcDirX + charDirY * npcDirY + charDirZ * npcDirZ

      const inRange = dot >= VISIBLE_DOT_THRESHOLD

      if (!inRange) {
        if (this._spawnDecided[i]) {
          const randomPhi = this.generateNonOverlappingPhi(i)
          this._currentPhis[i] = randomPhi
          repositionNpc(npcRefs, NPC_THETA, randomPhi)
          this._spawnDecided[i] = false
          this._shouldSpawn[i] = false
        }
        npcRefs.group.visible = false
        this.resetWaveAnimation(npcRefs)
        newStates.push({
          username: npcRefs.npcData.id,
          visible: false,
          showName: false,
          screenX: 0,
          screenY: 0,
          rotation: 0,
        })
        continue
      }

      if (!this._spawnDecided[i]) {
        this._shouldSpawn[i] = Math.random() < SPAWN_PROBABILITY
        this._spawnDecided[i] = true
      }

      const isVisible = this._shouldSpawn[i] ?? false
      npcRefs.group.visible = isVisible

      if (!isVisible) {
        this.resetWaveAnimation(npcRefs)
        newStates.push({
          username: npcRefs.npcData.id,
          visible: false,
          showName: false,
          screenX: 0,
          screenY: 0,
          rotation: 0,
        })
        continue
      }

      this.animateFlag(npcRefs, currentTimeSeconds, i)

      const isWaving = dot >= WAVE_DOT_THRESHOLD
      if (isWaving) {
        this.animateWave(npcRefs, currentTimeSeconds, i)
      } else {
        this.resetWaveAnimation(npcRefs)
      }

      let showName = dot >= NAME_DOT_THRESHOLD
      let screenX = 0
      let screenY = 0
      let rotation = 0

      if (showName) {
        const coords = this.calculateScreenPosition(npcRefs, earthRotationZ, this._currentPhis[i]!)
        if (coords) {
          // lerp 平滑過渡，避免抖動
          const lerpFactor = 0.15
          this._smoothScreenX[i] = this._smoothScreenX[i]! + (coords.screenX - this._smoothScreenX[i]!) * lerpFactor
          this._smoothScreenY[i] = this._smoothScreenY[i]! + (coords.screenY - this._smoothScreenY[i]!) * lerpFactor
          this._smoothRotation[i] = this._smoothRotation[i]! + (coords.rotation - this._smoothRotation[i]!) * lerpFactor
          screenX = this._smoothScreenX[i]!
          screenY = this._smoothScreenY[i]!
          rotation = this._smoothRotation[i]!
        } else {
          showName = false
        }
      }

      newStates.push({
        username: npcRefs.npcData.id,
        visible: true,
        showName,
        screenX,
        screenY,
        rotation,
      })
    }

    this.visibilityStates.value = newStates
  }

  private generateNonOverlappingPhi(excludeIndex: number): number {
    for (let attempt = 0; attempt < MAX_PHI_GENERATION_ATTEMPTS; attempt++) {
      const candidate = Math.random() * Math.PI * 2 - Math.PI
      const tooClose = this._currentPhis.some((phi, index) => {
        if (index === excludeIndex) return false
        const diff = Math.abs(candidate - phi)
        const circularDiff = Math.min(diff, Math.PI * 2 - diff)
        return circularDiff < MIN_PHI_SEPARATION
      })
      if (!tooClose) return candidate
    }
    return Math.random() * Math.PI * 2 - Math.PI
  }

  private animateWave(npcRefs: NpcRefs, currentTimeSeconds: number, index: number): void {
    const phase = index * 0.5
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = Math.sin(currentTimeSeconds * 5 + phase) * 0.3 + 2.0
    npcRefs.rightForearmPivot.rotation.x =
      Math.sin(currentTimeSeconds * 5 + Math.PI / 4 + phase) * 0.2 - 0.8
  }

  private resetWaveAnimation(npcRefs: NpcRefs): void {
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = 0
    npcRefs.rightForearmPivot.rotation.x = 0
  }

  private animateFlag(npcRefs: NpcRefs, currentTimeSeconds: number, index: number): void {
    const phase = index * 1.3
    // 繞 Y 軸旋轉：旗桿側固定，自由端前後擺動（像風吹旗幟）
    npcRefs.flagFaceGroup.rotation.y = Math.sin(currentTimeSeconds * 2.5 + phase) * 0.15
  }

  private calculateScreenPosition(npcRefs: NpcRefs, earthRotationZ: number, npcPhi: number): { screenX: number; screenY: number; rotation: number } | null {
    npcRefs.group.getWorldPosition(this._worldPos)

    this._screenPos.copy(this._worldPos)
    this._screenPos.project(this.camera)

    if (this._screenPos.z > 1) return null

    // 標籤位置在腳下方：沿地球表面法線方向往下偏移
    // 法線 = 從地球中心(0, EARTH_Y, 0)指向 NPC 的方向
    this._worldPos2.set(
      this._worldPos.x,
      this._worldPos.y - EARTH_Y,
      this._worldPos.z,
    ).normalize()
    this._worldPos.addScaledVector(this._worldPos2, -0.35)
    this._screenPos.copy(this._worldPos)
    this._screenPos.project(this.camera)

    const screenX = (this._screenPos.x * 0.5 + 0.5) * 100
    const screenY = (-this._screenPos.y * 0.5 + 0.5) * 100

    // 直接用地球旋轉角度 + NPC phi 算出螢幕傾斜角，穩定不抖動
    const rotation = (Math.PI / 2 - (npcPhi + earthRotationZ)) * (180 / Math.PI)

    return { screenX, screenY, rotation }
  }

  getInteractableObjects(): THREE.Object3D[] {
    const result: THREE.Object3D[] = []
    for (const npcRefs of this.npcRefsList) {
      if (!npcRefs.group.visible) continue
      result.push(...npcRefs.bodyMeshes)
    }
    return result
  }

  getNpcDataByObject(object: THREE.Object3D): NpcData | null {
    for (const npcRefs of this.npcRefsList) {
      if (npcRefs.bodyMeshes.includes(object as THREE.Mesh)) {
        return npcRefs.npcData
      }

      let current: THREE.Object3D | null = object.parent
      while (current) {
        if (npcRefs.bodyMeshes.includes(current as THREE.Mesh)) {
          return npcRefs.npcData
        }
        current = current.parent
      }
    }
    return null
  }

  playClickFeedback(npcRefs: NpcRefs): void {
    npcRefs.group.scale.setScalar(1.15)
    const timer = setTimeout(() => {
      npcRefs.group.scale.setScalar(1.0)
      this._clickFeedbackTimers.delete(timer)
    }, 200)
    this._clickFeedbackTimers.add(timer)
  }

  getNpcRefsByData(npcData: NpcData): NpcRefs | null {
    return this.npcRefsList.find((refs) => refs.npcData === npcData) ?? null
  }

  setInteractionDispose(fn: () => void): void {
    this._interactionDispose = fn
  }

  dispose(): void {
    for (const timer of this._clickFeedbackTimers) {
      clearTimeout(timer)
    }
    this._clickFeedbackTimers.clear()
    this._interactionDispose?.()
    for (const npcRefs of this.npcRefsList) {
      this.earth.remove(npcRefs.group)

      npcRefs.group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.geometry?.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const mat of materials) {
          if (mat instanceof THREE.Material) {
            if ('map' in mat && mat.map instanceof THREE.Texture) {
              mat.map.dispose()
            }
            mat.dispose()
          }
        }
      })
    }
  }
}
