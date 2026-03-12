import * as THREE from 'three'
import { CAMERA_HALF_FOV_TAN, CAMERA_Z, MOON_X, MOON_Y, MOON_Z, SCENE_ASPECT } from '@/constants/scene'
import { pickRandom } from '@/utils/random'

export interface StarParticle {
  mesh: THREE.Mesh
  life: number
  maxLife: number
  baseScale: number
}

function createStarShape(points: number, outerR: number, innerR: number): THREE.Shape {
  const shape = new THREE.Shape()
  const total = points * 2
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function createStarMesh(geometries: THREE.BufferGeometry[], starColors: THREE.Color[]): THREE.Mesh {
  const geo = pickRandom(geometries)
  let starGeo: THREE.BufferGeometry = geo.clone()
  if (starGeo.index) starGeo = starGeo.toNonIndexed()

  const posAttr = starGeo.getAttribute('position')
  const vertColors = new Float32Array(posAttr.count * 3)
  const baseColor = pickRandom(starColors)
  for (let v = 0; v < posAttr.count; v++) {
    vertColors[v * 3] = baseColor.r + (Math.random() - 0.5) * 0.1
    vertColors[v * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.1
    vertColors[v * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.1
  }
  starGeo.setAttribute('color', new THREE.BufferAttribute(vertColors, 3))

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
  })

  return new THREE.Mesh(starGeo, mat)
}

const COLS = 3
const ROWS = 2
// 星星生成 Y 軸下界係數：0.0 = 畫面上半 50%，0.4 = 上方 30%，當前 0.2 = 上方 40%
const STAR_Y_BOTTOM_FACTOR = 0.2

function normalizeStarY(worldY: number, halfHeight: number): number {
  return Math.min(Math.max((worldY - halfHeight * STAR_Y_BOTTOM_FACTOR) / (halfHeight * (1 - STAR_Y_BOTTOM_FACTOR)), 0), 0.999)
}

const MOON_DISTANCE_FROM_CAMERA = CAMERA_Z - MOON_Z
const MOON_HALF_HEIGHT = CAMERA_HALF_FOV_TAN * MOON_DISTANCE_FROM_CAMERA
const MOON_HALF_WIDTH = MOON_HALF_HEIGHT * SCENE_ASPECT
const MOON_NORMALIZED_X = Math.min(Math.max((MOON_X + MOON_HALF_WIDTH) / (2 * MOON_HALF_WIDTH), 0), 0.999)
const MOON_NORMALIZED_Y = normalizeStarY(MOON_Y, MOON_HALF_HEIGHT)
const MOON_CELL = Math.floor(MOON_NORMALIZED_Y * ROWS) * COLS + Math.floor(MOON_NORMALIZED_X * COLS)

function buildStarGridDensity(
  excludeParticle: StarParticle,
  allParticles: StarParticle[],
  gridCols: number,
  gridRows: number,
): number[] {
  const grid = new Array(gridCols * gridRows).fill(0)
  for (const particle of allParticles) {
    if (particle.life <= 0 || particle === excludeParticle) continue
    const worldZ = particle.mesh.position.z
    const worldY = particle.mesh.position.y
    const worldX = particle.mesh.position.x
    const distanceFromCamera = CAMERA_Z - worldZ
    const halfHeight = CAMERA_HALF_FOV_TAN * distanceFromCamera
    const halfWidth = halfHeight * SCENE_ASPECT
    const normalizedX = Math.min(Math.max((worldX + halfWidth) / (2 * halfWidth), 0), 0.999)
    const normalizedY = normalizeStarY(worldY, halfHeight)
    const col = Math.floor(normalizedX * gridCols)
    const row = Math.floor(normalizedY * gridRows)
    grid[row * gridCols + col]++
  }
  return grid
}

function findSparsestGridCell(grid: number[], moonCell: number): number {
  const minCount = Math.min(...grid.filter((_, i) => i !== moonCell))
  const candidates: number[] = []
  for (let i = 0; i < grid.length; i++) {
    if (i !== moonCell && grid[i] === minCount) candidates.push(i)
  }
  if (candidates.length === 0) return 0
  return candidates[Math.floor(Math.random() * candidates.length)] as number
}

function calculateWorldPositionFromCell(
  cellIndex: number,
  gridCols: number,
  gridRows: number,
): { x: number; y: number; z: number } {
  const chosenCol = cellIndex % gridCols
  const chosenRow = Math.floor(cellIndex / gridCols)

  const z = -2 - Math.random() * 8
  const distanceFromCamera = CAMERA_Z - z
  const halfHeight = CAMERA_HALF_FOV_TAN * distanceFromCamera
  const halfWidth = halfHeight * SCENE_ASPECT
  const yMax = halfHeight
  const yMin = halfHeight * STAR_Y_BOTTOM_FACTOR

  const nxMin = chosenCol / gridCols
  const nxMax = (chosenCol + 1) / gridCols
  const nyMin = chosenRow / gridRows
  const nyMax = (chosenRow + 1) / gridRows

  const normalizedX = nxMin + Math.random() * (nxMax - nxMin)
  const normalizedY = nyMin + Math.random() * (nyMax - nyMin)

  const x = normalizedX * 2 * halfWidth - halfWidth
  const y = yMin + normalizedY * (yMax - yMin)

  return { x, y, z }
}

export function applyStarAppearance(particle: StarParticle): void {
  const particleScale = particle.baseScale
  particle.mesh.scale.set(particleScale, particleScale, particleScale)

  const mat = particle.mesh.material
  if (!(mat instanceof THREE.MeshBasicMaterial)) return

  if (particle.life > 0.8) {
    const t = (1.0 - particle.life) / 0.2
    mat.opacity = 0.9 * t
  } else if (particle.life > 0.3) {
    mat.opacity = 0.9
  } else {
    const t = particle.life / 0.3
    mat.opacity = 0.9 * t
  }
}

export function spawnStar(particle: StarParticle, allParticles: StarParticle[]): void {
  const grid = buildStarGridDensity(particle, allParticles, COLS, ROWS)

  const chosenCell = findSparsestGridCell(grid, MOON_CELL)
  const { x, y, z } = calculateWorldPositionFromCell(chosenCell, COLS, ROWS)

  particle.mesh.position.set(x, y, z)
  particle.mesh.rotation.set(0, 0, Math.random() * Math.PI * 2)
  particle.life = 1.0
  particle.maxLife = 15 + Math.random() * 15
  // 根據深度補償大小，越遠的星星 baseScale 越大，確保螢幕上視覺大小一致
  const distanceFromCamera = CAMERA_Z - z
  const depthScale = distanceFromCamera / 12
  particle.baseScale = (0.03 + Math.random() * 0.05) * depthScale
  particle.mesh.visible = true
  if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
    particle.mesh.material.opacity = 0
    // 30% 機率是亮星，用 color 放大亮度讓 bloom pass 偵測
    particle.mesh.material.color.setScalar(Math.random() < 0.3 ? 2.5 : 1.0)
  }
}

