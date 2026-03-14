import * as THREE from 'three'
import type { NpcData } from '@/scene/npc/npcConfig'
import { sphericalToCartesian, createToonMaterial, createLimbPivot } from '@/scene/shared'

const SURFACE_OFFSET = 0.01

const HEAD_RADIUS = 0.18
const BODY_SIZE: [number, number, number] = [0.16, 0.45, 0.1]
const BODY_Y = 0.52
const HEAD_Y = 0.9

const UPPER_ARM_SIZE: [number, number, number] = [0.06, 0.18, 0.06]
const FOREARM_SIZE: [number, number, number] = [0.05, 0.16, 0.05]
const ARM_PIVOT_Y = 0.72
const ARM_OFFSET_X = 0.14

const THIGH_SIZE: [number, number, number] = [0.08, 0.2, 0.08]
const SHIN_SIZE: [number, number, number] = [0.07, 0.18, 0.07]
const LEG_PIVOT_Y = 0.3
const LEG_OFFSET_X = 0.06

export interface NpcRefs {
  group: THREE.Group
  bodyMeshes: THREE.Mesh[]
  rightUpperArmPivot: THREE.Group
  rightForearmPivot: THREE.Group
  flagFaceGroup: THREE.Group
  npcData: NpcData
}

interface NpcBodyResult {
  bodyGroup: THREE.Group
  bodyMeshes: THREE.Mesh[]
  rightUpperArmPivot: THREE.Group
  rightForearmPivot: THREE.Group
}

function createNpcBody(
  toonGradientMap: THREE.DataTexture,
  hatColor: string,
  scarfColor: string,
): NpcBodyResult {
  const bodyMeshes: THREE.Mesh[] = []
  const bodyGroup = new THREE.Group()

  const darkGrayMat = createToonMaterial('#4a4a4a', toonGradientMap)
  const lightGrayMat = createToonMaterial('#6a6a6a', toonGradientMap)
  const headMat = createToonMaterial('#7a7a7a', toonGradientMap)
  const hatMat = createToonMaterial(hatColor, toonGradientMap)
  const scarfMat = createToonMaterial(scarfColor, toonGradientMap)

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(HEAD_RADIUS, 1), headMat)
  head.position.y = HEAD_Y
  bodyGroup.add(head)
  bodyMeshes.push(head)

  const hat = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hatMat,
  )
  hat.position.y = 0.12
  head.add(hat)
  bodyMeshes.push(hat)

  const body = new THREE.Mesh(new THREE.BoxGeometry(...BODY_SIZE), darkGrayMat)
  body.position.y = BODY_Y
  bodyGroup.add(body)
  bodyMeshes.push(body)

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 12), scarfMat)
  scarf.position.y = 0.75
  scarf.rotation.x = Math.PI / 2
  bodyGroup.add(scarf)
  bodyMeshes.push(scarf)

  const { pivot: leftUpperArmPivot, mesh: leftUpperArmMesh } = createLimbPivot(
    [-ARM_OFFSET_X, ARM_PIVOT_Y, 0],
    UPPER_ARM_SIZE,
    -0.09,
    lightGrayMat,
  )
  const { pivot: leftForearmPivot, mesh: leftForearmMesh } = createLimbPivot(
    [0, -0.18, 0],
    FOREARM_SIZE,
    -0.08,
    lightGrayMat,
  )
  leftUpperArmPivot.add(leftForearmPivot)
  bodyGroup.add(leftUpperArmPivot)
  bodyMeshes.push(leftUpperArmMesh, leftForearmMesh)

  const { pivot: rightUpperArmPivot, mesh: rightUpperArmMesh } = createLimbPivot(
    [ARM_OFFSET_X, ARM_PIVOT_Y, 0],
    UPPER_ARM_SIZE,
    -0.09,
    lightGrayMat,
  )
  const { pivot: rightForearmPivot, mesh: rightForearmMesh } = createLimbPivot(
    [0, -0.18, 0],
    FOREARM_SIZE,
    -0.08,
    lightGrayMat,
  )
  rightUpperArmPivot.add(rightForearmPivot)
  bodyGroup.add(rightUpperArmPivot)
  bodyMeshes.push(rightUpperArmMesh, rightForearmMesh)

  const { pivot: leftThighPivot, mesh: leftThighMesh } = createLimbPivot(
    [-LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: leftShinPivot, mesh: leftShinMesh } = createLimbPivot(
    [0, -0.2, 0],
    SHIN_SIZE,
    -0.09,
    darkGrayMat,
  )
  leftThighPivot.add(leftShinPivot)
  bodyGroup.add(leftThighPivot)
  bodyMeshes.push(leftThighMesh, leftShinMesh)

  const { pivot: rightThighPivot, mesh: rightThighMesh } = createLimbPivot(
    [LEG_OFFSET_X, LEG_PIVOT_Y, 0],
    THIGH_SIZE,
    -0.1,
    darkGrayMat,
  )
  const { pivot: rightShinPivot, mesh: rightShinMesh } = createLimbPivot(
    [0, -0.2, 0],
    SHIN_SIZE,
    -0.09,
    darkGrayMat,
  )
  rightThighPivot.add(rightShinPivot)
  bodyGroup.add(rightThighPivot)
  bodyMeshes.push(rightThighMesh, rightShinMesh)

  return { bodyGroup, bodyMeshes, rightUpperArmPivot, rightForearmPivot }
}

