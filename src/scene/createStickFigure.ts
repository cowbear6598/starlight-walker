import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_Y } from '@/constants/scene'

// 角色幾何尺寸
const HEAD_RADIUS = 0.18
const BODY_SIZE: [number, number, number] = [0.16, 0.45, 0.1]
const BODY_Y = 0.52
const HEAD_Y = 0.9

// 手臂
const UPPER_ARM_SIZE: [number, number, number] = [0.06, 0.18, 0.06]
const FOREARM_SIZE: [number, number, number] = [0.05, 0.16, 0.05]
const ARM_PIVOT_Y = 0.72
const ARM_OFFSET_X = 0.14

// 腿
const THIGH_SIZE: [number, number, number] = [0.08, 0.2, 0.08]
const SHIN_SIZE: [number, number, number] = [0.07, 0.18, 0.07]
const LEG_PIVOT_Y = 0.3
const LEG_OFFSET_X = 0.06

// 斗笠
const HAT_RADIUS = 0.3
const HAT_HEIGHT = 0.28
const HAT_Y = 0.19

const HAT_COLOR = '#2a2a4a'

// 披風
const CAPE_SEGMENTS_X = 12
const CAPE_SEGMENTS_Y = 24
const CAPE_WIDTH = 0.45
const CAPE_HEIGHT = 0.5
const CAPE_COLOR = '#0f1a30'
const CAPE_FADE_COLOR = '#3a5a88'

export interface StickFigureRefs {
  stickFigure: THREE.Group
  body: THREE.Mesh
  head: THREE.Mesh
  leftThighPivot: THREE.Group
  leftShinPivot: THREE.Group
  rightThighPivot: THREE.Group
  rightShinPivot: THREE.Group
  leftUpperArmPivot: THREE.Group
  leftForearmPivot: THREE.Group
  rightUpperArmPivot: THREE.Group
  rightForearmPivot: THREE.Group
  capeMesh: THREE.Mesh
  originalCapePositions: Float32Array
  capeVertexSeeds: Float32Array
  lanternGroup: THREE.Group
  lanternLight: THREE.PointLight
  lanternOrb: THREE.Mesh
}

function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([80, 160, 255])
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

interface LanternRefs {
  lanternGroup: THREE.Group
  lanternLight: THREE.PointLight
  lanternOrb: THREE.Mesh
}

function createLantern(toonGradientMap: THREE.DataTexture): LanternRefs {
  const woodMat = new THREE.MeshToonMaterial({ color: '#6b4226', gradientMap: toonGradientMap })

  const lanternGroup = new THREE.Group()

  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), woodMat)
  hook.rotation.z = Math.PI
  hook.position.y = 0
  lanternGroup.add(hook)

  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.09, 0.05, 8), woodMat)
  topCap.position.y = -0.05
  lanternGroup.add(topCap)

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), woodMat)
    bar.position.set(Math.cos(angle) * 0.065, -0.15, Math.sin(angle) * 0.065)
    lanternGroup.add(bar)
  }

  const baseCap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.035, 0.05, 8), woodMat)
  baseCap.position.y = -0.25
  lanternGroup.add(baseCap)

  const orbMat = new THREE.MeshBasicMaterial({ color: '#ffcc66', transparent: true, opacity: 0.6 })
  const lanternOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), orbMat)
  lanternOrb.position.y = -0.15
  lanternGroup.add(lanternOrb)

  const lanternLight = new THREE.PointLight('#ffcc66', 0.3, 2.0, 2)
  lanternLight.position.y = -0.15
  lanternGroup.add(lanternLight)

  return { lanternGroup, lanternLight, lanternOrb }
}

function createLimbPivot(
  position: [number, number, number],
  meshSize: [number, number, number],
  meshOffsetY: number,
  material: THREE.MeshToonMaterial,
): { pivot: THREE.Group; mesh: THREE.Mesh } {
  const pivot = new THREE.Group()
  pivot.position.set(...position)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...meshSize), material)
  mesh.position.y = meshOffsetY
  pivot.add(mesh)
  return { pivot, mesh }
}

