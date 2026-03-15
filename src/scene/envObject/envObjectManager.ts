import * as THREE from 'three'
import type { EnvObjectSpawner } from '@/scene/spawn/envObjectSpawner'
import type { EnvObjectEntry } from '@/scene/envObject/envObjectTypes'
import type { StreetLampRefs } from '@/scene/envObject/createStreetLamp'
import type { MailboxRefs } from '@/scene/envObject/createMailbox'
import type { BenchRefs } from '@/scene/envObject/createBench'
import { updateStreetLampAnimation, updateMailboxAnimation, updateBenchAnimation } from '@/scene/envObject/envObjectAnimations'
import { ENV_DOT_THRESHOLD } from '@/constants/scene'

const MAILBOX_DONE_DELAY = 2.8

export class EnvObjectManager {
  constructor(
    private envObjectSpawner: EnvObjectSpawner,
    private earth: THREE.Mesh,
  ) {}

  update(earthRotationZ: number, currentTimeSeconds: number): void {
    const charDirX = Math.sin(earthRotationZ)
    const charDirY = Math.cos(earthRotationZ)

    for (const entry of this.envObjectSpawner.getActiveEntries()) {
      entry.group.visible = true

      const pos = entry.group.position
      const len = pos.length()
      const nDirX = len > 0 ? pos.x / len : 0
      const nDirY = len > 0 ? pos.y / len : 0
      const dot = charDirX * nDirX + charDirY * nDirY

      this.updateState(entry, dot, currentTimeSeconds)
      this.runAnimation(entry, currentTimeSeconds)
    }
  }

  private updateState(entry: EnvObjectEntry, dot: number, currentTimeSeconds: number): void {
    if (entry.state === 'idle' && dot >= ENV_DOT_THRESHOLD) {
      entry.state = 'activated'
      entry.activatedTime = currentTimeSeconds
      return
    }

    if (entry.state === 'activated') {
      if (entry.type === 'streetLamp' && dot < ENV_DOT_THRESHOLD) {
        entry.state = 'done'
        return
      }

      if (entry.type === 'mailbox' && currentTimeSeconds - entry.activatedTime > MAILBOX_DONE_DELAY) {
        entry.state = 'done'
      }
    }
  }

  private runAnimation(entry: EnvObjectEntry, currentTimeSeconds: number): void {
    if (entry.type === 'streetLamp') {
      updateStreetLampAnimation(entry.refs as StreetLampRefs, entry.state, currentTimeSeconds)
      return
    }

    if (entry.type === 'mailbox') {
      updateMailboxAnimation(entry.refs as MailboxRefs, entry.state, currentTimeSeconds, entry.activatedTime)
      return
    }

    const done = updateBenchAnimation(entry.refs as BenchRefs, entry.state, currentTimeSeconds, entry.activatedTime)
    if (done && entry.state === 'activated') {
      entry.state = 'done'
    }
  }

  getInteractableObjects(): THREE.Object3D[] {
    const result: THREE.Object3D[] = []
    for (const entry of this.envObjectSpawner.getActiveEntries()) {
      if (entry.type === 'mailbox') {
        result.push(...entry.meshes)
      }
    }
    return result
  }

  getEntryByObject(object: THREE.Object3D): EnvObjectEntry | null {
    for (const entry of this.envObjectSpawner.getActiveEntries()) {
      if (entry.meshes.includes(object as THREE.Mesh)) {
        return entry
      }
    }
    return null
  }

  dispose(): void {
    this.envObjectSpawner.dispose()
  }
}
