import * as THREE from 'three'

export function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([80, 160, 255])
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

let _sharedGradientMap: THREE.DataTexture | null = null

export function getSharedToonGradientMap(): THREE.DataTexture {
  if (!_sharedGradientMap) {
    _sharedGradientMap = createToonGradientMap()
  }
  return _sharedGradientMap
}

export function disposeSharedToonGradientMap(): void {
  if (_sharedGradientMap) {
    _sharedGradientMap.dispose()
    _sharedGradientMap = null
  }
}
