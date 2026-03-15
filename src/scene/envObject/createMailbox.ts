import * as THREE from 'three'
import { createToonMaterial } from '@/scene/shared'

export interface MailboxParticle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  rotationSpeed: THREE.Vector3
}

export interface MailboxRefs {
  group: THREE.Group
  meshes: THREE.Mesh[]
  lidPivot: THREE.Group
  flagPivot: THREE.Group
  particles: MailboxParticle[]
}

export function createMailbox(toonGradientMap: THREE.DataTexture): MailboxRefs {
  const group = new THREE.Group()
  const meshes: THREE.Mesh[] = []

  // 支柱
  const grayMat = createToonMaterial('#5a5a5a', toonGradientMap)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), grayMat)
  pole.position.y = 0.125
  group.add(pole)
  meshes.push(pole)

  // 箱體
  const blueMat = createToonMaterial('#4466aa', toonGradientMap)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.10), blueMat)
  body.position.y = 0.31
  group.add(body)
  meshes.push(body)

  // 蓋子（從頂部開啟）
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, 0.37, -0.05)  // 軸心在箱體頂部後緣
  const darkBlueMat = createToonMaterial('#334488', toonGradientMap)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.10), darkBlueMat)
  lid.position.z = 0.05  // 從軸心向前延伸
  lidPivot.add(lid)
  group.add(lidPivot)
  meshes.push(lid)

  // flagPivot 保留空殼（interface 需要）
  const flagPivot = new THREE.Group()
  group.add(flagPivot)

  // 紙片粒子（保持不變）
  const particles: MailboxParticle[] = []
  const particleMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  })

  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.04), particleMat.clone())
    mesh.visible = false
    group.add(mesh)

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      0.3 + Math.random() * 0.3,
      (Math.random() - 0.5) * 0.2,
    )
    const rotationSpeed = new THREE.Vector3(
      1 + Math.random() * 4,
      1 + Math.random() * 4,
      1 + Math.random() * 4,
    )

    particles.push({ mesh, velocity, rotationSpeed })
  }

  return { group, meshes, lidPivot, flagPivot, particles }
}
