import * as THREE from 'three'
import type { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import type { BiomeType } from '@/scene/createEarth'
import type { FaceCellData } from '@/scene/biomeObjects/faceCellSystem'
import { getVisibleFaces, FACE_RANDOM_OFFSET } from '@/scene/biomeObjects/faceCellSystem'
import { ObjectPool } from '@/scene/biomeObjects/objectPool'
import { EARTH_RADIUS } from '@/constants/scene'
import { SURFACE_OFFSET } from '@/scene/shared'

export interface FishAnimationData {
  seed: number
  originalPosition: THREE.Vector3
  initialAngle: number
}

interface CellData {
  meshes: THREE.Mesh[]
  biomeType: BiomeType
}

const MAX_SPAWNS_PER_FRAME = 2
const OCEAN_FLOAT_OFFSET = 0.05
const SPAWN_EDGE_CHANCE = 1.0
const SPAWN_CENTER_CHANCE = 0.33
const FISH_BOB_FREQUENCY = 0.6
const FISH_BOB_SEED_MULTIPLIER = 10
const FISH_BOB_AMPLITUDE = 0.06
const FISH_SWAY_FREQUENCY = 0.8
const FISH_SWAY_SEED_MULTIPLIER = 8
const FISH_SWAY_AMPLITUDE = 0.3

const _orientOffsetPos = new THREE.Vector3()
const _orientQuat = new THREE.Quaternion()
const _orientAxisQuat = new THREE.Quaternion()
const _orientUp = new THREE.Vector3(0, 1, 0)
const _orientNormalClone = new THREE.Vector3()

function orientToSurface(
  object: THREE.Object3D,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  offset: number,
): void {
  _orientNormalClone.copy(normal).multiplyScalar(offset)
  _orientOffsetPos.copy(position).add(_orientNormalClone)
  object.position.copy(_orientOffsetPos)

  _orientQuat.setFromUnitVectors(_orientUp, normal)
  object.quaternion.copy(_orientQuat)

  const randomAngle = Math.random() * Math.PI * 2
  _orientAxisQuat.setFromAxisAngle(normal, randomAngle)
  object.quaternion.premultiply(_orientAxisQuat)
}

export class DynamicBiomeManager {
  private earth: THREE.Mesh
  private faceCells: FaceCellData[]
  private outlineObjects: THREE.Object3D[]
  private outlinePass: OutlinePass
  private activeCells: Map<number, CellData> = new Map()
  private objectPool: ObjectPool
  private activeFish: Map<THREE.Mesh, FishAnimationData> = new Map()
  private isFirstUpdate: boolean = true
  private readonly _visibleSet = new Set<number>()

  private readonly _fishNormalVec = new THREE.Vector3()
  private readonly _fishPosTmpVec = new THREE.Vector3()
  private readonly _fishUpVec = new THREE.Vector3(0, 1, 0)
  private readonly _fishBaseQuat = new THREE.Quaternion()
  private readonly _fishSwayQuat = new THREE.Quaternion()

  constructor(
    earth: THREE.Mesh,
    faceCells: FaceCellData[],
    outlineObjects: THREE.Object3D[],
    outlinePass: OutlinePass,
  ) {
    this.earth = earth
    this.faceCells = faceCells
    this.outlineObjects = outlineObjects
    this.outlinePass = outlinePass
    this.objectPool = new ObjectPool()
  }

  update(earthRotationZ: number): void {
    const visibleFaces = getVisibleFaces(this.faceCells, earthRotationZ)
    this._visibleSet.clear()
    for (const f of visibleFaces) this._visibleSet.add(f)

    for (const [faceIndex] of this.activeCells) {
      if (!this._visibleSet.has(faceIndex)) {
        this.despawnCell(faceIndex)
      }
    }

    const isFirst = this.isFirstUpdate

    if (isFirst) {
      this.isFirstUpdate = false
    }

    let spawned = 0
    for (const faceIndex of visibleFaces) {
      if (this.activeCells.has(faceIndex)) continue
      if (!isFirst && spawned >= MAX_SPAWNS_PER_FRAME) break

      const faceCell = this.faceCells[faceIndex]
      if (!faceCell) continue

      if (!faceCell.spawnAllowed) {
        this.activeCells.set(faceIndex, { meshes: [], biomeType: faceCell.biomeType })
        continue
      }

      const t = Math.max(0, faceCell.normal.z)
      const spawnChance = SPAWN_EDGE_CHANCE - t * (SPAWN_EDGE_CHANCE - SPAWN_CENTER_CHANCE)

      if (Math.random() >= spawnChance) {
        this.activeCells.set(faceIndex, { meshes: [], biomeType: faceCell.biomeType })
        continue
      }

      this.spawnCell(faceIndex)
      spawned++
    }
  }

  private spawnCell(faceIndex: number): void {
    const faceCell = this.faceCells[faceIndex]
    if (!faceCell) return

    const { center, normal, biomeType } = faceCell

    // 在法線的切平面上產生隨機偏移，投影回球面
    const up = new THREE.Vector3(0, 1, 0)
    const tangent = Math.abs(normal.dot(up)) < 0.99
      ? new THREE.Vector3().crossVectors(normal, up).normalize()
      : new THREE.Vector3().crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize()
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize()

    const randomA = (Math.random() * 2 - 1) * FACE_RANDOM_OFFSET
    const randomB = (Math.random() * 2 - 1) * FACE_RANDOM_OFFSET
    const offsetPoint = center.clone()
      .addScaledVector(tangent, randomA)
      .addScaledVector(bitangent, randomB)
    const position = offsetPoint.normalize().multiplyScalar(EARTH_RADIUS)

    const mesh = this.objectPool.acquire(biomeType)
    orientToSurface(mesh, position, normal, SURFACE_OFFSET)

    const isOcean = biomeType === 'ocean'
    if (isOcean) {
      _orientNormalClone.copy(normal).multiplyScalar(OCEAN_FLOAT_OFFSET)
      mesh.position.add(_orientNormalClone)
      this.activeFish.set(mesh, {
        seed: Math.random(),
        originalPosition: mesh.position.clone(),
        initialAngle: Math.random() * Math.PI * 2,
      })
    }

    this.earth.add(mesh)
    this.outlineObjects.push(mesh)

    this.activeCells.set(faceIndex, { meshes: [mesh], biomeType })
    this.outlinePass.selectedObjects = this.outlineObjects
  }

  private despawnCell(faceIndex: number): void {
    const cellData = this.activeCells.get(faceIndex)
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

    this.activeCells.delete(faceIndex)
    this.outlinePass.selectedObjects = this.outlineObjects
  }

  animateFish(currentTimeSeconds: number): void {
    for (const [fish, data] of this.activeFish) {
      const { seed, originalPosition, initialAngle } = data

      this._fishNormalVec.copy(originalPosition).normalize()
      const bobAmount = Math.sin(currentTimeSeconds * FISH_BOB_FREQUENCY + seed * FISH_BOB_SEED_MULTIPLIER) * FISH_BOB_AMPLITUDE
      this._fishPosTmpVec.copy(this._fishNormalVec).multiplyScalar(bobAmount)
      fish.position.copy(originalPosition).add(this._fishPosTmpVec)

      const swayAngle = initialAngle + Math.sin(currentTimeSeconds * FISH_SWAY_FREQUENCY + seed * FISH_SWAY_SEED_MULTIPLIER) * FISH_SWAY_AMPLITUDE

      this._fishBaseQuat.setFromUnitVectors(this._fishUpVec, this._fishNormalVec)
      this._fishSwayQuat.setFromAxisAngle(this._fishNormalVec, swayAngle)
      fish.quaternion.copy(this._fishSwayQuat.multiply(this._fishBaseQuat))
    }
  }

  dispose(): void {
    for (const [faceIndex] of this.activeCells) {
      this.despawnCell(faceIndex)
    }
    this.objectPool.dispose()
  }
}
