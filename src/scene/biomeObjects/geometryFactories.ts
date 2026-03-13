import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

interface GeometryWithMatrix {
  geometry: THREE.BufferGeometry
  matrix: THREE.Matrix4
}

function mergeAndReturn(parts: GeometryWithMatrix[]): THREE.BufferGeometry {
  const transformed = parts.map(({ geometry, matrix }) => {
    const cloned = geometry.clone()
    cloned.applyMatrix4(matrix)
    geometry.dispose()
    return cloned
  })
  const merged = mergeGeometries(transformed)
  for (const g of transformed) g.dispose()
  return merged
}

export function createGrassGeometry(): THREE.BufferGeometry {
  const bladeCount = 3 + Math.floor(Math.random() * 3)
  const parts: GeometryWithMatrix[] = []

  for (let i = 0; i < bladeCount; i++) {
    const height = 0.12 + Math.random() * 0.06
    const geo = new THREE.ConeGeometry(0.03, height, 4)
    const mat = new THREE.Matrix4()
    const offsetX = (Math.random() - 0.5) * 0.1
    const offsetZ = (Math.random() - 0.5) * 0.1
    mat.makeTranslation(offsetX, height / 2, offsetZ)
    parts.push({ geometry: geo, matrix: mat })
  }

  return mergeAndReturn(parts)
}

export function createSmallRockGeometry(): THREE.BufferGeometry {
  const radius = 0.06 + Math.random() * 0.04
  const geo = new THREE.IcosahedronGeometry(radius, 0)
  const mat = new THREE.Matrix4()
  mat.makeScale(1, 0.6, 1)
  const translated = new THREE.Matrix4().makeTranslation(0, radius * 0.6, 0)
  mat.premultiply(translated)

  const cloned = geo.clone()
  cloned.applyMatrix4(mat)
  geo.dispose()
  return cloned
}

export function createCactusGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const trunkHeight = 0.25
  const trunk = new THREE.CylinderGeometry(0.035, 0.04, trunkHeight, 5)
  const trunkMat = new THREE.Matrix4().makeTranslation(0, trunkHeight / 2, 0)
  parts.push({ geometry: trunk, matrix: trunkMat })

  const leftBranch = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 5)
  const leftMat = new THREE.Matrix4()
  leftMat.makeRotationZ(-Math.PI / 4)
  leftMat.setPosition(-0.07, 0.17, 0)
  parts.push({ geometry: leftBranch, matrix: leftMat })

  const rightBranch = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 5)
  const rightMat = new THREE.Matrix4()
  rightMat.makeRotationZ(Math.PI / 4)
  rightMat.setPosition(0.07, 0.17, 0)
  parts.push({ geometry: rightBranch, matrix: rightMat })

  return mergeAndReturn(parts)
}

export function createDeadTreeGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const trunkHeight = 0.2
  const trunk = new THREE.CylinderGeometry(0.02, 0.04, trunkHeight, 4)
  const trunkMat = new THREE.Matrix4().makeTranslation(0, trunkHeight / 2, 0)
  parts.push({ geometry: trunk, matrix: trunkMat })

  const branchAngles = [-Math.PI / 4, Math.PI / 5, -Math.PI / 6]
  const branchHeights = [0.12, 0.16, 0.09]
  for (let i = 0; i < 3; i++) {
    const branch = new THREE.CylinderGeometry(0.008, 0.015, 0.1, 3)
    const mat = new THREE.Matrix4()
    mat.makeRotationZ(branchAngles[i]!)
    mat.setPosition(Math.sin(branchAngles[i]!) * 0.05, branchHeights[i]!, 0)
    parts.push({ geometry: branch, matrix: mat })
  }

  return mergeAndReturn(parts)
}

export function createPineTreeGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const trunkHeight = 0.1
  const trunk = new THREE.CylinderGeometry(0.03, 0.04, trunkHeight, 5)
  const trunkMat = new THREE.Matrix4().makeTranslation(0, trunkHeight / 2, 0)
  parts.push({ geometry: trunk, matrix: trunkMat })

  const layers = [
    { radius: 0.14, height: 0.15, y: 0.1 },
    { radius: 0.11, height: 0.13, y: 0.18 },
    { radius: 0.08, height: 0.12, y: 0.25 },
  ]

  for (const layer of layers) {
    const cone = new THREE.ConeGeometry(layer.radius, layer.height, 6)
    const mat = new THREE.Matrix4().makeTranslation(0, layer.y + layer.height / 2, 0)
    parts.push({ geometry: cone, matrix: mat })
  }

  return mergeAndReturn(parts)
}

