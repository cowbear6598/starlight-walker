export const GRID_THETA_STEP = 0.3
export const GRID_PHI_STEP = 0.3

const THETA_MIN = -Math.PI
const THETA_MAX = Math.PI
const PHI_MIN = -Math.PI / 2
const PHI_MAX = Math.PI / 2

// PI/2.5 約 72 度，涵蓋角色前方和兩側的可見區域
const VISIBLE_ANGULAR_RADIUS = Math.PI / 2.5

// 略微允許一點背面，提供緩衝
const MIN_Z_VISIBILITY = 0.0

const THETA_COUNT = Math.ceil((THETA_MAX - THETA_MIN) / GRID_THETA_STEP)
const PHI_COUNT = Math.ceil((PHI_MAX - PHI_MIN) / GRID_PHI_STEP)

export type GridCellKey = string

export function cellKeyFromIndices(thetaIdx: number, phiIdx: number): GridCellKey {
  return `${thetaIdx}_${phiIdx}`
}

export function parseCellKey(cellKey: GridCellKey): { thetaIdx: number; phiIdx: number } {
  const separatorIndex = cellKey.indexOf('_')
  const thetaIdx = parseInt(cellKey.slice(0, separatorIndex), 10)
  const phiIdx = parseInt(cellKey.slice(separatorIndex + 1), 10)
  if (Number.isNaN(thetaIdx) || Number.isNaN(phiIdx)) {
    throw new Error(`Invalid GridCellKey: "${cellKey}"`)
  }
  return { thetaIdx, phiIdx }
}

export function getCellCenter(thetaIdx: number, phiIdx: number): { theta: number; phi: number } {
  const theta = THETA_MIN + (thetaIdx + 0.5) * GRID_THETA_STEP
  const phi = PHI_MIN + (phiIdx + 0.5) * GRID_PHI_STEP
  return { theta, phi }
}

export function getVisibleCells(earthRotationZ: number): Set<GridCellKey> {
  const visibleCells = new Set<GridCellKey>()

  // 角色在地球 local 座標系中的方向（單位向量）
  // 角色固定在世界座標 (0, EARTH_Y + R, 0)，earth.rotation.z 旋轉後，
  // 角色在地球 local 座標系的位置為 (R*sin(α), R*cos(α), 0)，其中 α = earthRotationZ
  const charDirX = Math.sin(earthRotationZ)
  const charDirY = Math.cos(earthRotationZ)
  const charDirZ = 0

  for (let thetaIdx = 0; thetaIdx < THETA_COUNT; thetaIdx++) {
    for (let phiIdx = 0; phiIdx < PHI_COUNT; phiIdx++) {
      const { theta, phi } = getCellCenter(thetaIdx, phiIdx)

      const cosPhi = Math.cos(phi)
      const cellDirX = cosPhi * Math.cos(theta)
      const cellDirY = Math.sin(phi)
      const cellDirZ = cosPhi * Math.sin(theta)

      if (cellDirZ < MIN_Z_VISIBILITY) continue

      const dot = charDirX * cellDirX + charDirY * cellDirY + charDirZ * cellDirZ
      if (dot < Math.cos(VISIBLE_ANGULAR_RADIUS)) continue

      visibleCells.add(cellKeyFromIndices(thetaIdx, phiIdx))
    }
  }

  return visibleCells
}
