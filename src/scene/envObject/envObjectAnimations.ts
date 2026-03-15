import * as THREE from 'three'
import type { StreetLampRefs } from '@/scene/envObject/createStreetLamp'
import type { MailboxRefs } from '@/scene/envObject/createMailbox'
import type { BenchRefs } from '@/scene/envObject/createBench'

const BENCH_NEWSPAPER_INITIAL_X = 0.05
const BENCH_NEWSPAPER_INITIAL_Y = 0.19
const BENCH_NEWSPAPER_FADE_START = 1.5
const BENCH_NEWSPAPER_FADE_END = 2.0
const MAILBOX_PARTICLE_DELAY = 0.3
const MAILBOX_PARTICLE_LIFETIME = 2.0

export function updateStreetLampAnimation(
  refs: StreetLampRefs,
  state: 'idle' | 'activated' | 'done',
  currentTimeSeconds: number,
): void {
  const bulbMat = refs.bulbMesh.material
  if (!(bulbMat instanceof THREE.MeshBasicMaterial)) return

  if (state === 'idle') {
    refs.light.intensity = 0
    bulbMat.opacity = 0.1
    return
  }

  if (state === 'activated') {
    refs.light.intensity += (0.5 - refs.light.intensity) * 0.03
    bulbMat.opacity += (0.6 - bulbMat.opacity) * 0.03
    refs.light.intensity += Math.sin(currentTimeSeconds * 1.5) * 0.05
    return
  }

  refs.light.intensity += (0 - refs.light.intensity) * 0.02
  bulbMat.opacity += (0.1 - bulbMat.opacity) * 0.02
}

export function updateMailboxAnimation(
  refs: MailboxRefs,
  state: 'idle' | 'activated' | 'done',
  currentTimeSeconds: number,
  activatedTime: number,
): void {
  if (state === 'idle') {
    refs.lidPivot.rotation.x = 0
    for (const p of refs.particles) {
      p.mesh.visible = false
    }
    return
  }

  if (state === 'activated') {
    const elapsed = currentTimeSeconds - activatedTime

    refs.lidPivot.rotation.x += (-Math.PI / 3 - refs.lidPivot.rotation.x) * 0.06

    if (elapsed > MAILBOX_PARTICLE_DELAY) {
      const particleElapsed = elapsed - MAILBOX_PARTICLE_DELAY

      for (const p of refs.particles) {
        p.mesh.visible = true
        p.mesh.position.set(
          p.velocity.x * particleElapsed,
          0.44 + p.velocity.y * particleElapsed - 0.5 * particleElapsed * particleElapsed,
          0.06 + p.velocity.z * particleElapsed,
        )
        p.mesh.rotation.set(
          p.rotationSpeed.x * particleElapsed,
          p.rotationSpeed.y * particleElapsed,
          p.rotationSpeed.z * particleElapsed,
        )

        const mat = p.mesh.material
        if (mat instanceof THREE.MeshBasicMaterial) {
          mat.opacity = Math.max(0, 1 - particleElapsed / MAILBOX_PARTICLE_LIFETIME)
        }

        if (particleElapsed > MAILBOX_PARTICLE_LIFETIME) {
          p.mesh.visible = false
        }
      }
    }
    return
  }

  for (const p of refs.particles) {
    p.mesh.visible = false
  }
}

export function updateBenchAnimation(
  refs: BenchRefs,
  state: 'idle' | 'activated' | 'done',
  currentTimeSeconds: number,
  activatedTime: number,
): boolean {
  if (state === 'idle') {
    return false
  }

  if (state === 'activated') {
    const elapsed = currentTimeSeconds - activatedTime

    refs.newspaperGroup.position.y = BENCH_NEWSPAPER_INITIAL_Y + elapsed * elapsed * 0.12
    refs.newspaperGroup.position.x = BENCH_NEWSPAPER_INITIAL_X + elapsed * 0.1
    refs.newspaperGroup.rotation.z = elapsed * 2.5
    refs.newspaperGroup.rotation.x = elapsed * 1.2

    const mat = refs.newspaperMesh.material
    if (mat instanceof THREE.MeshBasicMaterial) {
      if (elapsed >= BENCH_NEWSPAPER_FADE_START) {
        const fadeProgress = (elapsed - BENCH_NEWSPAPER_FADE_START) / (BENCH_NEWSPAPER_FADE_END - BENCH_NEWSPAPER_FADE_START)
        mat.opacity = Math.max(0, 1 - fadeProgress)
      } else {
        mat.opacity = 1
      }
    }

    return elapsed > BENCH_NEWSPAPER_FADE_END
  }

  refs.newspaperGroup.visible = false
  return true
}
