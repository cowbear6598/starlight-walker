import * as THREE from 'three'
import type { Ref } from 'vue'
import { onUnmounted } from 'vue'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { EARTH_RADIUS, EARTH_Y, SCENE_ASPECT } from '@/constants/scene'
import { applyStarAppearance, spawnStar } from '@/scene/createStars'
import type { StarParticle } from '@/scene/createStars'
import type { StickFigureRefs } from '@/scene/createStickFigure'

export interface SceneRefs {
  containerRef: Ref<HTMLDivElement | undefined>
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  earth: THREE.Mesh
  moonMesh: THREE.Mesh
  stickFigure: StickFigureRefs
  starParticles: StarParticle[]
  sketchPass: ShaderPass
  paperPass: ShaderPass
  bgShaderMaterial: THREE.ShaderMaterial
}

export function useSceneAnimation(refs: SceneRefs): void {
  let animationId = 0
  let lastTimestamp = 0

  const timeUniformSources = [
    refs.bgShaderMaterial.uniforms['uTime'],
    refs.sketchPass.uniforms['uTime'],
    refs.paperPass.uniforms['uTime'],
  ].filter((u): u is { value: number } => u !== undefined)

  function animateEarth(): void {
    refs.earth.rotation.z -= 0.0008
  }

  function animateMoon(currentTimeSeconds: number): void {
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
  }

  function animateStarParticles(deltaTimeSeconds: number): void {
    let aliveCount = 0
    for (const particle of refs.starParticles) {
      if (particle.life > 0) aliveCount++
    }

    for (const particle of refs.starParticles) {
      if (particle.life <= 0) {
        if (aliveCount < 15 && Math.random() < 0.05) {
          spawnStar(particle, refs.starParticles)
          aliveCount++
        }
        continue
      }

      particle.life -= deltaTimeSeconds / particle.maxLife

      if (particle.life <= 0) {
        particle.life = 0
        particle.mesh.visible = false
        continue
      }

      applyStarAppearance(particle)
    }
  }

  function animateStickFigure(currentTimeSeconds: number): void {
    const { stickFigure, leftLeg, rightLeg, leftArm, rightArm } = refs.stickFigure
    const walkTime = currentTimeSeconds * 1.5

    leftLeg.rotation.x = Math.sin(walkTime) * 0.3
    rightLeg.rotation.x = Math.sin(walkTime + Math.PI) * 0.3
    leftArm.rotation.x = Math.sin(walkTime + Math.PI) * 0.2
    rightArm.rotation.x = Math.sin(walkTime) * 0.2

    stickFigure.position.y = EARTH_Y + EARTH_RADIUS + Math.abs(Math.sin(walkTime * 2)) * 0.02
  }

  function animateCape(currentTimeSeconds: number): void {
    const { capeMesh, originalCapePositions: original } = refs.stickFigure
    const capeGeo = capeMesh.geometry as THREE.BufferGeometry
    const posAttr = capeGeo.getAttribute('position')

    for (let i = 0; i < posAttr.count; i++) {
      const originalX = original[i * 3] ?? 0
      const originalY = original[i * 3 + 1] ?? 0
      const originalZ = original[i * 3 + 2] ?? 0
      const distFromTop = 0.25 - originalY
      const noiseValue = Math.sin(currentTimeSeconds * 3 + distFromTop * 5) * distFromTop * 0.15
      posAttr.setZ(i, originalZ - Math.abs(noiseValue) - distFromTop * 0.1)
      posAttr.setX(i, originalX + Math.sin(currentTimeSeconds * 3 * 0.7 + distFromTop * 3) * distFromTop * 0.05)
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
    const deltaTimeSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
    lastTimestamp = timestamp
    const currentTimeSeconds = timestamp * 0.001

    animateEarth()
    animateMoon(currentTimeSeconds)
    animateStarParticles(deltaTimeSeconds)
    animateStickFigure(currentTimeSeconds)
    animateCape(currentTimeSeconds)
    updateShaderUniforms(currentTimeSeconds)

    refs.composer.render()
  }

  function onResize(): void {
    if (!refs.containerRef.value) return
    const { clientWidth, clientHeight } = refs.containerRef.value
    refs.camera.aspect = SCENE_ASPECT
    refs.camera.updateProjectionMatrix()
    refs.renderer.setSize(clientWidth, clientHeight)
    refs.composer.setSize(clientWidth, clientHeight)
    if (refs.sketchPass.uniforms['uResolution']) {
      refs.sketchPass.uniforms['uResolution']!.value.set(clientWidth, clientHeight)
    }
  }

  function disposeSceneResources(): void {
    refs.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry?.dispose()
      if (object.material instanceof THREE.Material) {
        object.material.dispose()
        return
      }
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
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
