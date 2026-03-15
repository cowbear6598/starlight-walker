import * as THREE from 'three'
import { EARTH_RADIUS } from '@/constants/scene'

export const SURFACE_OFFSET = 0.01

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

export function repositionOnSurface(group: THREE.Group, theta: number, phi: number): void {
  const position = sphericalToCartesian(theta, phi)
  const normal = position.clone().normalize()
  const offsetPosition = position.clone().add(normal.clone().multiplyScalar(SURFACE_OFFSET))
  group.position.copy(offsetPosition)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
  group.quaternion.copy(quaternion)
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