interface FlagResult {
  flagGroup: THREE.Group
  flagFaceGroup: THREE.Group
}

function createFlag(avatarTexture: THREE.Texture, toonGradientMap: THREE.DataTexture): FlagResult {
  const flagGroup = new THREE.Group()
  const flagFaceGroup = new THREE.Group()

  const poleMat = new THREE.MeshToonMaterial({ color: '#5a4a3a', gradientMap: toonGradientMap })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), poleMat)
  pole.position.set(-0.08, 1.1, -0.08)
  flagGroup.add(pole)

  // flagFaceGroup 的 pivot 在旗桿連接處（左邊緣），這樣旋轉時只有遠離旗桿的一側飄動
  flagFaceGroup.position.set(-0.08, 1.1 + 0.25 / 2 + 0.11, -0.08)
  flagGroup.add(flagFaceGroup)

  const flagGeo = new THREE.PlaneGeometry(0.38, 0.38)
  const flagMat = new THREE.MeshBasicMaterial({
    map: avatarTexture,
    side: THREE.DoubleSide,
    color: 0x888888,
  })
  const flagMesh = new THREE.Mesh(flagGeo, flagMat)
  flagMesh.position.x = 0.20  // 往右偏移，讓左邊緣對齊旗桿
  flagFaceGroup.add(flagMesh)

  const borderGeo = new THREE.PlaneGeometry(0.42, 0.42)
  const borderMat = new THREE.MeshToonMaterial({
    color: '#aaaaaa',
    gradientMap: toonGradientMap,
    side: THREE.DoubleSide,
  })
  const borderMesh = new THREE.Mesh(borderGeo, borderMat)
  borderMesh.position.set(0.20, 0, -0.02)  // 跟照片同 x 偏移
  flagFaceGroup.add(borderMesh)

  return { flagGroup, flagFaceGroup }
}

export async function preloadAvatarTextures(npcList: NpcData[]): Promise<Map<string, THREE.Texture>> {
  const loader = new THREE.TextureLoader()
  const entries = await Promise.all(
    npcList.map(async (npcData) => {
      const texture = await loader.loadAsync(npcData.avatarModule)
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.generateMipmaps = true
      texture.anisotropy = 4
      return [npcData.id, texture] as [string, THREE.Texture]
    }),
  )
  return new Map(entries)
}

export function repositionNpc(npcRefs: NpcRefs, theta: number, phi: number): void {
  const position = sphericalToCartesian(theta, phi)
  const normal = position.clone().normalize()
  const offsetPosition = position.clone().add(normal.clone().multiplyScalar(SURFACE_OFFSET))
  npcRefs.group.position.copy(offsetPosition)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
  npcRefs.group.quaternion.copy(quaternion)
}

export function createNpc(
  npcData: NpcData,
  avatarTexture: THREE.Texture,
  earth: THREE.Mesh,
  toonGradientMap: THREE.DataTexture,
  outlineObjects: THREE.Object3D[],
  theta: number,
  phi: number,
): NpcRefs {
  const { bodyGroup, bodyMeshes, rightUpperArmPivot, rightForearmPivot } = createNpcBody(
    toonGradientMap,
    npcData.hatColor,
    npcData.scarfColor,
  )

  const { flagGroup, flagFaceGroup } = createFlag(avatarTexture, toonGradientMap)

  const group = new THREE.Group()
  group.add(bodyGroup)
  group.add(flagGroup)

  const npcRefs: NpcRefs = {
    group,
    bodyMeshes,
    rightUpperArmPivot,
    rightForearmPivot,
    flagFaceGroup,
    npcData,
  }

  repositionNpc(npcRefs, theta, phi)

  group.visible = false
  earth.add(group)

  for (const mesh of bodyMeshes) {
    outlineObjects.push(mesh)
  }

  return npcRefs
}
