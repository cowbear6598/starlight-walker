import * as THREE from 'three'
import type { Ref } from 'vue'
import { onUnmounted } from 'vue'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { CAMERA_HALF_FOV_TAN, CAMERA_Z, EARTH_RADIUS, EARTH_Y, MOON_ARC_HEIGHT, MOON_DEPTH_MULTIPLIER, MOON_HALF_WIDTH, MOON_PARALLAX_FACTOR, MOON_VISUAL_RADIUS, MOON_X, MOON_Y_BASE, SCENE_ASPECT, STAR_PARALLAX_DEPTH_BASE, STAR_PARALLAX_FACTOR } from '@/constants/scene'
import { applyStarAppearance, spawnStar } from '@/scene/createStars'
import type { StarParticle } from '@/scene/createStars'
import type { StickFigureRefs } from '@/scene/createStickFigure'
import type { DynamicBiomeManager } from '@/scene/biomeObjects/dynamicBiomeManager'
import { disposeSharedToonGradientMap } from '@/scene/materials'
import type { NpcManager } from '@/scene/npc/npcManager'
import type { CatRefs } from '@/scene/cat/createCat'

export interface SceneRefs {
  containerRef: Ref<HTMLDivElement | undefined>
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  earth: THREE.Mesh
  moonMesh: THREE.Mesh
  moonLight: THREE.PointLight
  stickFigure: StickFigureRefs
  starParticles: StarParticle[]
  paperPass: ShaderPass
  bgShaderMaterial: THREE.ShaderMaterial
  biomeManager: DynamicBiomeManager
  npcManager: NpcManager | null
  cats: CatRefs[]
}

const MAX_ALIVE_STARS = 15

const TAIL_FREQS = [1.2, 1.5, 1.8, 2.2, 2.8] as const
const TAIL_AMPS = [0.1, 0.12, 0.15, 0.18, 0.2] as const

const CAPE_Z_WAVES = [
  { timeFreq: 2.3, spaceFreq: 4.0, seedMul: 1.0, amplitude: 0.12 },
  { timeFreq: 3.7, spaceFreq: 6.5, seedMul: 1.3, amplitude: 0.07 },
  { timeFreq: 5.1, spaceFreq: 2.8, seedMul: 0.7, amplitude: 0.04 },
] as const

const CAPE_X_WAVES = [
  { timeFreq: 1.9, spaceFreq: 3.2, seedMul: 0.5, amplitude: 0.04 },
  { timeFreq: 4.3, spaceFreq: 5.1, seedMul: 1.1, amplitude: 0.02 },
] as const

function calculateWave(
  waves: readonly { timeFreq: number; spaceFreq: number; seedMul: number; amplitude: number }[],
  t: number,
  distFromTop: number,
  seed: number,
): number {
  let result = 0
  for (const w of waves) {
    result += Math.sin(t * w.timeFreq + distFromTop * w.spaceFreq + seed * w.seedMul) * w.amplitude
  }
  return result
}

