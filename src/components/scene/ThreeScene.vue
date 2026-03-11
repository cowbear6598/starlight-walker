<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

const EARTH_RADIUS = 4
const EARTH_Y = -5.8

const containerRef = ref<HTMLDivElement>()

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let earth: THREE.Mesh
let animationId: number
let stickFigure: THREE.Group
let composer: EffectComposer
let outlineObjects: THREE.Object3D[] = []
let sketchPass: ShaderPass
let paperPass: ShaderPass

const SketchPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 texel = 1.0 / uResolution;

      vec4 color = texture2D(tDiffuse, vUv);

      float lumaCenter = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float lumaUp    = dot(texture2D(tDiffuse, vUv + vec2(0.0,  texel.y)).rgb, vec3(0.299, 0.587, 0.114));
      float lumaDown  = dot(texture2D(tDiffuse, vUv + vec2(0.0, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
      float lumaLeft  = dot(texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
      float lumaRight = dot(texture2D(tDiffuse, vUv + vec2( texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));

      float edgeDiff = abs(lumaCenter - lumaUp) + abs(lumaCenter - lumaDown)
                     + abs(lumaCenter - lumaLeft) + abs(lumaCenter - lumaRight);

      vec4 finalColor = color;

      if (edgeDiff > 0.1) {
        float n = hash(vUv * 100.0 + vec2(uTime * 0.3));
        vec2 offset = vec2(
          sin(uTime * 1.3 + vUv.x * 200.0) * 0.002 + (n - 0.5) * 0.001,
          cos(uTime * 1.1 + vUv.y * 200.0) * 0.002 + (n - 0.5) * 0.001
        );
        vec4 jitteredColor = texture2D(tDiffuse, vUv + offset);
        finalColor = mix(color, jitteredColor, 0.6);
      }

      gl_FragColor = finalColor;
    }
  `,
}

const PaperTextureShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      float grain = hash(vUv * 500.0 + vec2(uTime * 0.01));
      float coarse = hash(vUv * 50.0);
      float paperNoise = grain * 0.6 + coarse * 0.4;

      vec3 result = mix(color.rgb, vec3(paperNoise), 0.025);

      gl_FragColor = vec4(result, color.a);
    }
  `,
}

function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([80, 160, 255])
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

onMounted(() => {
  if (!containerRef.value) return

  const toonGradientMap = createToonGradientMap()

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a0e27')

  camera = new THREE.PerspectiveCamera(60, 9 / 20, 0.1, 2000)
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  containerRef.value.appendChild(renderer.domElement)

  composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const outlinePass = new OutlinePass(
    new THREE.Vector2(containerRef.value.clientWidth, containerRef.value.clientHeight),
    scene,
    camera,
  )
  outlinePass.selectedObjects = outlineObjects
  outlinePass.edgeStrength = 3.0
  outlinePass.edgeGlow = 0.0
  outlinePass.edgeThickness = 1.0
  outlinePass.visibleEdgeColor = new THREE.Color('#2a2a2a')
  outlinePass.hiddenEdgeColor = new THREE.Color('#2a2a2a')
  composer.addPass(outlinePass)

  sketchPass = new ShaderPass(SketchPostShader)
  sketchPass.uniforms.uResolution.value.set(containerRef.value.clientWidth, containerRef.value.clientHeight)
  composer.addPass(sketchPass)

  paperPass = new ShaderPass(PaperTextureShader)
  composer.addPass(paperPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(containerRef.value.clientWidth, containerRef.value.clientHeight),
    0.3,
    0.3,
    0.6,
  )
  composer.addPass(bloomPass)

  const ambientLight = new THREE.AmbientLight('#aabbcc', 0.8)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight('#ffffff', 1.0)
  directionalLight.position.set(3, 6, 10)
  scene.add(directionalLight)

  const moonLight = new THREE.PointLight('#f5d76e', 0.5, 50)
  moonLight.position.set(4, 5.0, -3)
  scene.add(moonLight)

  createEarth(toonGradientMap)
  createStars(toonGradientMap)
  createMoon(toonGradientMap)
  createStickFigure(toonGradientMap)
  animate()

  window.addEventListener('resize', onResize)
})

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function createCircleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
}

function createEarth(toonGradientMap: THREE.DataTexture) {
  let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS, 5)
  if (geometry.index) geometry = geometry.toNonIndexed()

  const positionAttr = geometry.getAttribute('position')
  const colors = new Float32Array(positionAttr.count * 3)

  const oceanColors: THREE.Color[] = [
    new THREE.Color('#1a3a5c'),
    new THREE.Color('#1e4266'),
    new THREE.Color('#163858'),
    new THREE.Color('#1b4060'),
    new THREE.Color('#1a3d5e'),
  ]
  const landColors: THREE.Color[] = [
    new THREE.Color('#2a5a50'),
    new THREE.Color('#2e6258'),
    new THREE.Color('#336860'),
    new THREE.Color('#255648'),
    new THREE.Color('#2c5e52'),
  ]
  const mountainColors: THREE.Color[] = [
    new THREE.Color('#3a4a50'),
    new THREE.Color('#344452'),
    new THREE.Color('#3e4e54'),
  ]
  const desertColors: THREE.Color[] = [
    new THREE.Color('#4a5558'),
    new THREE.Color('#505a5c'),
    new THREE.Color('#465254'),
    new THREE.Color('#4c5658'),
  ]
  const snowColors: THREE.Color[] = [
    new THREE.Color('#6a7a8a'),
    new THREE.Color('#607080'),
    new THREE.Color('#6e7e8e'),
  ]
  const deepForestColors: THREE.Color[] = [
    new THREE.Color('#1e4038'),
    new THREE.Color('#1a3a32'),
    new THREE.Color('#22443c'),
  ]

  for (let i = 0; i < positionAttr.count; i += 3) {
    const cx = (positionAttr.getX(i) + positionAttr.getX(i + 1) + positionAttr.getX(i + 2)) / 3
    const cy = (positionAttr.getY(i) + positionAttr.getY(i + 1) + positionAttr.getY(i + 2)) / 3
    const cz = (positionAttr.getZ(i) + positionAttr.getZ(i + 1) + positionAttr.getZ(i + 2)) / 3

    const theta = Math.atan2(cz, cx)
    const phi = Math.asin(cy / Math.sqrt(cx * cx + cy * cy + cz * cz))

    let color: THREE.Color

    // 依據球面座標 theta（經度）和 phi（緯度）劃分地球表面各地理區域，
    // 讓地球呈現多樣地形而非全部海洋
    if (phi > 1.0) {
      color = pickRandom(snowColors)
    }
    else if (phi < -1.0) {
      color = pickRandom(snowColors)
    }
    else if (theta > 0.8 && theta < 2.8 && phi > 0.0 && phi < 1.3) {
      color = pickRandom(landColors)
    }
    else if (theta > -2.2 && theta < -0.1 && phi < 0.0 && phi > -1.1) {
      color = Math.random() > 0.3 ? pickRandom(landColors) : pickRandom(mountainColors)
    }
    else if (theta > -0.8 && theta < 0.5 && phi > -0.3 && phi < 0.3) {
      color = pickRandom(desertColors)
    }
    else if (theta > 2.5 && theta < 3.14 && phi > -0.5 && phi < 0.2) {
      color = Math.random() > 0.4 ? pickRandom(deepForestColors) : pickRandom(oceanColors)
    }
    else if (theta > 0.0 && theta < 1.0 && phi > -0.8 && phi < -0.2) {
      color = Math.random() > 0.3 ? pickRandom(landColors) : pickRandom(mountainColors)
    }
    else {
      color = pickRandom(oceanColors)
    }

    for (let j = 0; j < 3; j++) {
      colors[(i + j) * 3] = color.r
      colors[(i + j) * 3 + 1] = color.g
      colors[(i + j) * 3 + 2] = color.b
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
  })

  earth = new THREE.Mesh(geometry, material)
  earth.position.set(0, EARTH_Y, 0)
  scene.add(earth)
  outlineObjects.push(earth)

  let atmosphereGeometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS + 0.2, 5)
  if (atmosphereGeometry.index) atmosphereGeometry = atmosphereGeometry.toNonIndexed()
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: '#4488aa',
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  atmosphere.position.set(0, EARTH_Y, 0)
  scene.add(atmosphere)
}

