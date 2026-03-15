import * as THREE from 'three'
import type { Ref } from 'vue'
import type { NpcRefs } from '@/scene/npc/createNpc'
import type { NpcData } from '@/scene/npc/npcConfig'
import { EARTH_Y } from '@/constants/scene'
import type { NpcSpawner } from '@/scene/spawn/npcSpawner'

export interface NpcVisibilityState {
  username: string
  visible: boolean
  showName: boolean
  screenX: number
  screenY: number
  rotation: number
}

interface NpcAnimState {
  smoothScreenX: number
  smoothScreenY: number
  smoothRotation: number
  smoothInitialized: boolean
  waveBlend: number
  flagFreq: number
  prevDot: number
  hasPassed: boolean
}

const NAME_DOT_THRESHOLD = Math.cos(Math.PI / 10)

const WAVE_BLEND_SPEED = 0.05
const NAME_LERP_FACTOR = 0.15

const FLAG_FREQ_IDLE = 2.5
const FLAG_FREQ_WAVE = 5
const FLAG_FREQ_LERP = 0.08

export class NpcManager {
  private npcSpawner: NpcSpawner
  private camera: THREE.PerspectiveCamera
  private visibilityStates: Ref<NpcVisibilityState[]>
  private earth: THREE.Mesh
  private _interactionDispose: (() => void) | null = null
  private _clickFeedbackTimers: Set<ReturnType<typeof setTimeout>> = new Set()

  private readonly _worldPos = new THREE.Vector3()
  private readonly _screenPos = new THREE.Vector3()
  private readonly _worldPos2 = new THREE.Vector3()

  private _npcStates: Map<string, NpcAnimState> = new Map()

  constructor(
    npcSpawner: NpcSpawner,
    camera: THREE.PerspectiveCamera,
    visibilityStates: Ref<NpcVisibilityState[]>,
    earth: THREE.Mesh,
  ) {
    this.npcSpawner = npcSpawner
    this.camera = camera
    this.visibilityStates = visibilityStates
    this.earth = earth
  }

  private buildInitialAnimState(): NpcAnimState {
    return {
      smoothScreenX: 0,
      smoothScreenY: 0,
      smoothRotation: 0,
      smoothInitialized: false,
      waveBlend: 0,
      flagFreq: FLAG_FREQ_IDLE,
      prevDot: 0,
      hasPassed: false,
    }
  }

  update(earthRotationZ: number, currentTimeSeconds: number): void {
    const charDirX = Math.sin(earthRotationZ)
    const charDirY = Math.cos(earthRotationZ)

    const activeEntries = this.npcSpawner.getActiveEntries()
    const activeIds = new Set(activeEntries.map((e) => e.npcData.id))

    // 清理已不存活的 NPC 狀態
    for (const id of this._npcStates.keys()) {
      if (!activeIds.has(id)) {
        this._npcStates.delete(id)
      }
    }

    const newStates: NpcVisibilityState[] = []

    for (const entry of activeEntries) {
      const { npcRefs, npcData } = entry
      const id = npcData.id

      if (!this._npcStates.has(id)) {
        this._npcStates.set(id, this.buildInitialAnimState())
      }

      const state = this._npcStates.get(id)!
      npcRefs.group.visible = true

      const pos = npcRefs.group.position
      const len = pos.length()
      const npcDirX = len > 0 ? pos.x / len : 0
      const npcDirY = len > 0 ? pos.y / len : 0
      const dot = charDirX * npcDirX + charDirY * npcDirY

      let showName = dot >= NAME_DOT_THRESHOLD

      if (dot >= state.prevDot) {
        state.prevDot = dot
      }
      if (!state.hasPassed && state.prevDot - dot > 0.005) {
        state.hasPassed = true
      }
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

      this.animateFlag(npcRefs, currentTimeSeconds, state)

      const leftArmPhase = npcRefs.npcData.id.charCodeAt(0) * 0.02
      npcRefs.leftUpperArmPivot.rotation.x = Math.sin(currentTimeSeconds * 1.8 + leftArmPhase) * 0.3
      npcRefs.leftForearmPivot.rotation.x = Math.sin(currentTimeSeconds * 2.2 + leftArmPhase + 0.5) * -0.2

      if (state.waveBlend > 0.001) {
        this.animateWaveBlended(npcRefs, currentTimeSeconds, state.waveBlend)
      } else {
        this.resetWaveAnimation(npcRefs)
      }

      let screenX = 0
      let screenY = 0
      let rotation = 0

      if (showName) {
        const coords = this.calculateScreenPosition(npcRefs, earthRotationZ, entry.phi)
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
        username: npcData.displayName,
        visible: true,
        showName,
        screenX,
        screenY,
        rotation,
      })
    }

    this.visibilityStates.value = newStates
  }

  private animateWaveBlended(npcRefs: NpcRefs, currentTimeSeconds: number, blend: number): void {
    const easedBlend = blend * blend * (3 - 2 * blend)
    const phase = npcRefs.npcData.id.charCodeAt(0) * 0.01

    const targetUpperZ = Math.sin(currentTimeSeconds * 14 + phase) * 0.3 + 2.0
    const targetForearmX = Math.sin(currentTimeSeconds * 14 + Math.PI / 4 + phase) * 0.2 - 0.8
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = targetUpperZ * easedBlend
    npcRefs.rightForearmPivot.rotation.x = targetForearmX * easedBlend

    npcRefs.bodyGroup.rotation.z = Math.sin(currentTimeSeconds * 20 + phase + 0.5) * 0.005 * easedBlend
  }

  private resetWaveAnimation(npcRefs: NpcRefs): void {
    npcRefs.rightUpperArmPivot.rotation.x = 0
    npcRefs.rightUpperArmPivot.rotation.z = 0
    npcRefs.rightForearmPivot.rotation.x = 0
    npcRefs.bodyGroup.rotation.z = 0
  }

  private animateFlag(npcRefs: NpcRefs, currentTimeSeconds: number, state: NpcAnimState): void {
    const phase = npcRefs.npcData.id.charCodeAt(0) * 0.013
    const targetFreq = state.waveBlend > 0.001 ? FLAG_FREQ_WAVE : FLAG_FREQ_IDLE
    state.flagFreq = state.flagFreq + (targetFreq - state.flagFreq) * FLAG_FREQ_LERP
    npcRefs.flagFaceGroup.rotation.y = Math.sin(currentTimeSeconds * state.flagFreq + phase) * 0.15
  }

  private calculateScreenPosition(npcRefs: NpcRefs, earthRotationZ: number, npcPhi: number): { screenX: number; screenY: number; rotation: number } | null {
    npcRefs.group.getWorldPosition(this._worldPos)

    this._screenPos.copy(this._worldPos)
    this._screenPos.project(this.camera)

    if (this._screenPos.z > 1) return null

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

    const rotation = (Math.PI / 2 - (npcPhi + earthRotationZ)) * (180 / Math.PI)

    return { screenX, screenY, rotation }
  }

  getInteractableObjects(): THREE.Object3D[] {
    const result: THREE.Object3D[] = []
    for (const npcRefs of this.npcSpawner.getActiveNpcRefsList()) {
      if (!npcRefs.group.visible) continue
      result.push(...npcRefs.bodyMeshes)
    }
    return result
  }

  getNpcDataByObject(object: THREE.Object3D): NpcData | null {
    for (const npcRefs of this.npcSpawner.getActiveNpcRefsList()) {
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
    return this.npcSpawner.getActiveNpcRefsList().find((refs) => refs.npcData === npcData) ?? null
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
    this.npcSpawner.dispose()
  }
}
