import * as THREE from 'three'
import type { Ref } from 'vue'
import { repositionNpc } from '@/scene/npc/createNpc'
import type { NpcRefs } from '@/scene/npc/createNpc'
import { NPC_THETA, generateNonOverlappingPhi } from '@/scene/npc/npcConfig'
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

interface NpcAnimState {
  spawnDecided: boolean
  shouldSpawn: boolean
  currentPhi: number
  smoothScreenX: number
  smoothScreenY: number
  smoothRotation: number
  smoothInitialized: boolean
  waveBlend: number
  flagFreq: number
  prevDot: number
  hasPassed: boolean
}

const VISIBLE_DOT_THRESHOLD = Math.cos(Math.PI / 3)
const NAME_DOT_THRESHOLD = Math.cos(Math.PI / 10)

const SPAWN_PROBABILITY = 0.7
const WAVE_BLEND_SPEED = 0.05
const NAME_LERP_FACTOR = 0.15

const FLAG_FREQ_IDLE = 2.5
const FLAG_FREQ_WAVE = 5
const FLAG_FREQ_LERP = 0.08

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

  private _npcStates: NpcAnimState[] = []

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
    this._npcStates = npcRefsList.map((_, i) => ({
      spawnDecided: false,
      shouldSpawn: false,
      currentPhi: initialPhis[i]!,
      smoothScreenX: 0,
      smoothScreenY: 0,
      smoothRotation: 0,
      smoothInitialized: false,
      waveBlend: 0,
      flagFreq: FLAG_FREQ_IDLE,
      prevDot: 0,
      hasPassed: false,
    }))
  }

  update(earthRotationZ: number, currentTimeSeconds: number): void {
    const charDirX = Math.sin(earthRotationZ)
    const charDirY = Math.cos(earthRotationZ)

    const newStates: NpcVisibilityState[] = []

    for (let i = 0; i < this.npcRefsList.length; i++) {
      const npcRefs = this.npcRefsList[i]!
      const state = this._npcStates[i]!
      const pos = npcRefs.group.position
      const len = pos.length()

      const npcDirX = len > 0 ? pos.x / len : 0
      const npcDirY = len > 0 ? pos.y / len : 0

      const dot = charDirX * npcDirX + charDirY * npcDirY

      const inRange = dot >= VISIBLE_DOT_THRESHOLD

      if (!inRange) {
        if (state.spawnDecided) {
          const randomPhi = generateNonOverlappingPhi(this._npcStates.map((s) => s.currentPhi), i)
          state.currentPhi = randomPhi
          repositionNpc(npcRefs, NPC_THETA, randomPhi)
          state.spawnDecided = false
          state.shouldSpawn = false
          state.smoothInitialized = false
          state.waveBlend = 0
          state.prevDot = 0
          state.hasPassed = false
        }
        npcRefs.group.visible = false
        this.resetWaveAnimation(npcRefs)
        newStates.push(this.buildHiddenState(npcRefs))
        continue
      }

      if (!state.spawnDecided) {
        state.shouldSpawn = Math.random() < SPAWN_PROBABILITY
        state.spawnDecided = true
      }

      const isVisible = state.shouldSpawn
      npcRefs.group.visible = isVisible

      if (!isVisible) {
        this.resetWaveAnimation(npcRefs)
        newStates.push(this.buildHiddenState(npcRefs))
        continue
      }

      let showName = dot >= NAME_DOT_THRESHOLD

      // 追蹤 dot 峰值，下降超過緩衝量才判定為走過
      if (dot >= state.prevDot) {
        state.prevDot = dot
      }
      if (!state.hasPassed && state.prevDot - dot > 0.005) {
        state.hasPassed = true
      }
      // 一旦走過就鎖定，直到離開可見範圍才重置
      if (!showName) {
        state.hasPassed = false
        state.prevDot = 0
      }
      const shouldWave = showName && !state.hasPassed

      if (shouldWave) {
        state.waveBlend = Math.min(1, state.waveBlend + WAVE_BLEND_SPEED)
      } else {
        state.waveBlend = Math.max(0, state.waveBlend - WAVE_BLEND_SPEED)
      }

      this.animateFlag(npcRefs, currentTimeSeconds, i, state.waveBlend)

      if (state.waveBlend > 0.001) {
        this.animateWaveBlended(npcRefs, currentTimeSeconds, i, state.waveBlend)
      } else {
        this.resetWaveAnimation(npcRefs)
      }
      let screenX = 0
      let screenY = 0
      let rotation = 0

      if (showName) {
        const coords = this.calculateScreenPosition(npcRefs, earthRotationZ, state.currentPhi)
        if (coords) {
          if (!state.smoothInitialized) {
            state.smoothScreenX = coords.screenX
            state.smoothScreenY = coords.screenY
            state.smoothRotation = coords.rotation
            state.smoothInitialized = true
          } else {
            state.smoothScreenX = state.smoothScreenX + (coords.screenX - state.smoothScreenX) * NAME_LERP_FACTOR
            state.smoothScreenY = state.smoothScreenY + (coords.screenY - state.smoothScreenY) * NAME_LERP_FACTOR
            state.smoothRotation = state.smoothRotation + (coords.rotation - state.smoothRotation) * NAME_LERP_FACTOR
          }
          screenX = state.smoothScreenX
          screenY = state.smoothScreenY
          rotation = state.smoothRotation
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

  private buildHiddenState(npcRefs: NpcRefs): NpcVisibilityState {
    return {
      username: npcRefs.npcData.id,
      visible: false,
      showName: false,
      screenX: 0,
      screenY: 0,
      rotation: 0,
    }
  }

  private animateWaveBlended(npcRefs: NpcRefs, currentTimeSeconds: number, index: number, blend: number): void {
    const easedBlend = blend * blend * (3 - 2 * blend)
    const phase = index * 0.5

    // 右手揮手
    const targetUpperZ = Math.sin(currentTimeSeconds * 14 + phase) * 0.3 + 2.0
    const targetForearmX = Math.sin(currentTimeSeconds * 14 + Math.PI / 4 + phase) * 0.2 - 0.8
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = targetUpperZ * easedBlend
    npcRefs.rightForearmPivot.rotation.x = targetForearmX * easedBlend

    // 身體微晃
    npcRefs.bodyGroup.rotation.z = Math.sin(currentTimeSeconds * 20 + phase + 0.5) * 0.005 * easedBlend
  }

  private resetWaveAnimation(npcRefs: NpcRefs): void {
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = 0
    npcRefs.rightForearmPivot.rotation.x = 0
    npcRefs.bodyGroup.rotation.z = 0
  }

  private animateFlag(npcRefs: NpcRefs, currentTimeSeconds: number, index: number, waveBlend: number): void {
    const state = this._npcStates[index]!
    const phase = index * 1.3
    const targetFreq = waveBlend > 0.001 ? FLAG_FREQ_WAVE : FLAG_FREQ_IDLE
    state.flagFreq = state.flagFreq + (targetFreq - state.flagFreq) * FLAG_FREQ_LERP
    npcRefs.flagFaceGroup.rotation.y = Math.sin(currentTimeSeconds * state.flagFreq + phase) * 0.15
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
}
