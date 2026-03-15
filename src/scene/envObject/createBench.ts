import * as THREE from 'three'
import { createToonMaterial } from '@/scene/shared'

export interface BenchRefs {
  group: THREE.Group
  meshes: THREE.Mesh[]
  newspaperGroup: THREE.Group
  newspaperMesh: THREE.Mesh
}

export function createBench(toonGradientMap: THREE.DataTexture): BenchRefs {
  const group = new THREE.Group()
  const meshes: THREE.Mesh[] = []

  const darkBrownMat = createToonMaterial('#6a4a2a', toonGradientMap)
  const lightBrownMat = createToonMaterial('#8a6a4a', toonGradientMap)

  const legPositions: [number, number, number][] = [
    [-0.15, 0.075, 0.06],
    [0.15, 0.075, 0.06],
    [-0.15, 0.075, -0.06],
    [0.15, 0.075, -0.06],
  ]

  for (const pos of legPositions) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), darkBrownMat)
    leg.position.set(...pos)
    group.add(leg)
    meshes.push(leg)
  }

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.14), lightBrownMat)
  seat.position.y = 0.16
  group.add(seat)
  meshes.push(seat)

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.02), lightBrownMat)
  backrest.position.set(0, 0.27, -0.06)
  backrest.rotation.x = 0.15
  group.add(backrest)
  meshes.push(backrest)

  const armrestLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.14), darkBrownMat)
  armrestLeft.position.set(-0.17, 0.22, 0)
  group.add(armrestLeft)
  meshes.push(armrestLeft)

  const armrestRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.14), darkBrownMat)
  armrestRight.position.set(0.17, 0.22, 0)
  group.add(armrestRight)
  meshes.push(armrestRight)

  const newspaperGroup = new THREE.Group()
  newspaperGroup.position.set(0.05, 0.19, 0.02)

  const newspaperMat = new THREE.MeshBasicMaterial({
    color: '#e8e0d0',
    transparent: true,
    opacity: 1.0,
  })
  const newspaperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 0.06), newspaperMat)
  newspaperGroup.add(newspaperMesh)

  const lineMat = new THREE.MeshBasicMaterial({ color: '#555555' })
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.002), lineMat)
  line.position.y = 0.004
  newspaperGroup.add(line)

  group.add(newspaperGroup)

  return { group, meshes, newspaperGroup, newspaperMesh }
}
