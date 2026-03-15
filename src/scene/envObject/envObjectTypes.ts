import * as THREE from 'three'
import type { EnvObjectType } from '@/scene/envObject/envObjectConfig'
import type { StreetLampRefs } from '@/scene/envObject/createStreetLamp'
import type { MailboxRefs } from '@/scene/envObject/createMailbox'
import type { BenchRefs } from '@/scene/envObject/createBench'
import { createStreetLamp } from '@/scene/envObject/createStreetLamp'
import { createMailbox } from '@/scene/envObject/createMailbox'
import { createBench } from '@/scene/envObject/createBench'

export interface EnvObjectEntry {
  type: EnvObjectType
  group: THREE.Group
  meshes: THREE.Mesh[]
  refs: StreetLampRefs | MailboxRefs | BenchRefs
  state: 'idle' | 'activated' | 'done'
  activatedTime: number
  phi: number
}

function buildEntry(type: EnvObjectType, refs: { group: THREE.Group; meshes: THREE.Mesh[] }): EnvObjectEntry {
  return {
    type,
    group: refs.group,
    meshes: refs.meshes,
    refs: refs as StreetLampRefs | MailboxRefs | BenchRefs,
    state: 'idle',
    activatedTime: 0,
    phi: 0,
  }
}

export function createEnvObject(type: EnvObjectType, toonGradientMap: THREE.DataTexture): EnvObjectEntry {
  if (type === 'streetLamp') {
    const refs = createStreetLamp(toonGradientMap)
    refs.group.scale.setScalar(1.5)
    return buildEntry(type, refs)
  }

  if (type === 'mailbox') {
    const refs = createMailbox(toonGradientMap)
    refs.group.scale.setScalar(1.5)
    return buildEntry(type, refs)
  }

  if (type === 'bench') {
    const refs = createBench(toonGradientMap)
    refs.group.scale.setScalar(1.5)
    return buildEntry(type, refs)
  }

  throw new Error(`Unknown EnvObjectType: ${type}`)
}
