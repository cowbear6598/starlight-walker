import * as THREE from 'three'
import type { BiomeSeed, BiomeType } from '@/scene/createEarth'
import { classifyBiome } from '@/scene/createEarth'

export interface FaceCellData {
  center: THREE.Vector3
  normal: THREE.Vector3
  biomeType: BiomeType
  spawnAllowed: boolean
}

export const VISIBLE_ANGULAR_RADIUS = Math.PI / 2.5
export const FACE_RANDOM_OFFSET = 0.02
const MIN_Z_VISIBILITY = -0.1

export function getTriangleCentroid(
  positionAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  vertexOffset: number,
): [number, number, number] {
  const cx = (positionAttr.getX(vertexOffset) + positionAttr.getX(vertexOffset + 1) + positionAttr.getX(vertexOffset + 2)) / 3
  const cy = (positionAttr.getY(vertexOffset) + positionAttr.getY(vertexOffset + 1) + positionAttr.getY(vertexOffset + 2)) / 3
  const cz = (positionAttr.getZ(vertexOffset) + positionAttr.getZ(vertexOffset + 1) + positionAttr.getZ(vertexOffset + 2)) / 3
  return [cx, cy, cz]
}

export function buildFaceCells(
  geometry: THREE.BufferGeometry,
  biomeSeeds: BiomeSeed[],
): FaceCellData[] {
  const positionAttr = geometry.getAttribute('position')
  const faceCount = positionAttr.count / 3
  const faceCells: FaceCellData[] = []

  for (let i = 0; i < faceCount; i++) {
    const vertexOffset = i * 3
    const [cx, cy, cz] = getTriangleCentroid(positionAttr, vertexOffset)

    const center = new THREE.Vector3(cx, cy, cz)
    const normal = center.clone().normalize()

    const len = Math.sqrt(cx * cx + cy * cy + cz * cz)
    const theta = Math.atan2(cz, cx)
    const phi = len > 1e-10 ? Math.asin(Math.max(-1, Math.min(1, cy / len))) : 0
    const biomeType = classifyBiome(theta, phi, biomeSeeds)

    faceCells.push({ center, normal, biomeType, spawnAllowed: true })
  }

  markOceanSpawnAllowed(faceCells, positionAttr, faceCount)

  return faceCells
}

function buildEdgeKey(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): string {
  const precision = 1e4
  const a = `${Math.round(x1 * precision)},${Math.round(y1 * precision)},${Math.round(z1 * precision)}`
  const b = `${Math.round(x2 * precision)},${Math.round(y2 * precision)},${Math.round(z2 * precision)}`
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

// 海洋面若有任何相鄰面不是海洋，則不允許生成物件，防止魚出現在海陸邊界
function markOceanSpawnAllowed(
  faceCells: FaceCellData[],
  positionAttr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  faceCount: number,
): void {
  const edgeToFaces = new Map<string, number[]>()

  for (let i = 0; i < faceCount; i++) {
    const v = i * 3
    const x0 = positionAttr.getX(v), y0 = positionAttr.getY(v), z0 = positionAttr.getZ(v)
    const x1 = positionAttr.getX(v + 1), y1 = positionAttr.getY(v + 1), z1 = positionAttr.getZ(v + 1)
    const x2 = positionAttr.getX(v + 2), y2 = positionAttr.getY(v + 2), z2 = positionAttr.getZ(v + 2)

    const edges = [
      buildEdgeKey(x0, y0, z0, x1, y1, z1),
      buildEdgeKey(x1, y1, z1, x2, y2, z2),
      buildEdgeKey(x2, y2, z2, x0, y0, z0),
    ]

    for (const key of edges) {
      const list = edgeToFaces.get(key)
      if (list) {
        list.push(i)
      } else {
        edgeToFaces.set(key, [i])
      }
    }
  }

  const neighbors: number[][] = Array.from({ length: faceCount }, () => [])

  for (const faces of edgeToFaces.values()) {
    for (let a = 0; a < faces.length; a++) {
      for (let b = a + 1; b < faces.length; b++) {
        neighbors[faces[a]!]!.push(faces[b]!)
        neighbors[faces[b]!]!.push(faces[a]!)
      }
    }
  }

  for (let i = 0; i < faceCount; i++) {
    const cell = faceCells[i]!
    if (cell.biomeType !== 'ocean') {
      cell.spawnAllowed = true
      continue
    }
    cell.spawnAllowed = neighbors[i]!.every(neighborIdx => faceCells[neighborIdx]!.biomeType === 'ocean')
  }
}

export function getVisibleFaces(faceCells: FaceCellData[], earthRotationZ: number): number[] {
  const charDirX = Math.sin(earthRotationZ)
  const charDirY = Math.cos(earthRotationZ)
  const cosThreshold = Math.cos(VISIBLE_ANGULAR_RADIUS)
  const visibleFaces: number[] = []

  for (let i = 0; i < faceCells.length; i++) {
    const { normal } = faceCells[i]!
    if (normal.z < MIN_Z_VISIBILITY) continue
    const dot = charDirX * normal.x + charDirY * normal.y
    if (dot >= cosThreshold) {
      visibleFaces.push(i)
    }
  }

  return visibleFaces
}
