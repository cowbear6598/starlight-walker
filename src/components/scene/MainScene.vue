<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SCENE_ASPECT, MOON_ARC_HEIGHT, MOON_X, MOON_Y_BASE, MOON_Z, NPC_SPAWN_INTERVAL_MIN, NPC_SPAWN_INTERVAL_MAX, NPC_SPAWN_FIRST_DELAY_MIN, NPC_SPAWN_FIRST_DELAY_MAX, NPC_MAX_ALIVE, ENV_SPAWN_INTERVAL_MIN, ENV_SPAWN_INTERVAL_MAX, ENV_SPAWN_FIRST_DELAY_MIN, ENV_SPAWN_FIRST_DELAY_MAX, ENV_INITIAL_COUNT } from '@/constants/scene'
import { PaperTextureShader } from '@/shaders/PaperTextureShader'
import { BackgroundShader } from '@/shaders/BackgroundShader'
import { createEarth } from '@/scene/createEarth'
import { DynamicBiomeManager } from '@/scene/biomeObjects/dynamicBiomeManager'
import { createMoon } from '@/scene/createMoon'
import { createStars } from '@/scene/createStars'
import { createStickFigure } from '@/scene/createStickFigure'
import { getSharedToonGradientMap } from '@/scene/materials'
import { createCat } from '@/scene/cat/createCat'
import { CAT_VARIANTS } from '@/scene/cat/catConfig'
import type { CatRefs } from '@/scene/cat/createCat'
import { NPC_LIST } from '@/scene/npc/npcConfig'
import { preloadAvatarTextures } from '@/scene/npc/createNpc'
import { NpcManager } from '@/scene/npc/npcManager'
import type { NpcVisibilityState } from '@/scene/npc/npcManager'
import { SpawnTrigger } from '@/scene/spawn/spawnTrigger'
import { NpcSpawner } from '@/scene/spawn/npcSpawner'
import { useNpcInteraction } from '@/composables/useNpcInteraction'
import { useSceneAnimation } from '@/composables/useSceneAnimation'
import { MeteorSystem } from '@/scene/meteor/meteorSystem'
import { useOnlineCount } from '@/composables/useOnlineCount'
import { EnvObjectSpawner } from '@/scene/spawn/envObjectSpawner'
import { EnvObjectManager } from '@/scene/envObject/envObjectManager'
import NpcNameLabel from '@/components/scene/NpcNameLabel.vue'

const containerRef = ref<HTMLDivElement>()
const npcVisibilityStates = ref<NpcVisibilityState[]>([])
const { onlineCount } = useOnlineCount()

