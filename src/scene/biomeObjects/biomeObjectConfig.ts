import * as THREE from 'three'
import type { BiomeType } from '@/scene/createEarth'
import {
  createCactusGeometry,
  createDeadTreeGeometry,
  createFishGeometry,
  createGrassGeometry,
  createMushroomGeometry,
  createPineTreeGeometry,
  createSharpRockGeometry,
  createSmallHillGeometry,
  createSmallRockGeometry,
  createSnowmanGeometry,
  createSnowPileGeometry,
  createSnowPineGeometry,
} from '@/scene/biomeObjects/geometryFactories'

export interface BiomeObjectEntry {
  createGeometry: () => THREE.BufferGeometry
  color: string
  scale: { min: number; max: number }
  weight: number
}

export type BiomeObjectConfig = Record<BiomeType, BiomeObjectEntry[]>

export const biomeObjectConfig: BiomeObjectConfig = {
  ocean: [
    { createGeometry: createFishGeometry, color: '#4a8ab5', scale: { min: 0.6, max: 1.0 }, weight: 1 },
  ],
  land: [
    { createGeometry: createGrassGeometry, color: '#2a5a40', scale: { min: 0.8, max: 1.2 }, weight: 3 },
    { createGeometry: createSmallRockGeometry, color: '#5a5a5a', scale: { min: 0.7, max: 1.3 }, weight: 2 },
  ],
  desert: [
    { createGeometry: createCactusGeometry, color: '#3a6a3a', scale: { min: 0.8, max: 1.2 }, weight: 3 },
    { createGeometry: createDeadTreeGeometry, color: '#5a4a3a', scale: { min: 0.7, max: 1.1 }, weight: 2 },
  ],
  deepForest: [
    { createGeometry: createPineTreeGeometry, color: '#1a4a2a', scale: { min: 0.8, max: 1.3 }, weight: 3 },
    { createGeometry: createMushroomGeometry, color: '#8a4a3a', scale: { min: 0.7, max: 1.2 }, weight: 2 },
  ],
  mountain: [
    { createGeometry: createSharpRockGeometry, color: '#4a4a50', scale: { min: 0.8, max: 1.4 }, weight: 3 },
    { createGeometry: createSmallHillGeometry, color: '#3a4a48', scale: { min: 0.8, max: 1.2 }, weight: 2 },
  ],
  snow: [
    { createGeometry: createSnowPineGeometry, color: '#5a4a3a', scale: { min: 0.8, max: 1.2 }, weight: 3 },
    { createGeometry: createSnowmanGeometry, color: '#e8e8f0', scale: { min: 0.7, max: 1.1 }, weight: 2 },
    { createGeometry: createSnowPileGeometry, color: '#d8d8e8', scale: { min: 0.8, max: 1.3 }, weight: 2 },
  ],
}
