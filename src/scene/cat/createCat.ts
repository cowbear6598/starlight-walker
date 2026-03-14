import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_Y } from '@/constants/scene'
import { getSharedToonGradientMap } from '@/scene/materials'
import { createToonMaterial } from '@/scene/shared'
import type { CatVariant } from '@/scene/cat/catConfig'

const CAT_BODY_SIZE: [number, number, number] = [0.22, 0.09, 0.07]
const CAT_BODY_Y = 0.10
const CAT_HEAD_SIZE = 0.08
const CAT_HEAD_OFFSET_X = 0.10
const CAT_HEAD_OFFSET_Y = 0.04
const CAT_EAR_RADIUS = 0.035
const CAT_EAR_HEIGHT = 0.065
const CAT_LEG_RADIUS = 0.016
const CAT_LEG_HEIGHT = 0.08
const CAT_SCALE = 1.2
const CAT_ACCESSORY_OFFSET_X = -0.03
const CAT_ACCESSORY_OFFSET_Y = 0.04

export interface CatRefs {
  group: THREE.Group
  bodyGroup: THREE.Group
  leftFrontLegPivot: THREE.Group
  rightFrontLegPivot: THREE.Group
  leftBackLegPivot: THREE.Group
  rightBackLegPivot: THREE.Group
  tailSegments: THREE.Group[]
  variant: CatVariant
}

function createCatHead(variant: CatVariant, toonGradientMap: THREE.DataTexture): THREE.Group {
  const headGroup = new THREE.Group()
  const whiteMat = createToonMaterial('#f5f5f5', toonGradientMap)
  const pinkMat = createToonMaterial('#f0c0c0', toonGradientMap)

  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(CAT_HEAD_SIZE, CAT_HEAD_SIZE * 0.85, CAT_HEAD_SIZE),
    whiteMat,
  )
  headGroup.add(headMesh)

  function makeEar(side: number): void {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(CAT_EAR_RADIUS, CAT_EAR_HEIGHT, 4), whiteMat)
    ear.position.set(0, CAT_HEAD_SIZE * 0.5, side * CAT_HEAD_SIZE * 0.28)
    ear.rotation.z = side * -0.2
    headGroup.add(ear)

    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 4), pinkMat)
    earInner.position.set(0, CAT_HEAD_SIZE * 0.5, side * CAT_HEAD_SIZE * 0.28)
    earInner.rotation.z = side * -0.2
    headGroup.add(earInner)
  }

  makeEar(-1)
  makeEar(1)

  const eyeMat = createToonMaterial('#222222', toonGradientMap)

  function makeEye(side: number): void {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), eyeMat)
    eye.position.set(CAT_HEAD_SIZE * 0.5, CAT_HEAD_SIZE * 0.1, side * CAT_HEAD_SIZE * 0.2)
    headGroup.add(eye)
  }

  makeEye(-1)
  makeEye(1)

  const noseMat = createToonMaterial('#e8a0a0', toonGradientMap)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.012, 3), noseMat)
  nose.position.set(CAT_HEAD_SIZE * 0.5, 0, 0)
  nose.rotation.x = Math.PI
  headGroup.add(nose)

  const markingMat = createToonMaterial(variant.stripeColor, toonGradientMap)
  for (const marking of variant.headMarkings) {
    const markingMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * marking.scaleX, 0.015, 0.03 * marking.scaleZ),
      markingMat,
    )
    markingMesh.position.set(marking.x, marking.y, marking.z)
    headMesh.add(markingMesh)
  }

  return headGroup
}

interface LegPivots {
  leftFrontLegPivot: THREE.Group
  rightFrontLegPivot: THREE.Group
  leftBackLegPivot: THREE.Group
  rightBackLegPivot: THREE.Group
}

function createCatLegs(toonGradientMap: THREE.DataTexture): LegPivots {
  const legMat = createToonMaterial('#f0f0f0', toonGradientMap)
  const bodyHalfX = CAT_BODY_SIZE[0] / 2
  const bodyHalfY = CAT_BODY_SIZE[1] / 2
  const bodyHalfZ = CAT_BODY_SIZE[2] / 2

  function makeLegPivot(px: number, pz: number): THREE.Group {
    const pivot = new THREE.Group()
    pivot.position.set(px, CAT_BODY_Y - bodyHalfY, pz)
    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(CAT_LEG_RADIUS, CAT_LEG_RADIUS, CAT_LEG_HEIGHT, 6), legMat)
    legMesh.position.y = -CAT_LEG_HEIGHT / 2
    pivot.add(legMesh)
    return pivot
  }

  const leftFrontLegPivot = makeLegPivot(bodyHalfX - 0.03, -(bodyHalfZ - 0.02))
  const rightFrontLegPivot = makeLegPivot(bodyHalfX - 0.03, bodyHalfZ - 0.02)
  const leftBackLegPivot = makeLegPivot(-(bodyHalfX - 0.03), -(bodyHalfZ - 0.02))
  const rightBackLegPivot = makeLegPivot(-(bodyHalfX - 0.03), bodyHalfZ - 0.02)

  return { leftFrontLegPivot, rightFrontLegPivot, leftBackLegPivot, rightBackLegPivot }
}