export function useSceneAnimation(refs: SceneRefs): void {
  let animationId = 0
  let lastTimestamp = 0

  const timeUniformSources = [
    refs.bgShaderMaterial.uniforms['uTime'],
    refs.paperPass.uniforms['uTime'],
  ].filter((u): u is { value: number } => u !== undefined)

  function animateEarth(): void {
    refs.earth.rotation.z -= 0.0003
  }

  function animateMoon(currentTimeSeconds: number, earthRotationZ: number): void {
    const material = refs.moonMesh.material
    if (!(material instanceof THREE.ShaderMaterial)) return

    const breathe = Math.sin(currentTimeSeconds * 0.25) * 0.5 + 0.5
    const scale = 1.0 + breathe * 0.05
    refs.moonMesh.scale.set(scale, scale, scale)

    if (material.uniforms['uEmissiveIntensity']) {
      material.uniforms['uEmissiveIntensity']!.value = 0.6 + breathe * 0.5
    }
    if (material.uniforms['uTime']) {
      material.uniforms['uTime']!.value = currentTimeSeconds
    }

    const rawOffsetX = -earthRotationZ * MOON_PARALLAX_FACTOR * MOON_DEPTH_MULTIPLIER
    const rawX = MOON_X + rawOffsetX
    // 非對稱 wrap：右邊小邊距（快速消失），左邊大邊距（從畫面外滑入）
    const rightEdge = MOON_HALF_WIDTH + MOON_VISUAL_RADIUS * 0.4
    const leftEdge = -(MOON_HALF_WIDTH + MOON_VISUAL_RADIUS)
    const totalRange = rightEdge - leftEdge
    const wrappedX = ((rawX - leftEdge) % totalRange + totalRange) % totalRange + leftEdge
    const halfRange = (rightEdge - leftEdge) / 2
    const center = (rightEdge + leftEdge) / 2
    const t = (wrappedX - center) / halfRange
    const arcY = MOON_Y_BASE + MOON_ARC_HEIGHT * (1 - t * t)
    refs.moonMesh.position.x = wrappedX
    refs.moonMesh.position.y = arcY
    refs.moonLight.position.x = wrappedX
    refs.moonLight.position.y = arcY
  }

  function animateStarParticles(deltaTimeSeconds: number, earthRotationZ: number): void {
    let aliveCount = 0

    for (const particle of refs.starParticles) {
      if (particle.life > 0) {
        particle.life -= deltaTimeSeconds / particle.maxLife

        if (particle.life <= 0) {
          particle.life = 0
          particle.mesh.visible = false
        } else {
          applyStarAppearance(particle)

          const depthMultiplier = STAR_PARALLAX_DEPTH_BASE / Math.max(CAMERA_Z - particle.mesh.position.z, 0.001)
          const offsetX = -earthRotationZ * STAR_PARALLAX_FACTOR * depthMultiplier
          particle.mesh.position.x = particle.originX + offsetX

          const halfWidth = CAMERA_HALF_FOV_TAN * Math.max(CAMERA_Z - particle.mesh.position.z, 0.001) * SCENE_ASPECT
          if (Math.abs(particle.mesh.position.x) > halfWidth * 1.3) {
            particle.life = 0
            particle.mesh.visible = false
          } else {
            aliveCount++
          }
        }
      }
    }

    // 死亡粒子有機率重生
    for (const particle of refs.starParticles) {
      if (particle.life <= 0 && aliveCount < MAX_ALIVE_STARS && Math.random() < 0.05) {
        spawnStar(particle, refs.starParticles, earthRotationZ)
        aliveCount++
      }
    }
  }

  function animateLimbs(walkTime: number): void {
    const {
      leftThighPivot,
      leftShinPivot,
      rightThighPivot,
      rightShinPivot,
      leftUpperArmPivot,
      leftForearmPivot,
      rightUpperArmPivot,
      rightForearmPivot,
    } = refs.stickFigure

    // 大腿：簡單的 sin 擺動，左右腿相位差 PI
    const leftHip = Math.sin(walkTime)
    const rightHip = Math.sin(walkTime + Math.PI)

    leftThighPivot.rotation.x = leftHip * 0.25
    rightThighPivot.rotation.x = rightHip * 0.25

    // 膝蓋：只在腿往前擺時微彎（清除地面）
    leftShinPivot.rotation.x = -Math.max(0, leftHip) * 0.22
    rightShinPivot.rotation.x = -Math.max(0, rightHip) * 0.22

    // 左臂（拿燈籠 - 固定姿勢）
    leftUpperArmPivot.rotation.x = 0.2
    leftUpperArmPivot.rotation.z = 0.15
    leftForearmPivot.rotation.x = 1.3

    // 右臂（跟左腿對側擺動）
    rightUpperArmPivot.rotation.x = leftHip * 0.15
    rightForearmPivot.rotation.x = -0.1 - Math.max(0, -leftHip) * 0.15
  }

  function animateLantern(walkTime: number, currentTimeSeconds: number): void {
    const { lanternGroup, lanternLight, lanternOrb } = refs.stickFigure

    const lanternSwing = Math.sin(walkTime * 2) * 0.06
    lanternGroup.rotation.z = lanternSwing
    lanternGroup.rotation.x = -1.5 + Math.sin(walkTime * 2 + 0.5) * 0.04

    const orbPulse = Math.sin(currentTimeSeconds * 2.5)
    const orbBreathe = orbPulse * 0.08 + 0.25

    const orbMaterial = lanternOrb.material
    if (orbMaterial instanceof THREE.MeshBasicMaterial) {
      orbMaterial.opacity = orbBreathe
    }

    lanternLight.intensity = 0.25 + orbPulse * 0.08
  }

  function animateStickFigure(currentTimeSeconds: number): void {
    const { stickFigure, body, head } = refs.stickFigure

    const walkTime = currentTimeSeconds * 2.8

    animateLimbs(walkTime)

    // 身體微微前傾（固定的走路姿態）+ 隨步伐微小晃動
    body.rotation.x = 0.03 + Math.sin(walkTime * 2) * 0.01
    body.rotation.z = Math.sin(walkTime) * 0.015

    // 頭部輕微晃動
    head.rotation.x = -0.03 + Math.sin(walkTime * 2) * 0.01
    head.rotation.y = Math.sin(walkTime * 0.5) * 0.02

    // 上下微彈（每步一次彈跳，幅度很小）
    const verticalBob = (1 - Math.cos(walkTime * 2)) * 0.008
    stickFigure.position.y = EARTH_Y + EARTH_RADIUS + 0.125 + verticalBob

    animateLantern(walkTime, currentTimeSeconds)
  }

  function animateCats(currentTimeSeconds: number): void {
    for (const cat of refs.cats) {
      const catWalkTime = currentTimeSeconds * 2.8 + cat.variant.walkPhaseOffset

      cat.leftFrontLegPivot.rotation.z = Math.sin(catWalkTime) * 0.25
      cat.rightBackLegPivot.rotation.z = Math.sin(catWalkTime) * 0.25
      cat.rightFrontLegPivot.rotation.z = Math.sin(catWalkTime + Math.PI) * 0.25
      cat.leftBackLegPivot.rotation.z = Math.sin(catWalkTime + Math.PI) * 0.25

      for (let i = 0; i < cat.tailSegments.length; i++) {
        const freq = TAIL_FREQS[i]!
        const amp = TAIL_AMPS[i]!
        const phase = currentTimeSeconds * freq + cat.variant.walkPhaseOffset + i * 0.8
        cat.tailSegments[i]!.rotation.x = Math.sin(phase) * amp
      }

      cat.bodyGroup.position.y = Math.sin(catWalkTime * 2) * 0.004
      cat.bodyGroup.position.z = Math.sin(currentTimeSeconds * 0.7 + cat.variant.walkPhaseOffset * 2) * 0.006
      cat.bodyGroup.rotation.z = Math.sin(catWalkTime) * 0.015
    }
  }

  function animateCape(currentTimeSeconds: number): void {
    const { capeMesh, originalCapePositions: original, capeVertexSeeds: seeds } = refs.stickFigure
    const capeGeo = capeMesh.geometry
    if (!(capeGeo instanceof THREE.BufferGeometry)) return
    const posAttr = capeGeo.getAttribute('position')
    const t = currentTimeSeconds

    for (let i = 0; i < posAttr.count; i++) {
      const originalX = original[i * 3]!
      const originalY = original[i * 3 + 1]!
      const originalZ = original[i * 3 + 2]!
      const distFromTop = -originalY
      const seed = seeds[i]!

      // Z 方向主飄動
      const zWave = calculateWave(CAPE_Z_WAVES, t, distFromTop, seed)
      const zOffset = zWave * distFromTop + distFromTop * 0.2
      posAttr.setZ(i, originalZ + Math.abs(zOffset) + distFromTop * 0.05)

      // X 方向左右擺動
      const xWave = calculateWave(CAPE_X_WAVES, t, distFromTop, seed)
      posAttr.setX(i, originalX + xWave * distFromTop)

      // Y 方向微小上下浮動
      const yWave = Math.sin(t * 2.7 + seed * 0.9) * distFromTop * 0.015
      posAttr.setY(i, originalY + yWave)
    }
    posAttr.needsUpdate = true
  }

  function updateShaderUniforms(currentTimeSeconds: number): void {
    for (const uniform of timeUniformSources) {
      uniform.value = currentTimeSeconds
    }
  }

  function animate(timestamp: number = 0): void {
    animationId = requestAnimationFrame(animate)
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp
      return
    }
    const deltaTimeSeconds = Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.1)
    lastTimestamp = timestamp
    const currentTimeSeconds = timestamp * 0.001

    animateEarth()
    refs.biomeManager.update(refs.earth.rotation.z)
    refs.biomeManager.animateFish(currentTimeSeconds)
    refs.npcManager?.update(refs.earth.rotation.z, currentTimeSeconds)
    animateMoon(currentTimeSeconds, refs.earth.rotation.z)
    animateStarParticles(deltaTimeSeconds, refs.earth.rotation.z)
    animateStickFigure(currentTimeSeconds)
    animateCats(currentTimeSeconds)
    animateCape(currentTimeSeconds)
    updateShaderUniforms(currentTimeSeconds)

    refs.composer.render()
  }

  function onResize(): void {
    if (!refs.containerRef.value) return
    const w = Math.max(refs.containerRef.value.clientWidth, 1)
    const h = Math.max(refs.containerRef.value.clientHeight, 1)
    refs.camera.aspect = SCENE_ASPECT
    refs.camera.updateProjectionMatrix()
    refs.renderer.setSize(w, h)
    refs.composer.setSize(w, h)
  }

  function disposeSceneResources(): void {
    refs.npcManager?.dispose()
    refs.biomeManager.dispose()
    disposeSharedToonGradientMap()

    const disposedTextures = new Set<THREE.Texture>()

    refs.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry?.dispose()

      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const mat of materials) {
        if (mat instanceof THREE.Material) {
          for (const value of Object.values(mat)) {
            if (value instanceof THREE.Texture && !disposedTextures.has(value)) {
              disposedTextures.add(value)
              value.dispose()
            }
          }
          mat.dispose()
        }
      }
    })
  }

  animationId = requestAnimationFrame(animate)
  window.addEventListener('resize', onResize)

  onUnmounted(() => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', onResize)
    disposeSceneResources()
    refs.composer.dispose()
    refs.renderer.dispose()
  })
}
