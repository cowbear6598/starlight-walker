import * as THREE from 'three'

const TERRAIN_COLOR_HEX = {
  ocean: ['#1a3a5c', '#1e4266', '#163858', '#1b4060', '#1a3d5e'],
  land: ['#2a5a50', '#2e6258', '#336860', '#255648', '#2c5e52'],
  mountain: ['#3a4a50', '#344452', '#3e4e54'],
  desert: ['#4a5558', '#505a5c', '#465254', '#4c5658'],
  snow: ['#6a7a8a', '#607080', '#6e7e8e'],
  deepForest: ['#1e4038', '#1a3a32', '#22443c'],
} as const

function hexArrayToColors(hexValues: readonly string[]): THREE.Color[] {
  return hexValues.map(hex => new THREE.Color(hex))
}

export const oceanColors = hexArrayToColors(TERRAIN_COLOR_HEX.ocean)
export const landColors = hexArrayToColors(TERRAIN_COLOR_HEX.land)
export const mountainColors = hexArrayToColors(TERRAIN_COLOR_HEX.mountain)
export const desertColors = hexArrayToColors(TERRAIN_COLOR_HEX.desert)
export const snowColors = hexArrayToColors(TERRAIN_COLOR_HEX.snow)
export const deepForestColors = hexArrayToColors(TERRAIN_COLOR_HEX.deepForest)
