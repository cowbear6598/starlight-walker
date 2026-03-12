export const SCENE_ASPECT = 9 / 20

export const EARTH_RADIUS = 4
export const EARTH_Y = -5.8
export const MOON_X = 2
export const MOON_Y = 6.0
export const MOON_Z = -3

export const CAMERA_Z = 10

// 相機 FOV 60° 的半角正切值，用於視錐體計算（spawnStar 的 grid 分布和 onResize）
export const CAMERA_HALF_FOV_TAN = Math.tan((60 / 2) * (Math.PI / 180))