interface TailSegConfig {
  length: number
  radiusTop: number
  radiusBottom: number
  initialRotZ: number
}

function createCatTail(toonGradientMap: THREE.DataTexture): THREE.Group[] {
  const tailMat = createToonMaterial('#f0f0f0', toonGradientMap)
  const bodyHalfX = CAT_BODY_SIZE[0] / 2
  const bodyHalfY = CAT_BODY_SIZE[1] / 2

  const segConfigs: TailSegConfig[] = [
    { length: 0.045, radiusTop: 0.01, radiusBottom: 0.009, initialRotZ: 0.3 },
    { length: 0.04, radiusTop: 0.009, radiusBottom: 0.008, initialRotZ: 0.1 },
    { length: 0.035, radiusTop: 0.008, radiusBottom: 0.006, initialRotZ: -0.3 },
    { length: 0.03, radiusTop: 0.006, radiusBottom: 0.004, initialRotZ: -0.6 },
    { length: 0.025, radiusTop: 0.004, radiusBottom: 0.002, initialRotZ: -0.5 },
  ]

  const pivots: THREE.Group[] = []
  let parentObj: THREE.Object3D | null = null

  for (let i = 0; i < segConfigs.length; i++) {
    const { length: segLength, radiusTop, radiusBottom, initialRotZ } = segConfigs[i]!

    const pivot = new THREE.Group()

    if (i === 0) {
      pivot.position.set(-bodyHalfX, CAT_BODY_Y + bodyHalfY * 0.5, 0)
    } else {
      const prevSegLength = segConfigs[i - 1]!.length
      pivot.position.y = prevSegLength
    }

    pivot.rotation.z = initialRotZ

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusBottom, radiusTop, segLength, 6),
      tailMat,
    )
    mesh.position.y = segLength / 2
    pivot.add(mesh)

    if (i > 0) {
      parentObj!.add(pivot)
    }

    pivots.push(pivot)
    parentObj = mesh
  }

  return pivots
}

function createStripes(
  variant: CatVariant,
  bodyMesh: THREE.Mesh,
  toonGradientMap: THREE.DataTexture,
): void {
  const stripeMat = createToonMaterial(variant.stripeColor, toonGradientMap)
  const bodyHalfY = CAT_BODY_SIZE[1] / 2

  for (const offset of variant.stripeOffsets) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.01, CAT_BODY_SIZE[2] + 0.008),
      stripeMat,
    )
    stripe.position.set(offset.x, bodyHalfY + 0.002, offset.z)
    bodyMesh.add(stripe)
  }
}

function createStarPattern(
  bodyMesh: THREE.Mesh,
  toonGradientMap: THREE.DataTexture,
  stripeColor: string,
): void {
  const mat = createToonMaterial(stripeColor, toonGradientMap)
  const bodyHalfZ = CAT_BODY_SIZE[2] / 2

  const starX = -0.02
  const starY = 0
  const starZ = -(bodyHalfZ + 0.003)

  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.008, 0.005),
      mat,
    )
    bar.position.set(starX, starY, starZ)
    bar.rotation.z = (i * Math.PI) / 3
    bodyMesh.add(bar)
  }
}

function createHeartPattern(
  bodyMesh: THREE.Mesh,
  toonGradientMap: THREE.DataTexture,
  stripeColor: string,
): void {
  const mat = createToonMaterial(stripeColor, toonGradientMap)
  const bodyHalfZ = CAT_BODY_SIZE[2] / 2

  const heartX = -0.02
  const heartY = 0.005
  const heartZ = -(bodyHalfZ + 0.003)

  const leftBump = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mat)
  leftBump.position.set(heartX - 0.012, heartY + 0.01, heartZ)
  bodyMesh.add(leftBump)

  const rightBump = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), mat)
  rightBump.position.set(heartX + 0.012, heartY + 0.01, heartZ)
  bodyMesh.add(rightBump)

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.005), mat)
  bottom.position.set(heartX, heartY - 0.008, heartZ)
  bottom.rotation.z = Math.PI / 4
  bodyMesh.add(bottom)
}

