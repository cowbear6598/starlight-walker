import * as THREE from 'three'
import { EARTH_RADIUS } from '@/constants/scene'
import { POLAR_PHI_THRESHOLD, classifyBiome, sphericalDistance } from '@/scene/createEarth'
import type { BiomeSeed, BiomeType } from '@/scene/createEarth'
import { biomeObjectConfig } from '@/scene/biomeObjects/biomeObjectConfig'
import { getSharedToonGradientMap } from '@/scene/materials'

export interface FishAnimationData {
  seed: number
  originalPosition: THREE.Vector3
}

export const fishAnimationDataMap = new WeakMap<THREE.Mesh, FishAnimationData>()

const OBJECTS_PER_REGION = { min: 3, max: 5 }
const OCEAN_OBJECTS_PER_REGION = { min: 1, max: 3 }
const OCEAN_FLOAT_OFFSET = 0.05
const POLAR_POINT_COUNT = { min: 5, max: 8 }
const THETA_SCATTER = 0.15
const PHI_SCATTER = 0.15
const SURFACE_OFFSET = 0.01

interface SurfacePoint {
  position: THREE.Vector3
  normal: THREE.Vector3
  biomeType: BiomeType
}

function sphericalToCartesian(theta: number, phi: number): THREE.Vector3 {
  const cosPhi = Math.cos(phi)
  return new THREE.Vector3(
    EARTH_RADIUS * cosPhi * Math.cos(theta),
    EARTH_RADIUS * Math.sin(phi),
    EARTH_RADIUS * cosPhi * Math.sin(theta),
  )
}

function randomPointCount(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

const MIN_OBJECT_DISTANCE = 0.25

function generatePolarPoints(
  sign: 1 | -1,
  placedCoords: { theta: number; phi: number }[],
  isTooClose: (theta: number, phi: number) => boolean,
): SurfacePoint[] {
  const points: SurfacePoint[] = []
  const count = randomPointCount(POLAR_POINT_COUNT.min, POLAR_POINT_COUNT.max)
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const theta = Math.random() * Math.PI * 2 - Math.PI
      const phi = sign * (POLAR_PHI_THRESHOLD + Math.random() * (Math.PI / 2 - POLAR_PHI_THRESHOLD))
      if (isTooClose(theta, phi)) continue
      const position = sphericalToCartesian(theta, phi)
      const normal = position.clone().normalize()
      points.push({ position, normal, biomeType: 'snow' })
      placedCoords.push({ theta, phi })
      break
    }
  }
  return points
}

function generateSurfacePoints(biomeSeeds: BiomeSeed[]): SurfacePoint[] {
  const points: SurfacePoint[] = []
  const placedCoords: { theta: number; phi: number }[] = []

  function isTooClose(theta: number, phi: number): boolean {
    for (const placed of placedCoords) {
      if (sphericalDistance(theta, phi, placed.theta, placed.phi) < MIN_OBJECT_DISTANCE) {
        return true
      }
    }
    return false
  }

  for (const seed of biomeSeeds) {
    const isOcean = seed.type === 'ocean'
    const regionCount = isOcean ? OCEAN_OBJECTS_PER_REGION : OBJECTS_PER_REGION
    const count = randomPointCount(regionCount.min, regionCount.max)

    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const theta = seed.theta + (Math.random() - 0.5) * THETA_SCATTER * 2
        const phi = seed.phi + (Math.random() - 0.5) * PHI_SCATTER * 2

        if (isTooClose(theta, phi)) continue

        const biomeType = classifyBiome(theta, phi, biomeSeeds)
        const position = sphericalToCartesian(theta, phi)
        const normal = position.clone().normalize()
        points.push({ position, normal, biomeType })
        placedCoords.push({ theta, phi })
        break
      }
    }
  }

  points.push(...generatePolarPoints(1, placedCoords, isTooClose))
  points.push(...generatePolarPoints(-1, placedCoords, isTooClose))

  return points
}

function orientToSurface(object: THREE.Object3D, position: THREE.Vector3, normal: THREE.Vector3, offset: number): void {
  const offsetPosition = position.clone().add(normal.clone().multiplyScalar(offset))
  object.position.copy(offsetPosition)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
  object.quaternion.copy(quaternion)

  const randomAngle = Math.random() * Math.PI * 2
  const axisRotation = new THREE.Quaternion()
  axisRotation.setFromAxisAngle(normal, randomAngle)
  object.quaternion.premultiply(axisRotation)
}

function selectWeightedEntry<T extends { weight: number }>(entries: T[]): T {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }

  return entries[entries.length - 1]!
}

export function placeBiomeObjects(
  earth: THREE.Mesh,
  biomeSeeds: BiomeSeed[],
  outlineObjects: THREE.Object3D[],
): THREE.Mesh[] {
  const gradientMap = getSharedToonGradientMap()
  const materialCache = new Map<string, THREE.MeshToonMaterial>()
  const surfacePoints = generateSurfacePoints(biomeSeeds)
  const fishMeshes: THREE.Mesh[] = []

  for (const point of surfacePoints) {
    const entries = biomeObjectConfig[point.biomeType]
    const entry = selectWeightedEntry(entries)
    const geometry = entry.createGeometry()

    const cacheKey = entry.color
    let material = materialCache.get(cacheKey)
    if (!material) {
      material = new THREE.MeshToonMaterial({ color: entry.color, gradientMap })
      materialCache.set(cacheKey, material)
    }

    const mesh = new THREE.Mesh(geometry, material)

    const scale = entry.scale.min + Math.random() * (entry.scale.max - entry.scale.min)
    mesh.scale.setScalar(scale)

    const surfaceOffset = point.biomeType === 'snow' ? 0 : SURFACE_OFFSET
    orientToSurface(mesh, point.position, point.normal, surfaceOffset)

    if (point.biomeType === 'ocean') {
      const floatOffset = point.normal.clone().multiplyScalar(OCEAN_FLOAT_OFFSET)
      mesh.position.add(floatOffset)

      fishAnimationDataMap.set(mesh, { seed: Math.random(), originalPosition: mesh.position.clone() })
      fishMeshes.push(mesh)
    }

    earth.add(mesh)
    outlineObjects.push(mesh)
  }

  return fishMeshes
}
