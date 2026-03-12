import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_Y } from '@/constants/scene'

export interface StickFigureRefs {
  stickFigure: THREE.Group
  leftLeg: THREE.Object3D
  rightLeg: THREE.Object3D
  leftArm: THREE.Object3D
  rightArm: THREE.Object3D
  capeMesh: THREE.Mesh
  originalCapePositions: Float32Array
}

function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([80, 160, 255])
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

export function createStickFigure(
  scene: THREE.Scene,
  outlineObjects: THREE.Object3D[],
): StickFigureRefs {
  const toonGradientMap = createToonGradientMap()

  function createToonMaterial(color: string): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({ color, gradientMap: toonGradientMap })
  }

  const stickFigure = new THREE.Group()

  const darkGrayMat = createToonMaterial('#4a4a4a')
  const lightGrayMat = createToonMaterial('#6a6a6a')
  const headMat = createToonMaterial('#7a7a7a')

  const headGeo = new THREE.IcosahedronGeometry(0.18, 1)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.9
  stickFigure.add(head)

  const bodyGeo = new THREE.BoxGeometry(0.16, 0.45, 0.1)
  const body = new THREE.Mesh(bodyGeo, darkGrayMat)
  body.position.y = 0.52
  stickFigure.add(body)

  const armGeo = new THREE.BoxGeometry(0.06, 0.32, 0.06)

  const leftArmMesh = new THREE.Mesh(armGeo, lightGrayMat)
  leftArmMesh.position.set(-0.14, 0.58, 0)
  leftArmMesh.name = 'leftArm'
  stickFigure.add(leftArmMesh)

  const rightArmMesh = new THREE.Mesh(armGeo, lightGrayMat)
  rightArmMesh.position.set(0.14, 0.58, 0)
  rightArmMesh.name = 'rightArm'
  stickFigure.add(rightArmMesh)

  const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08)

  const leftLegMesh = new THREE.Mesh(legGeo, darkGrayMat)
  leftLegMesh.position.set(-0.06, 0.15, 0)
  leftLegMesh.name = 'leftLeg'
  stickFigure.add(leftLegMesh)

  const rightLegMesh = new THREE.Mesh(legGeo, darkGrayMat)
  rightLegMesh.position.set(0.06, 0.15, 0)
  rightLegMesh.name = 'rightLeg'
  stickFigure.add(rightLegMesh)

  const capeGeo = new THREE.PlaneGeometry(0.5, 0.7, 6, 12)
  const capeMat = createToonMaterial('#3a3a5a')
  capeMat.side = THREE.DoubleSide
  const cape = new THREE.Mesh(capeGeo, capeMat)
  cape.position.set(0, 0.45, -0.12)
  cape.rotation.x = 0.15
  cape.rotation.y = -Math.PI / 2
  cape.name = 'cape'
  stickFigure.add(cape)

  const capePositions = cape.geometry.getAttribute('position')
  const originalCapePositions = new Float32Array(capePositions.array)

  stickFigure.rotation.y = Math.PI / 2
  stickFigure.position.set(0, EARTH_Y + EARTH_RADIUS, 0)
  scene.add(stickFigure)
  outlineObjects.push(stickFigure)

  return {
    stickFigure,
    leftLeg: leftLegMesh,
    rightLeg: rightLegMesh,
    leftArm: leftArmMesh,
    rightArm: rightArmMesh,
    capeMesh: cape,
    originalCapePositions,
  }
}