onMounted(() => {
  if (!containerRef.value) return

  const { clientWidth, clientHeight } = containerRef.value

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, SCENE_ASPECT, 0.1, 2000)
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(clientWidth, clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  containerRef.value.appendChild(renderer.domElement)

  const outlineObjects: THREE.Object3D[] = []

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const outlinePass = new OutlinePass(
    new THREE.Vector2(clientWidth, clientHeight),
    scene,
    camera,
  )
  outlinePass.selectedObjects = outlineObjects
  outlinePass.edgeStrength = 3.0
  outlinePass.edgeGlow = 0.0
  outlinePass.edgeThickness = 1.5
  outlinePass.visibleEdgeColor = new THREE.Color('#2a2a2a')
  outlinePass.hiddenEdgeColor = new THREE.Color('#2a2a2a')
  composer.addPass(outlinePass)

  const paperPass = new ShaderPass(PaperTextureShader)
  composer.addPass(paperPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth, clientHeight),
    0.3,
    0.3,
    0.6,
  )
  composer.addPass(bloomPass)

  scene.add(new THREE.AmbientLight('#aabbcc', 0.8))
  const directionalLight = new THREE.DirectionalLight('#ffffff', 1.0)
  directionalLight.position.set(3, 6, 10)
  scene.add(directionalLight)
  const moonLight = new THREE.PointLight('#f5d76e', 0.5, 50)
  moonLight.position.set(MOON_X, MOON_Y_BASE + MOON_ARC_HEIGHT, MOON_Z)
  scene.add(moonLight)

  const bgGeometry = new THREE.PlaneGeometry(2, 2)
  const bgMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    ...BackgroundShader,
  })
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
  bgMesh.renderOrder = -1000
  bgMesh.frustumCulled = false
  scene.add(bgMesh)

  const { earth, faceCells } = createEarth(scene, outlineObjects)
  const starParticles = createStars(scene, outlineObjects)
  const moonMesh = createMoon(scene)
  const stickFigure = createStickFigure(scene, outlineObjects)

  const cats: CatRefs[] = CAT_VARIANTS.map((variant) => createCat(variant, scene, outlineObjects))

  const biomeManager = new DynamicBiomeManager(earth, faceCells, outlineObjects, outlinePass)

  const meteorSystem = new MeteorSystem({ scene, onlineCount })

  const toonGradientMap = getSharedToonGradientMap()

  const envObjectSpawner = new EnvObjectSpawner(earth, camera, toonGradientMap, outlineObjects, outlinePass)
  envObjectSpawner.spawnInitial(ENV_INITIAL_COUNT)
  const envSpawnTrigger = new SpawnTrigger(ENV_SPAWN_INTERVAL_MIN, ENV_SPAWN_INTERVAL_MAX, ENV_SPAWN_FIRST_DELAY_MIN, ENV_SPAWN_FIRST_DELAY_MAX)
  envSpawnTrigger.register({ type: 'envObject', spawn: () => envObjectSpawner.spawn() })
  const envObjectManager = new EnvObjectManager(envObjectSpawner, earth)

  const sceneRefs = {
    containerRef,
    renderer,
    scene,
    camera,
    composer,
    earth,
    moonMesh,
    moonLight,
    stickFigure,
    starParticles,
    paperPass,
    bgShaderMaterial: bgMaterial,
    biomeManager,
    npcManager: null as NpcManager | null,
    spawnTrigger: null as SpawnTrigger | null,
    npcSpawner: null as NpcSpawner | null,
    cats,
    envObjectManager: envObjectManager as EnvObjectManager | null,
    envSpawnTrigger: envSpawnTrigger as SpawnTrigger | null,
    envObjectSpawner: envObjectSpawner as EnvObjectSpawner | null,
    meteorSystem,
  }

  useSceneAnimation(sceneRefs)

  preloadAvatarTextures(NPC_LIST).then((textureMap) => {
    const npcSpawner = new NpcSpawner(
      NPC_LIST,
      textureMap,
      earth,
      camera,
      toonGradientMap,
      outlineObjects,
      outlinePass,
      NPC_MAX_ALIVE,
    )

    const spawnTrigger = new SpawnTrigger(NPC_SPAWN_INTERVAL_MIN, NPC_SPAWN_INTERVAL_MAX, NPC_SPAWN_FIRST_DELAY_MIN, NPC_SPAWN_FIRST_DELAY_MAX)
    spawnTrigger.register({ type: 'npc', spawn: () => npcSpawner.spawn() })

    const npcManager = new NpcManager(npcSpawner, camera, npcVisibilityStates, earth)
    sceneRefs.npcManager = npcManager
    sceneRefs.spawnTrigger = spawnTrigger
    sceneRefs.npcSpawner = npcSpawner

    const interaction = useNpcInteraction(renderer, camera, npcManager)
    npcManager.setInteractionDispose(interaction.dispose)
  }).catch((error) => {
    console.error('Failed to load NPC avatar textures:', error)
  })
})
</script>

<template>
  <div ref="containerRef" class="scene-wrapper">
    <NpcNameLabel :labels="npcVisibilityStates" />
  </div>
</template>

<style scoped>
.scene-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
