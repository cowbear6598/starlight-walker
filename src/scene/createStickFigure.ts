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

// 披風
const CAPE_WIDTH = 0.45
const CAPE_HEIGHT = 0.5
const CAPE_SEGMENTS_X = 12
const CAPE_SEGMENTS_Y = 24

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
  const dotMat = new THREE.MeshBasicMaterial({ color: '#aabbdd' })
  const dotCount = 6 + Math.floor(Math.random() * 3)
  for (let i = 0; i < dotCount; i++) {
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

  const brimGeo = new THREE.RingGeometry(0.28, 0.32, 32)
  const brimMat = new THREE.MeshBasicMaterial({
    color: '#667799',
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  })
  const brim = new THREE.Mesh(brimGeo, brimMat)
  brim.position.y = -0.14
  hat.add(brim)
}

export function createStickFigure(
  scene: THREE.Scene,
  outlineObjects: THREE.Object3D[],
): StickFigureRefs {
  const toonGradientMap = createToonGradientMap()
  const { lanternGroup, lanternLight, lanternOrb } = createLantern(toonGradientMap)

  function createToonMaterial(color: string): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({ color, gradientMap: toonGradientMap })
  }

  const stickFigure = new THREE.Group()

  const darkGrayMat = createToonMaterial('#4a4a4a')
  const lightGrayMat = createToonMaterial('#6a6a6a')
  const headMat = createToonMaterial('#7a7a7a')

  const headGeo = new THREE.IcosahedronGeometry(HEAD_RADIUS, 1)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = HEAD_Y
  stickFigure.add(head)

  const bodyGeo = new THREE.BoxGeometry(...BODY_SIZE)
  const body = new THREE.Mesh(bodyGeo, darkGrayMat)
  body.position.y = BODY_Y
  stickFigure.add(body)

  // Left arm: upper arm + forearm with pivot groups
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
  stickFigure.add(leftUpperArmPivot)

  // Right arm: upper arm + forearm with pivot groups
  const { pivot: rightUpperArmPivot } = createLimbPivot(
    [ARM_OFFSET_X, ARM_PIVOT_Y, 0],
    UPPER_ARM_SIZE,
    -0.09,
    lightGrayMat,
  )
  const { pivot: rightForearmPivot } = createLimbPivot([0, -0.18, 0], FOREARM_SIZE, -0.08, lightGrayMat)
  rightUpperArmPivot.add(rightForearmPivot)
  stickFigure.add(rightUpperArmPivot)

  // Left leg: thigh + shin with pivot groups
  const { pivot: leftThighPivot } = createLimbPivot(
    [-LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: leftShinPivot } = createLimbPivot([0, -0.2, 0], SHIN_SIZE, -0.09, darkGrayMat)
  leftThighPivot.add(leftShinPivot)
  stickFigure.add(leftThighPivot)

  // Right leg: thigh + shin with pivot groups
  const { pivot: rightThighPivot } = createLimbPivot(
    [LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: rightShinPivot } = createLimbPivot([0, -0.2, 0], SHIN_SIZE, -0.09, darkGrayMat)
  rightThighPivot.add(rightShinPivot)
  stickFigure.add(rightThighPivot)

  const capeGeo = new THREE.PlaneGeometry(CAPE_WIDTH, CAPE_HEIGHT, CAPE_SEGMENTS_X, CAPE_SEGMENTS_Y)
  capeGeo.translate(0, -0.25, 0)
  const capeMat = createToonMaterial('#3a3a5a')
  capeMat.side = THREE.DoubleSide
  const cape = new THREE.Mesh(capeGeo, capeMat)
  cape.position.set(0, 0.74, 0.05)
  cape.rotation.x = -0.25
  cape.name = 'cape'
  stickFigure.add(cape)

  const capePositions = cape.geometry.getAttribute('position')
  const originalCapePositions = new Float32Array(capePositions.array)

  // 預計算每個頂點的 seed，避免每幀重算
  const capeVertexSeeds = new Float32Array(capePositions.count)
  for (let i = 0; i < capePositions.count; i++) {
    capeVertexSeeds[i] = (originalCapePositions[i * 3] ?? 0) * 17.3 + (originalCapePositions[i * 3 + 1] ?? 0) * 13.7
  }

  const hatMat = createToonMaterial('#2a2a4a')
  const hatGeo = new THREE.ConeGeometry(HAT_RADIUS, HAT_HEIGHT, 16)
  const hat = new THREE.Mesh(hatGeo, hatMat)
  hat.position.y = HAT_Y
  head.add(hat)

  addHatDecoration(hat)

  stickFigure.rotation.y = Math.PI / 2
  stickFigure.position.set(0, EARTH_Y + EARTH_RADIUS, 0)
  scene.add(stickFigure)
  outlineObjects.push(stickFigure)

  return {
    stickFigure,
    body,
    head,
    leftThighPivot,
    leftShinPivot,
    rightThighPivot,
    rightShinPivot,
    leftUpperArmPivot,
    leftForearmPivot,
    rightUpperArmPivot,
    rightForearmPivot,
    capeMesh: cape,
    originalCapePositions,
    capeVertexSeeds,
    lanternGroup,
    lanternLight,
    lanternOrb,
  }
}
