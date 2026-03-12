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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

const POLAR_PHI_THRESHOLD = 1.0
const LAND_THETA_MIN = 0.8
const LAND_THETA_MAX = 2.8
const LAND_PHI_MIN = 0.0
const LAND_PHI_MAX = 1.3
const SOUTH_LAND_THETA_MIN = -2.2
const SOUTH_LAND_THETA_MAX = -0.1
const SOUTH_LAND_PHI_MIN = -1.1
const DESERT_THETA_MIN = -0.8
const DESERT_THETA_MAX = 0.5
const DESERT_PHI_MIN = -0.3
const DESERT_PHI_MAX = 0.3
const DEEP_FOREST_THETA_MIN = 2.5
const DEEP_FOREST_THETA_MAX = 3.14
const DEEP_FOREST_PHI_MIN = -0.5
const DEEP_FOREST_PHI_MAX = 0.2
const ISLAND_THETA_MIN = 0.0
const ISLAND_THETA_MAX = 1.0
const ISLAND_PHI_MIN = -0.8
const ISLAND_PHI_MAX = -0.2

// 依據球面座標 theta（經度）和 phi（緯度）劃分地球表面各地理區域，
// 讓地球呈現多樣地形而非全部海洋
function classifyTerrain(theta: number, phi: number): THREE.Color {
  if (phi > POLAR_PHI_THRESHOLD || phi < -POLAR_PHI_THRESHOLD) {
    return pickRandom(snowColors)
  }

  if (theta > LAND_THETA_MIN && theta < LAND_THETA_MAX && phi > LAND_PHI_MIN && phi < LAND_PHI_MAX) {
    return pickRandom(landColors)
  }

  if (theta > SOUTH_LAND_THETA_MIN && theta < SOUTH_LAND_THETA_MAX && phi < LAND_PHI_MIN && phi > SOUTH_LAND_PHI_MIN) {
    return Math.random() > 0.3 ? pickRandom(landColors) : pickRandom(mountainColors)
  }

  if (theta > DESERT_THETA_MIN && theta < DESERT_THETA_MAX && phi > DESERT_PHI_MIN && phi < DESERT_PHI_MAX) {
    return pickRandom(desertColors)
  }

  if (theta > DEEP_FOREST_THETA_MIN && theta < DEEP_FOREST_THETA_MAX && phi > DEEP_FOREST_PHI_MIN && phi < DEEP_FOREST_PHI_MAX) {
    return Math.random() > 0.4 ? pickRandom(deepForestColors) : pickRandom(oceanColors)
  }

  if (theta > ISLAND_THETA_MIN && theta < ISLAND_THETA_MAX && phi > ISLAND_PHI_MIN && phi < ISLAND_PHI_MAX) {
    return Math.random() > 0.3 ? pickRandom(landColors) : pickRandom(mountainColors)
  }

  return pickRandom(oceanColors)
}

export function createEarth(scene: THREE.Scene, outlineObjects: THREE.Object3D[]): THREE.Mesh {
  let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS, 5)
  if (geometry.index) geometry = geometry.toNonIndexed()

  const positionAttr = geometry.getAttribute('position')
  const colors = new Float32Array(positionAttr.count * 3)

  for (let i = 0; i < positionAttr.count; i += 3) {
    const cx = (positionAttr.getX(i) + positionAttr.getX(i + 1) + positionAttr.getX(i + 2)) / 3
    const cy = (positionAttr.getY(i) + positionAttr.getY(i + 1) + positionAttr.getY(i + 2)) / 3
    const cz = (positionAttr.getZ(i) + positionAttr.getZ(i + 1) + positionAttr.getZ(i + 2)) / 3

    const theta = Math.atan2(cz, cx)
    const phi = Math.asin(cy / Math.sqrt(cx * cx + cy * cy + cz * cz))

    const color = classifyTerrain(theta, phi)

    for (let j = 0; j < 3; j++) {
      colors[(i + j) * 3] = color.r
      colors[(i + j) * 3 + 1] = color.g
      colors[(i + j) * 3 + 2] = color.b
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
  })

  const earth = new THREE.Mesh(geometry, material)
  earth.position.set(0, EARTH_Y, 0)
  scene.add(earth)
  outlineObjects.push(earth)

  let atmosphereGeometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS + 0.2, 5)
  if (atmosphereGeometry.index) atmosphereGeometry = atmosphereGeometry.toNonIndexed()
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: '#4488aa',
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  atmosphere.position.set(0, EARTH_Y, 0)
  scene.add(atmosphere)

  return earth
}
