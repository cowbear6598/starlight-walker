import * as THREE from 'three'
import { EARTH_RADIUS } from '@/constants/scene'

export function sphericalToCartesian(theta: number, phi: number): THREE.Vector3 {
  const cosPhi = Math.cos(phi)
  return new THREE.Vector3(
    EARTH_RADIUS * cosPhi * Math.cos(theta),
    EARTH_RADIUS * Math.sin(phi),
    EARTH_RADIUS * cosPhi * Math.sin(theta),
  )
}

export function createToonMaterial(
  color: string,
  gradientMap: THREE.DataTexture,
): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap })
}

export function createLimbPivot(
  position: [number, number, number],
  meshSize: [number, number, number],
  meshOffsetY: number,
  material: THREE.MeshToonMaterial,
): { pivot: THREE.Group; mesh: THREE.Mesh } {
  const pivot = new THREE.Group()
  pivot.position.set(...position)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...meshSize), material)
  mesh.position.y = meshOffsetY
  pivot.add(mesh)
  return { pivot, mesh }
}
