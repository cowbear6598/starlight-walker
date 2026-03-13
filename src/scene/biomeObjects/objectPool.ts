import * as THREE from 'three'
import type { BiomeType } from '@/scene/createEarth'
import { biomeObjectConfig } from '@/scene/biomeObjects/biomeObjectConfig'
import { getSharedToonGradientMap } from '@/scene/materials'

function selectWeightedEntry<T extends { weight: number }>(entries: T[]): T {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of entries) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }

  return entries[entries.length - 1]!
}

export class ObjectPool {
  private pool: Map<BiomeType, THREE.Mesh[]> = new Map()
  private materialCache: Map<string, THREE.MeshToonMaterial> = new Map()
  private gradientMap: THREE.DataTexture

  constructor() {
    this.gradientMap = getSharedToonGradientMap()
  }

  acquire(biomeType: BiomeType): THREE.Mesh {
    const poolList = this.pool.get(biomeType)
    const entries = biomeObjectConfig[biomeType]
    const entry = selectWeightedEntry(entries)

    const newGeometry = entry.createGeometry()
    const cacheKey = entry.color
    let material = this.materialCache.get(cacheKey)
    if (!material) {
      material = new THREE.MeshToonMaterial({ color: entry.color, gradientMap: this.gradientMap })
      this.materialCache.set(cacheKey, material)
    }

    const scale = entry.scale.min + Math.random() * (entry.scale.max - entry.scale.min)

    if (poolList && poolList.length > 0) {
      const mesh = poolList.pop()!
      mesh.geometry.dispose()
      mesh.geometry = newGeometry
      mesh.material = material
      mesh.scale.setScalar(scale)
      mesh.visible = true
      return mesh
    }

    const mesh = new THREE.Mesh(newGeometry, material)
    mesh.scale.setScalar(scale)
    return mesh
  }

  release(mesh: THREE.Mesh, biomeType: BiomeType): void {
    mesh.visible = false
    const poolList = this.pool.get(biomeType) ?? []
    poolList.push(mesh)
    this.pool.set(biomeType, poolList)
  }

  dispose(): void {
    for (const meshList of this.pool.values()) {
      for (const mesh of meshList) {
        mesh.geometry.dispose()
      }
    }
    this.pool.clear()

    for (const material of this.materialCache.values()) {
      material.dispose()
    }
    this.materialCache.clear()
  }
}
