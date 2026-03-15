import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_Y } from '@/constants/scene'
import {
  deepForestColors,
  desertColors,
  landColors,
  mountainColors,
  oceanColors,
  snowColors,
} from '@/scene/terrainColors'
import { pickRandom } from '@/utils/random'
import type { FaceCellData } from '@/scene/biomeObjects/faceCellSystem'
import { buildFaceCells, getTriangleCentroid } from '@/scene/biomeObjects/faceCellSystem'

const WALK_PATH_THETA_WIDTH = 0.4

const BIOME_COUNT = 60

export type BiomeType = 'ocean' | 'land' | 'mountain' | 'desert' | 'deepForest' | 'snow'

export interface BiomeSeed {
  theta: number
  phi: number
  type: BiomeType
}

const POLAR_SNOW_SEED_COUNT = 4
const POLAR_PHI_INNER = 1.2
const POLAR_PHI_OUTER = 1.5

export function generateBiomeSeeds(): BiomeSeed[] {
  const seeds: BiomeSeed[] = []

  for (let i = 0; i < BIOME_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2 - Math.PI
    const phi = Math.asin(Math.random() * 2 - 1)

    const isOnWalkPath = Math.abs(theta) < WALK_PATH_THETA_WIDTH || Math.abs(theta) > (Math.PI - WALK_PATH_THETA_WIDTH)

    let type: BiomeType
    if (isOnWalkPath) {
      const roll = Math.random()
      if (roll < 0.35) type = 'land'
      else if (roll < 0.55) type = 'desert'
      else if (roll < 0.75) type = 'deepForest'
      else type = 'mountain'
    } else {
      const roll = Math.random()
      if (roll < 0.35) type = 'ocean'
      else if (roll < 0.55) type = 'land'
      else if (roll < 0.70) type = 'desert'
      else if (roll < 0.85) type = 'deepForest'
      else type = 'mountain'
    }

    seeds.push({ theta, phi, type })
  }

  for (let i = 0; i < POLAR_SNOW_SEED_COUNT; i++) {
    const theta = -Math.PI + (i / POLAR_SNOW_SEED_COUNT) * Math.PI * 2
    const phi = POLAR_PHI_INNER + Math.random() * (POLAR_PHI_OUTER - POLAR_PHI_INNER)
    seeds.push({ theta, phi, type: 'snow' })
  }

  for (let i = 0; i < POLAR_SNOW_SEED_COUNT; i++) {
    const theta = -Math.PI + (i / POLAR_SNOW_SEED_COUNT) * Math.PI * 2
    const phi = -(POLAR_PHI_INNER + Math.random() * (POLAR_PHI_OUTER - POLAR_PHI_INNER))
    seeds.push({ theta, phi, type: 'snow' })
  }

  return seeds
}

// 使用大圓距離（而非歐氏距離）讓 Voronoi 分區在球面上均勻分布
function sphericalDistance(theta1: number, phi1: number, theta2: number, phi2: number): number {
  const dTheta = theta1 - theta2
  const cosPhi1 = Math.cos(phi1)
  const cosPhi2 = Math.cos(phi2)
  const sinPhi1 = Math.sin(phi1)
  const sinPhi2 = Math.sin(phi2)
  return Math.acos(
    Math.min(1, Math.max(-1, sinPhi1 * sinPhi2 + cosPhi1 * cosPhi2 * Math.cos(dTheta)))
  )
}

const BIOME_COLOR_MAP: Record<BiomeType, THREE.Color[]> = {
  ocean: oceanColors,
  land: landColors,
  mountain: mountainColors,
  desert: desertColors,
  deepForest: deepForestColors,
  snow: snowColors,
}

export function classifyBiome(theta: number, phi: number, biomeSeeds: BiomeSeed[]): BiomeType {
  let minDist = Infinity
  let nearestType: BiomeType = 'ocean'

  for (const seed of biomeSeeds) {
    const dist = sphericalDistance(theta, phi, seed.theta, seed.phi)
    if (dist < minDist) {
      minDist = dist
      nearestType = seed.type
    }
  }

  return nearestType
}


export function createEarth(
  scene: THREE.Scene,
  outlineObjects: THREE.Object3D[],
): { earth: THREE.Mesh; faceCells: FaceCellData[] } {
  const biomeSeeds = generateBiomeSeeds()

  let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS, 5)
  if (geometry.index) geometry = geometry.toNonIndexed()

  const positionAttr = geometry.getAttribute('position')
  const colors = new Float32Array(positionAttr.count * 3)

  for (let i = 0; i < positionAttr.count; i += 3) {
    const [cx, cy, cz] = getTriangleCentroid(positionAttr, i)

    const len = Math.sqrt(cx * cx + cy * cy + cz * cz)
    if (len < 1e-10) continue
    const theta = Math.atan2(cz, cx)
    const phi = Math.asin(Math.max(-1, Math.min(1, cy / len)))

    const color = pickRandom(BIOME_COLOR_MAP[classifyBiome(theta, phi, biomeSeeds)])

    for (let j = 0; j < 3; j++) {
      colors[(i + j) * 3] = color.r
      colors[(i + j) * 3 + 1] = color.g
      colors[(i + j) * 3 + 2] = color.b
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  })

  const earth = new THREE.Mesh(geometry, material)
  earth.position.set(0, EARTH_Y, 0)
  scene.add(earth)
  outlineObjects.push(earth)

  const faceCells = buildFaceCells(geometry, biomeSeeds)

  const atmosphereGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS + 0.2, 5)
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: '#4488aa',
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  atmosphere.position.set(0, EARTH_Y, 0)
  scene.add(atmosphere)

  return { earth, faceCells }
}