function addHatDecoration(hat: THREE.Mesh): void {
  const dotCount = 6 + Math.floor(Math.random() * 3)
  for (let i = 0; i < dotCount; i++) {
    const dotMat = new THREE.MeshBasicMaterial({ color: '#aabbdd' })
    const radius = 0.006 + Math.random() * 0.006
    const dotGeo = new THREE.SphereGeometry(radius, 4, 4)
    const dot = new THREE.Mesh(dotGeo, dotMat)

    const theta = Math.PI * (0.4 + Math.random() * 1.2)
    const heightRatio = 0.15 + Math.random() * 0.65
    const r = HAT_RADIUS * (1 - heightRatio)
    const x = r * Math.cos(theta)
    const z = r * Math.sin(theta)
    const y = heightRatio * HAT_HEIGHT - 0.14

    const nx = x === 0 && z === 0 ? 0 : x / Math.sqrt(x * x + z * z)
    const nz = x === 0 && z === 0 ? 0 : z / Math.sqrt(x * x + z * z)
    dot.position.set(x + nx * 0.005, y, z + nz * 0.005)
    hat.add(dot)
  }

  const glowRingGeo = new THREE.TorusGeometry(0.30, 0.008, 8, 32)
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: '#7799bb',
    transparent: true,
    opacity: 0.5,
  })
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat)
  glowRing.position.y = -0.14
  glowRing.rotation.x = Math.PI / 2
  hat.add(glowRing)
}

function createHeadAndHat(headMat: THREE.MeshToonMaterial, toonGradientMap: THREE.DataTexture): THREE.Mesh {
  const headGeo = new THREE.IcosahedronGeometry(HEAD_RADIUS, 1)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = HEAD_Y

  const hatMat = new THREE.MeshToonMaterial({ color: HAT_COLOR, gradientMap: toonGradientMap })
  const hatGeo = new THREE.ConeGeometry(HAT_RADIUS, HAT_HEIGHT, 16)
  const hat = new THREE.Mesh(hatGeo, hatMat)
  hat.position.y = HAT_Y
  head.add(hat)

  addHatDecoration(hat)

  return head
}

interface LimbsRefs {
  leftUpperArmPivot: THREE.Group
  leftForearmPivot: THREE.Group
  rightUpperArmPivot: THREE.Group
  rightForearmPivot: THREE.Group
  leftThighPivot: THREE.Group
  leftShinPivot: THREE.Group
  rightThighPivot: THREE.Group
  rightShinPivot: THREE.Group
}

