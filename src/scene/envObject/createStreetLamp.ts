import * as THREE from 'three'
import { createToonMaterial } from '@/scene/shared'

export interface StreetLampRefs {
  group: THREE.Group
  meshes: THREE.Mesh[]
  light: THREE.PointLight
  bulbMesh: THREE.Mesh
}

export function createStreetLamp(toonGradientMap: THREE.DataTexture): StreetLampRefs {
  const group = new THREE.Group()
  const meshes: THREE.Mesh[] = []

  const darkIronMat = createToonMaterial('#2a2a2a', toonGradientMap)
  const ironMat = createToonMaterial('#3a3a3a', toonGradientMap)
  const lightIronMat = createToonMaterial('#4a4a4a', toonGradientMap)

  // 底座下層（較寬）
  const baseLower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.16), darkIronMat)
  baseLower.position.y = 0.015
  group.add(baseLower)
  meshes.push(baseLower)

  // 底座上層（稍窄）
  const baseUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.12), ironMat)
  baseUpper.position.y = 0.045
  group.add(baseUpper)
  meshes.push(baseUpper)

  // 主柱子（較粗）
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8), ironMat)
  pole.position.y = 0.335
  group.add(pole)
  meshes.push(pole)

  // 中段裝飾環
  const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 8), lightIronMat)
  ring1.position.y = 0.25
  group.add(ring1)
  meshes.push(ring1)

  // 上段裝飾環
  const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), lightIronMat)
  ring2.position.y = 0.45
  group.add(ring2)
  meshes.push(ring2)

  // 弧形支臂（用三段小圓柱模擬弧形）
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), ironMat)
  arm1.position.set(0.02, 0.62, 0)
  arm1.rotation.z = -Math.PI / 6
  group.add(arm1)
  meshes.push(arm1)

  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), ironMat)
  arm2.position.set(0.06, 0.65, 0)
  arm2.rotation.z = -Math.PI / 3
  group.add(arm2)
  meshes.push(arm2)

  const arm3 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 6), ironMat)
  arm3.position.set(0.10, 0.64, 0)
  arm3.rotation.z = -Math.PI / 2
  group.add(arm3)
  meshes.push(arm3)

  // 燈籠頂蓋（小倒錐）
  const lanternTop = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 6), darkIronMat)
  lanternTop.position.set(0.13, 0.65, 0)
  group.add(lanternTop)
  meshes.push(lanternTop)

  // 燈籠玻璃罩（六面柱體，半透明暖色）
  const glassMat = new THREE.MeshToonMaterial({
    color: '#997744',
    gradientMap: toonGradientMap,
    transparent: true,
    opacity: 0.3,
  })
  const glassShade = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 6), glassMat)
  glassShade.position.set(0.13, 0.59, 0)
  group.add(glassShade)
  meshes.push(glassShade)

  // 燈籠底部裝飾環
  const lanternBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 6), lightIronMat)
  lanternBottom.position.set(0.13, 0.545, 0)
  group.add(lanternBottom)
  meshes.push(lanternBottom)

  // 燈泡（在燈罩內部）
  const bulbMat = new THREE.MeshBasicMaterial({
    color: '#ffdd88',
    transparent: true,
    opacity: 0.1,
  })
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), bulbMat)
  bulbMesh.position.set(0.13, 0.59, 0)
  group.add(bulbMesh)
  meshes.push(bulbMesh)

  // 點光源
  const light = new THREE.PointLight('#ffcc66', 0, 1.5, 2)
  light.position.set(0.13, 0.59, 0)
  group.add(light)

  return { group, meshes, light, bulbMesh }
}