function createStars(toonGradientMap: THREE.DataTexture) {
  const circleTexture = createCircleTexture()

  const starCount = 200
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.5
    const r = 50 + Math.random() * 200
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = -r * Math.sin(phi) * Math.sin(theta)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.8,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    map: circleTexture,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const stars = new THREE.Points(geometry, material)
  stars.name = 'stars'
  scene.add(stars)

  const starColors = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#e8e8ff'),
    new THREE.Color('#ffe8cc'),
    new THREE.Color('#cce8ff'),
  ]

  const diamondGeo = new THREE.OctahedronGeometry(1, 0)

  function createFiveStarShape(): THREE.Shape {
    const shape = new THREE.Shape()
    const outerR = 1
    const innerR = 0.4
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return shape
  }

  const fiveStarGeo = new THREE.ExtrudeGeometry(createFiveStarShape(), { depth: 0.15, bevelEnabled: false })

  const geometries = [diamondGeo, fiveStarGeo]

  const starGroup = new THREE.Group()
  starGroup.name = 'geometryStars'

  // 用網格分佈 + jitter 讓星星均勻分散
  const gridCols = 6
  const gridRows = 3
  const xRange = 16
  const yMin = 2.5
  const yRange = 5.0
  const cellWidth = xRange / gridCols
  const cellHeight = yRange / gridRows

  for (let i = 0; i < 18; i++) {
    const geo = pickRandom(geometries)
    let starGeo: THREE.BufferGeometry = geo.clone()
    if (starGeo.index) starGeo = starGeo.toNonIndexed()

    const posAttr = starGeo.getAttribute('position')
    const vertColors = new Float32Array(posAttr.count * 3)
    const baseColor = pickRandom(starColors)
    for (let v = 0; v < posAttr.count; v++) {
      vertColors[v * 3] = baseColor.r + (Math.random() - 0.5) * 0.1
      vertColors[v * 3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.1
      vertColors[v * 3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.1
    }
    starGeo.setAttribute('color', new THREE.BufferAttribute(vertColors, 3))

    const mat = new THREE.MeshToonMaterial({
      vertexColors: true,
      emissive: baseColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      gradientMap: toonGradientMap,
    })

    const mesh = new THREE.Mesh(starGeo, mat)

    const col = i % gridCols
    const row = Math.floor(i / gridCols)
    const x = -xRange / 2 + (col + 0.5) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.7
    const y = yMin + (row + 0.5) * cellHeight + (Math.random() - 0.5) * cellHeight * 0.7
    const z = -2 - Math.random() * 10
    mesh.position.set(x, y, z)

    const scale = 0.04 + Math.random() * 0.08
    mesh.scale.set(scale, scale, scale)

    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    )

    mesh.userData.twinkle = Math.random() > 0.4
    mesh.userData.twinkleSpeed = 0.5 + Math.random() * 2
    mesh.userData.twinkleOffset = Math.random() * Math.PI * 2

    starGroup.add(mesh)
  }

  scene.add(starGroup)
  outlineObjects.push(starGroup)
}