export function createMushroomGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const stemHeight = 0.08
  const stem = new THREE.CylinderGeometry(0.02, 0.025, stemHeight, 5)
  const stemMat = new THREE.Matrix4().makeTranslation(0, stemHeight / 2, 0)
  parts.push({ geometry: stem, matrix: stemMat })

  const cap = new THREE.SphereGeometry(0.06, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)
  const capMat = new THREE.Matrix4().makeTranslation(0, stemHeight, 0)
  parts.push({ geometry: cap, matrix: capMat })

  return mergeAndReturn(parts)
}

export function createSharpRockGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(0.08, 0.25, 4)

  const posAttr = geo.getAttribute('position')
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i)
    if (y > 0.1) {
      posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.02)
      posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.02)
    }
  }
  posAttr.needsUpdate = true
  geo.computeVertexNormals()

  const mat = new THREE.Matrix4().makeTranslation(0, 0.125, 0)
  const cloned = geo.clone()
  cloned.applyMatrix4(mat)
  geo.dispose()
  return cloned
}

export function createSmallHillGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2)
  return geo
}

export function createSnowPineGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const trunkHeight = 0.2
  const trunk = new THREE.CylinderGeometry(0.015, 0.03, trunkHeight, 5)
  const trunkMat = new THREE.Matrix4().makeTranslation(0, trunkHeight / 2, 0)
  parts.push({ geometry: trunk, matrix: trunkMat })

  const branches = [
    { height: 0.08, length: 0.10, angleZ: Math.PI / 4, angleY: 0 },
    { height: 0.08, length: 0.09, angleZ: -Math.PI / 3.5, angleY: Math.PI },
    { height: 0.12, length: 0.12, angleZ: Math.PI / 3, angleY: Math.PI / 2 },
    { height: 0.16, length: 0.08, angleZ: -Math.PI / 4.5, angleY: (Math.PI * 3) / 2 },
  ]

  for (const b of branches) {
    const branch = new THREE.CylinderGeometry(0.005, 0.012, b.length, 3)
    const mat = new THREE.Matrix4()
    const rotY = new THREE.Matrix4().makeRotationY(b.angleY)
    const rotZ = new THREE.Matrix4().makeRotationZ(b.angleZ)
    mat.multiplyMatrices(rotY, rotZ)
    const offsetX = Math.sin(b.angleY) * Math.sin(b.angleZ) * b.length * 0.5
    const offsetZ = Math.cos(b.angleY) * Math.sin(b.angleZ) * b.length * 0.5
    mat.setPosition(offsetX, b.height + Math.cos(b.angleZ) * b.length * 0.5, offsetZ)
    parts.push({ geometry: branch, matrix: mat })
  }

  return mergeAndReturn(parts)
}

export function createSnowmanGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const bottom = new THREE.SphereGeometry(0.06, 6, 5)
  const bottomMat = new THREE.Matrix4().makeTranslation(0, 0.06, 0)
  parts.push({ geometry: bottom, matrix: bottomMat })

  const top = new THREE.SphereGeometry(0.04, 6, 5)
  const topMat = new THREE.Matrix4().makeTranslation(0, 0.15, 0)
  parts.push({ geometry: top, matrix: topMat })

  return mergeAndReturn(parts)
}

export function createSnowPileGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2)

  const scaleMat = new THREE.Matrix4().makeScale(1, 0.6, 1)
  geo.applyMatrix4(scaleMat)

  return geo
}

export function createFishGeometry(): THREE.BufferGeometry {
  const parts: GeometryWithMatrix[] = []

  const body = new THREE.SphereGeometry(0.05, 5, 4)
  const bodyMat = new THREE.Matrix4()
  bodyMat.makeScale(0.7, 0.8, 1.8)
  bodyMat.setPosition(0, 0.05, 0)
  parts.push({ geometry: body, matrix: bodyMat })

  const tail = new THREE.ConeGeometry(0.04, 0.06, 3)
  const tailMat = new THREE.Matrix4()
  const tailRotX = new THREE.Matrix4().makeRotationX(Math.PI / 2)
  const tailTranslate = new THREE.Matrix4().makeTranslation(0, 0.05, -0.09)
  tailMat.multiplyMatrices(tailTranslate, tailRotX)
  parts.push({ geometry: tail, matrix: tailMat })

  return mergeAndReturn(parts)
}