export function createStars(scene: THREE.Scene, outlineObjects: THREE.Object3D[]): StarParticle[] {
  const starColors = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#e8e8ff'),
    new THREE.Color('#ffe8cc'),
    new THREE.Color('#cce8ff'),
  ]

  const fiveStarGeo = new THREE.ShapeGeometry(createStarShape(5, 1, 0.4))
  const sixStarGeo = new THREE.ShapeGeometry(createStarShape(6, 1, 0.5))
  const circleGeo = new THREE.CircleGeometry(0.8, 16)
  const geometries = [fiveStarGeo, fiveStarGeo, sixStarGeo, sixStarGeo, circleGeo]

  const starGroup = new THREE.Group()
  starGroup.name = 'geometryStars'

  const starParticles: StarParticle[] = []

  for (let i = 0; i < 35; i++) {
    const mesh = createStarMesh(geometries, starColors)
    mesh.visible = false
    starGroup.add(mesh)

    starParticles.push({
      mesh,
      life: 0,
      maxLife: 15 + Math.random() * 15,
      baseScale: 0.03 + Math.random() * 0.05,
    })
  }

  // Prewarm：預先生成星星並分散在不同生命階段，避免開場時天空空白
  for (let i = 0; i < 18; i++) {
    const particle = starParticles[i]!
    spawnStar(particle, starParticles)
    particle.life = 0.1 + Math.random() * 0.7
    applyStarAppearance(particle)
  }

  scene.add(starGroup)
  outlineObjects.push(starGroup)

  return starParticles
}