function createLimbs(
  darkGrayMat: THREE.MeshToonMaterial,
  lightGrayMat: THREE.MeshToonMaterial,
  lanternGroup: THREE.Group,
): LimbsRefs {
  const { pivot: leftUpperArmPivot } = createLimbPivot(
    [-ARM_OFFSET_X, ARM_PIVOT_Y, 0],
    UPPER_ARM_SIZE,
    -0.09,
    lightGrayMat,
  )
  const { pivot: leftForearmPivot } = createLimbPivot([0, -0.18, 0], FOREARM_SIZE, -0.08, lightGrayMat)
  lanternGroup.position.set(0, -0.16, 0)
  leftForearmPivot.add(lanternGroup)
  leftUpperArmPivot.add(leftForearmPivot)

  const { pivot: rightUpperArmPivot } = createLimbPivot(
    [ARM_OFFSET_X, ARM_PIVOT_Y, 0],
    UPPER_ARM_SIZE,
    -0.09,
    lightGrayMat,
  )
  const { pivot: rightForearmPivot } = createLimbPivot([0, -0.18, 0], FOREARM_SIZE, -0.08, lightGrayMat)
  rightUpperArmPivot.add(rightForearmPivot)

  const { pivot: leftThighPivot } = createLimbPivot(
    [-LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: leftShinPivot } = createLimbPivot([0, -0.2, 0], SHIN_SIZE, -0.09, darkGrayMat)
  leftThighPivot.add(leftShinPivot)

  const { pivot: rightThighPivot } = createLimbPivot(
    [LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: rightShinPivot } = createLimbPivot([0, -0.2, 0], SHIN_SIZE, -0.09, darkGrayMat)
  rightThighPivot.add(rightShinPivot)

  return {
    leftUpperArmPivot,
    leftForearmPivot,
    rightUpperArmPivot,
    rightForearmPivot,
    leftThighPivot,
    leftShinPivot,
    rightThighPivot,
    rightShinPivot,
  }
}

interface CapeRefs {
  capeMesh: THREE.Mesh
  originalCapePositions: Float32Array
  capeVertexSeeds: Float32Array
}

function createCape(toonGradientMap: THREE.DataTexture): CapeRefs {
  const capeGeo = new THREE.PlaneGeometry(CAPE_WIDTH, CAPE_HEIGHT, CAPE_SEGMENTS_X, CAPE_SEGMENTS_Y)
  capeGeo.translate(0, -0.25, 0)

  const capeMat = new THREE.MeshToonMaterial({
    color: '#ffffff',
    gradientMap: toonGradientMap,
    side: THREE.DoubleSide,
    vertexColors: true,
  })

  // 建立底部漸淡的 vertex colors：頂部使用原色，底部漸變到較亮的顏色
  const posAttr = capeGeo.getAttribute('position')
  const colorArray = new Float32Array(posAttr.count * 3)
  const baseColor = new THREE.Color(CAPE_COLOR)
  const fadeColor = new THREE.Color(CAPE_FADE_COLOR)

  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i)
    const t = Math.max(0, Math.min(1, -y / CAPE_HEIGHT))
    const color = baseColor.clone().lerp(fadeColor, t)

    colorArray[i * 3] = color.r
    colorArray[i * 3 + 1] = color.g
    colorArray[i * 3 + 2] = color.b
  }

  capeGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

  const capeMesh = new THREE.Mesh(capeGeo, capeMat)
  capeMesh.position.set(0, 0.74, 0.05)
  capeMesh.rotation.x = -0.25
  capeMesh.name = 'cape'

  const capePositions = capeMesh.geometry.getAttribute('position')
  const originalCapePositions = new Float32Array(capePositions.array)

  // 預計算每個頂點的 seed，避免每幀重算
  const capeVertexSeeds = new Float32Array(capePositions.count)
  for (let i = 0; i < capePositions.count; i++) {
    capeVertexSeeds[i] = (originalCapePositions[i * 3] ?? 0) * 17.3 + (originalCapePositions[i * 3 + 1] ?? 0) * 13.7
  }

  return { capeMesh, originalCapePositions, capeVertexSeeds }
}

export function createStickFigure(scene: THREE.Scene, outlineObjects: THREE.Object3D[]): StickFigureRefs {
  const toonGradientMap = createToonGradientMap()
  const { lanternGroup, lanternLight, lanternOrb } = createLantern(toonGradientMap)

  function createToonMaterial(color: string): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({ color, gradientMap: toonGradientMap })
  }

  const stickFigure = new THREE.Group()
  const darkGrayMat = createToonMaterial('#4a4a4a')
  const lightGrayMat = createToonMaterial('#6a6a6a')
  const headMat = createToonMaterial('#7a7a7a')

  const head = createHeadAndHat(headMat, toonGradientMap)
  stickFigure.add(head)

  const bodyGeo = new THREE.BoxGeometry(...BODY_SIZE)
  const body = new THREE.Mesh(bodyGeo, darkGrayMat)
  body.position.y = BODY_Y
  stickFigure.add(body)

  const limbs = createLimbs(darkGrayMat, lightGrayMat, lanternGroup)
  stickFigure.add(limbs.leftUpperArmPivot)
  stickFigure.add(limbs.rightUpperArmPivot)
  stickFigure.add(limbs.leftThighPivot)
  stickFigure.add(limbs.rightThighPivot)

  const { capeMesh, originalCapePositions, capeVertexSeeds } = createCape(toonGradientMap)
  stickFigure.add(capeMesh)

  stickFigure.rotation.y = Math.PI / 2
  stickFigure.position.set(0, EARTH_Y + EARTH_RADIUS, 0)
  scene.add(stickFigure)
  outlineObjects.push(stickFigure)

  return {
    stickFigure, body, head,
    ...limbs,
    capeMesh, originalCapePositions, capeVertexSeeds,
    lanternGroup, lanternLight, lanternOrb,
  }
}