function createBellAccessory(
  variant: CatVariant,
  toonGradientMap: THREE.DataTexture,
): THREE.Group {
  const accessoryGroup = new THREE.Group()
  const bodyHalfX = CAT_BODY_SIZE[0] / 2

  accessoryGroup.position.set(bodyHalfX + CAT_ACCESSORY_OFFSET_X, CAT_BODY_Y + CAT_ACCESSORY_OFFSET_Y, 0)

  const ringMat = createToonMaterial('#555555', toonGradientMap)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 8), ringMat)
  accessoryGroup.add(ring)

  const bellMat = createToonMaterial(variant.accessoryColor, toonGradientMap)
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), bellMat)
  bell.position.y = -0.022
  accessoryGroup.add(bell)

  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 4), createToonMaterial('#8b6914', toonGradientMap))
  clapper.position.y = -0.034
  accessoryGroup.add(clapper)

  return accessoryGroup
}

function createBowAccessory(
  variant: CatVariant,
  toonGradientMap: THREE.DataTexture,
): THREE.Group {
  const accessoryGroup = new THREE.Group()
  const bodyHalfX = CAT_BODY_SIZE[0] / 2

  accessoryGroup.position.set(bodyHalfX + CAT_ACCESSORY_OFFSET_X, CAT_BODY_Y + CAT_ACCESSORY_OFFSET_Y, 0)

  const bowMat = createToonMaterial(variant.accessoryColor, toonGradientMap)

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.012), bowMat)
  leftWing.position.z = -0.02
  leftWing.rotation.y = 0.4
  accessoryGroup.add(leftWing)

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.012), bowMat)
  rightWing.position.z = 0.02
  rightWing.rotation.y = -0.4
  accessoryGroup.add(rightWing)

  const center = new THREE.Mesh(new THREE.SphereGeometry(0.007, 4, 4), bowMat)
  accessoryGroup.add(center)

  return accessoryGroup
}

export function createCat(variant: CatVariant, scene: THREE.Scene, outlineObjects: THREE.Object3D[]): CatRefs {
  const toonGradientMap = getSharedToonGradientMap()

  const group = new THREE.Group()
  group.rotation.y = Math.PI
  group.position.set(variant.offset.x, EARTH_Y + EARTH_RADIUS + variant.offset.y, variant.offset.z)
  group.scale.setScalar(CAT_SCALE)

  const bodyGroup = new THREE.Group()

  const headGroup = createCatHead(variant, toonGradientMap)
  headGroup.position.set(CAT_HEAD_OFFSET_X, CAT_BODY_Y + CAT_HEAD_OFFSET_Y, 0)
  bodyGroup.add(headGroup)

  const whiteMat = createToonMaterial('#f5f5f5', toonGradientMap)
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(...CAT_BODY_SIZE), whiteMat)
  bodyMesh.position.y = CAT_BODY_Y
  bodyGroup.add(bodyMesh)

  createStripes(variant, bodyMesh, toonGradientMap)

  if (variant.bodyPattern === 'star') {
    createStarPattern(bodyMesh, toonGradientMap, variant.stripeColor)
  } else {
    createHeartPattern(bodyMesh, toonGradientMap, variant.stripeColor)
  }

  const { leftFrontLegPivot, rightFrontLegPivot, leftBackLegPivot, rightBackLegPivot } = createCatLegs(toonGradientMap)
  bodyGroup.add(leftFrontLegPivot)
  bodyGroup.add(rightFrontLegPivot)
  bodyGroup.add(leftBackLegPivot)
  bodyGroup.add(rightBackLegPivot)

  const tailSegments = createCatTail(toonGradientMap)
  bodyGroup.add(tailSegments[0]!)

  const accessory = variant.id === 'bell'
    ? createBellAccessory(variant, toonGradientMap)
    : createBowAccessory(variant, toonGradientMap)
  bodyGroup.add(accessory)

  group.add(bodyGroup)
  scene.add(group)

  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      outlineObjects.push(object)
    }
  })

  return {
    group,
    bodyGroup,
    leftFrontLegPivot,
    rightFrontLegPivot,
    leftBackLegPivot,
    rightBackLegPivot,
    tailSegments,
    variant,
  }
}