function createMoon(toonGradientMap: THREE.DataTexture) {
  // 弦月 = 黃色低多邊形球 + 背景色球蓋住右半邊
  const moonGeo = new THREE.SphereGeometry(0.8, 24, 18)
  const nonIndexed = moonGeo.index ? moonGeo.toNonIndexed() : moonGeo

  const posAttr = nonIndexed.getAttribute('position')
  const colors = new Float32Array(posAttr.count * 3)
  const moonColors: THREE.Color[] = [
    new THREE.Color('#f5d76e'),
    new THREE.Color('#f0c040'),
    new THREE.Color('#e8b830'),
    new THREE.Color('#d4a520'),
  ]

  for (let i = 0; i < posAttr.count; i += 3) {
    const color = pickRandom(moonColors)
    for (let j = 0; j < 3; j++) {
      colors[(i + j) * 3] = color.r
      colors[(i + j) * 3 + 1] = color.g
      colors[(i + j) * 3 + 2] = color.b
    }
  }
  nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const moonMat = new THREE.MeshToonMaterial({
    vertexColors: true,
    emissive: new THREE.Color('#f5d76e'),
    emissiveIntensity: 0.8,
    gradientMap: toonGradientMap,
  })

  const moon = new THREE.Mesh(nonIndexed, moonMat)
  moon.position.set(4, 5.0, -3)
  scene.add(moon)
  outlineObjects.push(moon)

  // 背景色球體蓋住右邊，形成弦月
  const shadowGeo = new THREE.SphereGeometry(0.78, 32, 32)
  const shadowMat = new THREE.MeshBasicMaterial({
    color: '#0a0e27',
  })
  const shadow = new THREE.Mesh(shadowGeo, shadowMat)
  shadow.position.set(4 - 0.25, 5.0, -2.8)
  scene.add(shadow)
}

