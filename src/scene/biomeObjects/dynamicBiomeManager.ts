import * as THREE from 'three'
import type { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import type { BiomeSeed } from '@/scene/createEarth'
import { classifyBiomeWithSafety } from '@/scene/createEarth'
import { EARTH_RADIUS } from '@/constants/scene'
import {
  cellKeyFromIndices,
  getCellCenter,
  getVisibleCells,
  parseCellKey,
  GRID_PHI_STEP,
  GRID_THETA_STEP,
} from '@/scene/biomeObjects/gridSystem'
import type { GridCellKey } from '@/scene/biomeObjects/gridSystem'
import { ObjectPool } from '@/scene/biomeObjects/objectPool'
import type { BiomeType } from '@/scene/createEarth'

export interface FishAnimationData {
  seed: number
  originalPosition: THREE.Vector3
}

interface CellData {
  meshes: THREE.Mesh[]
  biomeType: BiomeType
}

const BIOME_BOUNDARY_MARGIN = 0.1
const OBJECTS_PER_CELL = { min: 1, max: 2 }
const OCEAN_OBJECTS_PER_CELL = { min: 1, max: 1 }
const SURFACE_OFFSET = 0.01
const OCEAN_FLOAT_OFFSET = 0.05

function sphericalToCartesian(theta: number, phi: number): THREE.Vector3 {
  const cosPhi = Math.cos(phi)
  return new THREE.Vector3(
    EARTH_RADIUS * cosPhi * Math.cos(theta),
    EARTH_RADIUS * Math.sin(phi),
    EARTH_RADIUS * cosPhi * Math.sin(theta),
  )
}

function orientToSurface(
  object: THREE.Object3D,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  offset: number,
): void {
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

export class DynamicBiomeManager {
  private earth: THREE.Mesh
  private biomeSeeds: BiomeSeed[]
  private outlineObjects: THREE.Object3D[]
  private outlinePass: OutlinePass
  private activeCells: Map<GridCellKey, CellData> = new Map()
  private objectPool: ObjectPool
  private activeFish: Map<THREE.Mesh, FishAnimationData> = new Map()

  private readonly _fishNormalVec = new THREE.Vector3()
  private readonly _fishPosTmpVec = new THREE.Vector3()
  private readonly _fishUpVec = new THREE.Vector3(0, 1, 0)
  private readonly _fishBaseQuat = new THREE.Quaternion()
  private readonly _fishSwayQuat = new THREE.Quaternion()

  constructor(
    earth: THREE.Mesh,
    biomeSeeds: BiomeSeed[],
    outlineObjects: THREE.Object3D[],
    outlinePass: OutlinePass,
  ) {
    this.earth = earth
    this.biomeSeeds = biomeSeeds
    this.outlineObjects = outlineObjects
    this.outlinePass = outlinePass
    this.objectPool = new ObjectPool()
  }

  update(earthRotationZ: number): void {
    const visibleCells = getVisibleCells(earthRotationZ)

    for (const [cellKey] of this.activeCells) {
      if (!visibleCells.has(cellKey)) {
        this.despawnCell(cellKey)
      }
    }

    for (const cellKey of visibleCells) {
      if (!this.activeCells.has(cellKey)) {
        const { thetaIdx, phiIdx } = parseCellKey(cellKey)
        this.spawnCell(cellKey, thetaIdx, phiIdx)
      }
    }

    this.outlinePass.selectedObjects = this.outlineObjects
  }

  private spawnCell(cellKey: GridCellKey, thetaIdx: number, phiIdx: number): void {
    const center = getCellCenter(thetaIdx, phiIdx)
    const cellResult = classifyBiomeWithSafety(center.theta, center.phi, this.biomeSeeds, BIOME_BOUNDARY_MARGIN)
    if (!cellResult.safe) return
    const cellBiomeType = cellResult.type

    const isOcean = cellBiomeType === 'ocean'
    const countRange = isOcean ? OCEAN_OBJECTS_PER_CELL : OBJECTS_PER_CELL
    const count = countRange.min + Math.floor(Math.random() * (countRange.max - countRange.min + 1))

    const meshes: THREE.Mesh[] = []

    for (let i = 0; i < count; i++) {
      const theta = center.theta + (Math.random() - 0.5) * GRID_THETA_STEP
      const phi = center.phi + (Math.random() - 0.5) * GRID_PHI_STEP

      const pointResult = classifyBiomeWithSafety(theta, phi, this.biomeSeeds, BIOME_BOUNDARY_MARGIN)
      if (!pointResult.safe || pointResult.type !== cellBiomeType) continue

      const position = sphericalToCartesian(theta, phi)
      const normal = position.clone().normalize()

      const mesh = this.objectPool.acquire(cellBiomeType)
      orientToSurface(mesh, position, normal, SURFACE_OFFSET)

      if (isOcean) {
        const floatOffset = normal.clone().multiplyScalar(OCEAN_FLOAT_OFFSET)
        mesh.position.add(floatOffset)
        this.activeFish.set(mesh, {
          seed: Math.random(),
          originalPosition: mesh.position.clone(),
        })
      }

      this.earth.add(mesh)
      this.outlineObjects.push(mesh)
      meshes.push(mesh)
    }

    this.activeCells.set(cellKey, { meshes, biomeType: cellBiomeType })
  }

  private despawnCell(cellKey: GridCellKey): void {
    const cellData = this.activeCells.get(cellKey)
    if (!cellData) return

    for (const mesh of cellData.meshes) {
      this.earth.remove(mesh)

      const idx = this.outlineObjects.indexOf(mesh)
      if (idx !== -1) {
        this.outlineObjects.splice(idx, 1)
      }

      this.activeFish.delete(mesh)
      this.objectPool.release(mesh, cellData.biomeType)
    }

    this.activeCells.delete(cellKey)
  }

  animateFish(currentTimeSeconds: number): void {
    for (const [fish, data] of this.activeFish) {
      const { seed, originalPosition } = data

      this._fishNormalVec.copy(originalPosition).normalize()
      const bobAmount = Math.sin(currentTimeSeconds * 0.6 + seed * 10) * 0.06
      this._fishPosTmpVec.copy(this._fishNormalVec).multiplyScalar(bobAmount)
      fish.position.copy(originalPosition).add(this._fishPosTmpVec)

      const swayAngle = Math.sin(currentTimeSeconds * 0.8 + seed * 8) * 0.3

      this._fishBaseQuat.setFromUnitVectors(this._fishUpVec, this._fishNormalVec)
      this._fishSwayQuat.setFromAxisAngle(this._fishNormalVec, swayAngle)
      fish.quaternion.copy(this._fishSwayQuat.multiply(this._fishBaseQuat))
    }
  }

  dispose(): void {
    for (const [cellKey] of this.activeCells) {
      this.despawnCell(cellKey)
    }
    this.objectPool.dispose()
  }
}
