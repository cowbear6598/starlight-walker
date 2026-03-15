export const SCENE_ASPECT = 9 / 20

export const EARTH_RADIUS = 4
export const EARTH_Y = -5.8
export const MOON_X = 2
export const MOON_Z = -3
export const MOON_Y_BASE = 5.0
export const MOON_ARC_HEIGHT = 1.0

export const CAMERA_Z = 10

// 相機 FOV 60° 的半角正切值，用於視錐體計算（spawnStar 的 grid 分布和 onResize）
export const CAMERA_HALF_FOV_TAN = Math.tan((60 / 2) * (Math.PI / 180))

export const STAR_PARALLAX_FACTOR = 0.9
export const STAR_PARALLAX_DEPTH_BASE = 12
export const MOON_PARALLAX_FACTOR = 1.0

export const MOON_DEPTH = Math.max(CAMERA_Z - MOON_Z, 0.001)
export const MOON_DEPTH_MULTIPLIER = STAR_PARALLAX_DEPTH_BASE / MOON_DEPTH
export const MOON_HALF_HEIGHT = CAMERA_HALF_FOV_TAN * MOON_DEPTH
export const MOON_HALF_WIDTH = MOON_HALF_HEIGHT * SCENE_ASPECT

const MOON_GEO_SIZE = 2.0
const MOON_MAX_SCALE = 1.05
export const MOON_VISUAL_RADIUS = (MOON_GEO_SIZE / 2) * MOON_MAX_SCALE

export const CAT_A_OFFSET = { x: 0.35, y: -0.05, z: -0.2 }
export const CAT_B_OFFSET = { x: 0.65, y: -0.08, z: 0.1 }

export const NPC_SPAWN_INTERVAL_MIN = 30
export const NPC_SPAWN_INTERVAL_MAX = 45
export const NPC_SPAWN_FIRST_DELAY_MIN = 0
export const NPC_SPAWN_FIRST_DELAY_MAX = 0
export const NPC_MAX_ALIVE = 3