function createStickFigure(toonGradientMap: THREE.DataTexture) {
  stickFigure = new THREE.Group()

  const darkGrayMat = new THREE.MeshToonMaterial({
    color: '#4a4a4a',
    gradientMap: toonGradientMap,
  })
  const lightGrayMat = new THREE.MeshToonMaterial({
    color: '#6a6a6a',
    gradientMap: toonGradientMap,
  })
  const headMat = new THREE.MeshToonMaterial({
    color: '#7a7a7a',
    gradientMap: toonGradientMap,
  })

  const headGeo = new THREE.IcosahedronGeometry(0.18, 1)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.9
  stickFigure.add(head)

  const bodyGeo = new THREE.BoxGeometry(0.16, 0.45, 0.1)
  const body = new THREE.Mesh(bodyGeo, darkGrayMat)
  body.position.y = 0.52
  stickFigure.add(body)

  const armGeo = new THREE.BoxGeometry(0.06, 0.32, 0.06)

  const leftArm = new THREE.Mesh(armGeo, lightGrayMat.clone())
  leftArm.position.set(-0.14, 0.58, 0)
  leftArm.name = 'leftArm'
  stickFigure.add(leftArm)

  const rightArm = new THREE.Mesh(armGeo, lightGrayMat.clone())
  rightArm.position.set(0.14, 0.58, 0)
  rightArm.name = 'rightArm'
  stickFigure.add(rightArm)

  const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08)

  const leftLeg = new THREE.Mesh(legGeo, darkGrayMat.clone())
  leftLeg.position.set(-0.06, 0.15, 0)
  leftLeg.name = 'leftLeg'
  stickFigure.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeo, darkGrayMat.clone())
  rightLeg.position.set(0.06, 0.15, 0)
  rightLeg.name = 'rightLeg'
  stickFigure.add(rightLeg)

  const capeGeo = new THREE.PlaneGeometry(0.5, 0.7, 6, 12)
  const capeMat = new THREE.MeshToonMaterial({
    color: '#3a3a5a',
    side: THREE.DoubleSide,
    gradientMap: toonGradientMap,
  })
  const cape = new THREE.Mesh(capeGeo, capeMat)
  cape.position.set(0, 0.45, -0.12)
  cape.rotation.x = 0.15
  cape.rotation.y = -Math.PI / 2
  cape.name = 'cape'
  stickFigure.add(cape)

  // 側面朝向相機（面向左走）
  stickFigure.rotation.y = Math.PI / 2
  stickFigure.position.set(0, EARTH_Y + EARTH_RADIUS, 0)
  scene.add(stickFigure)
  outlineObjects.push(stickFigure)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (earth) {
    earth.rotation.z -= 0.0008
  }

  const geometryStars = scene.getObjectByName('geometryStars') as THREE.Group | undefined
  if (geometryStars) {
    const time = Date.now() * 0.001
    geometryStars.children.forEach((child) => {
      if (child.userData.twinkle && child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshToonMaterial) {
          child.material.opacity = 0.5 + Math.sin(time * child.userData.twinkleSpeed + child.userData.twinkleOffset) * 0.4
        }
      }
    })
  }

  if (stickFigure) {
    const walkTime = Date.now() * 0.001 * 1.5

    const leftLeg = stickFigure.getObjectByName('leftLeg')
    const rightLeg = stickFigure.getObjectByName('rightLeg')
    const leftArm = stickFigure.getObjectByName('leftArm')
    const rightArm = stickFigure.getObjectByName('rightArm')

    if (leftLeg) leftLeg.rotation.x = Math.sin(walkTime) * 0.3
    if (rightLeg) rightLeg.rotation.x = Math.sin(walkTime + Math.PI) * 0.3
    if (leftArm) leftArm.rotation.x = Math.sin(walkTime + Math.PI) * 0.2
    if (rightArm) rightArm.rotation.x = Math.sin(walkTime) * 0.2

    stickFigure.position.y = EARTH_Y + EARTH_RADIUS + Math.abs(Math.sin(walkTime * 2)) * 0.02

    const cape = stickFigure.getObjectByName('cape')
    if (cape && cape instanceof THREE.Mesh) {
      const capeGeo = cape.geometry as THREE.BufferGeometry
      const posAttr = capeGeo.getAttribute('position')
      const time = Date.now() * 0.003

      if (!cape.userData.originalPositions) {
        cape.userData.originalPositions = new Float32Array(posAttr.array)
      }
      const original = cape.userData.originalPositions as Float32Array

      for (let i = 0; i < posAttr.count; i++) {
        const ox = original[i * 3] ?? 0
        const oy = original[i * 3 + 1] ?? 0
        const oz = original[i * 3 + 2] ?? 0
        const distFromTop = 0.25 - oy
        const wave = Math.sin(time + distFromTop * 5) * distFromTop * 0.15
        posAttr.setZ(i, oz - Math.abs(wave) - distFromTop * 0.1)
        posAttr.setX(i, ox + Math.sin(time * 0.7 + distFromTop * 3) * distFromTop * 0.05)
      }
      posAttr.needsUpdate = true
    }
  }

  const now = Date.now() * 0.001
  if (sketchPass) sketchPass.uniforms.uTime.value = now
  if (paperPass) paperPass.uniforms.uTime.value = now

  composer.render()
}

function onResize() {
  if (!renderer || !camera) return
  if (!containerRef.value) return
  camera.aspect = 9 / 20
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  composer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  if (sketchPass) {
    sketchPass.uniforms.uResolution.value.set(containerRef.value.clientWidth, containerRef.value.clientHeight)
  }
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  composer?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full" />
</template>
