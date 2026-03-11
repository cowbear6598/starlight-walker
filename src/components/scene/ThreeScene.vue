<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SCENE_ASPECT } from '@/constants/scene'

const EARTH_RADIUS = 4
const EARTH_Y = -5.8
const MOON_X = 2
const MOON_Y = 6.0
const MOON_Z = -3

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
let moonMesh: THREE.Mesh
let leftLeg: THREE.Object3D

interface StarParticle {
  mesh: THREE.Mesh
  life: number
  maxLife: number
  baseScale: number
}

let starParticles: StarParticle[] = []
let lastTimestamp = 0
let rightLeg: THREE.Object3D
let leftArm: THREE.Object3D
let rightArm: THREE.Object3D
let capeMesh: THREE.Mesh
let bgShaderMaterial: THREE.ShaderMaterial

const COMMON_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GLSL_HASH = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
`

const SketchPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: COMMON_VERTEX_SHADER,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    ${GLSL_HASH}

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
  vertexShader: COMMON_VERTEX_SHADER,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    ${GLSL_HASH}

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

  camera = new THREE.PerspectiveCamera(60, SCENE_ASPECT, 0.1, 2000)
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
  sketchPass.uniforms['uResolution']!.value.set(containerRef.value.clientWidth, containerRef.value.clientHeight)
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
  moonLight.position.set(MOON_X, MOON_Y, MOON_Z)
  scene.add(moonLight)

  // 夢幻漸層天空背景
  const bgGeometry = new THREE.PlaneGeometry(2, 2)
  const bgMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.9999, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        float y = vUv.y;

        // 三段漸層：頂部深空 → 中間靛紫 → 底部深青
        vec3 deepSpace = vec3(0.002, 0.002, 0.01);
        vec3 midPurple = vec3(0.015, 0.01, 0.04);
        vec3 horizonTeal = vec3(0.01, 0.02, 0.035);

        vec3 color;
        if (y > 0.5) {
          float t = (y - 0.5) / 0.5;
          t = t * t;
          color = mix(midPurple, deepSpace, t);
        } else {
          float t = y / 0.5;
          t = sqrt(t);
          color = mix(horizonTeal, midPurple, t);
        }

        // 大氣層光暈
        float glowCenter = 0.35;
        float glow = exp(-pow((y - glowCenter) / 0.15, 2.0));
        vec3 glowColor = vec3(0.015, 0.025, 0.04);
        color += glowColor * glow * 0.2;

        // 極微量 noise 增加質感
        float n = hash(vUv * 500.0 + vec2(uTime * 0.01)) * 0.004;
        color += n;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
  bgMesh.renderOrder = -1000
  bgMesh.frustumCulled = false
  scene.add(bgMesh)
  bgShaderMaterial = bgMaterial

  createEarth()
  createStars()
  createMoon()
  createStickFigure(toonGradientMap)
  animate()

  window.addEventListener('resize', onResize)
})

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function createEarth() {
  let geometry: THREE.BufferGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS, 5)
  if (geometry.index) geometry = geometry.toNonIndexed()

  const positionAttr = geometry.getAttribute('position')
  const colors = new Float32Array(positionAttr.count * 3)

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

function createStars() {
  const starColors = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#e8e8ff'),
    new THREE.Color('#ffe8cc'),
    new THREE.Color('#cce8ff'),
  ]

  function createStarShape(points: number, outerR: number, innerR: number): THREE.Shape {
    const shape = new THREE.Shape()
    const total = points * 2
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return shape
  }

  const fiveStarGeo = new THREE.ShapeGeometry(createStarShape(5, 1, 0.4))
  const sixStarGeo = new THREE.ShapeGeometry(createStarShape(6, 1, 0.5))
  const circleGeo = new THREE.CircleGeometry(0.8, 16)
  // 五星和六星各佔 40%，圓形佔 20%
  const geometries = [fiveStarGeo, fiveStarGeo, sixStarGeo, sixStarGeo, circleGeo]

  const starGroup = new THREE.Group()
  starGroup.name = 'geometryStars'

  for (let i = 0; i < 35; i++) {
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

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
    })

    const mesh = new THREE.Mesh(starGeo, mat)
    mesh.visible = false
    starGroup.add(mesh)

    starParticles.push({
      mesh,
      life: 0,
      maxLife: 15 + Math.random() * 15,
      baseScale: 0.03 + Math.random() * 0.05,
    })
  }

  // Prewarm: 預先生成 18 顆星星，分散在不同生命階段
  for (let i = 0; i < 18; i++) {
    const p = starParticles[i]!
    spawnStar(p)
    // 給不同生命值，模擬已經運行了一段時間
    p.life = 0.1 + Math.random() * 0.7 // 散佈在穩定和淡出階段
    applyStarAppearance(p)
  }

  scene.add(starGroup)
  outlineObjects.push(starGroup)
}

function applyStarAppearance(particle: StarParticle) {
  const s = particle.baseScale
  particle.mesh.scale.set(s, s, s)

  const mat = particle.mesh.material
  if (!(mat instanceof THREE.MeshBasicMaterial)) return

  if (particle.life > 0.8) {
    const t = (1.0 - particle.life) / 0.2
    mat.opacity = 0.9 * t
  } else if (particle.life > 0.3) {
    mat.opacity = 0.9
  } else {
    const t = particle.life / 0.3
    mat.opacity = 0.9 * t
  }
}

function spawnStar(particle: StarParticle) {
  const COLS = 3
  const ROWS = 2

  // 統計每個格子的存活星星數量，用螢幕空間投影判斷星星所在格子
  const grid = new Array(COLS * ROWS).fill(0)
  for (const p of starParticles) {
    if (p.life <= 0 || p === particle) continue
    const wz = p.mesh.position.z
    const wy = p.mesh.position.y
    const wx = p.mesh.position.x
    const d = 10 - wz
    const hh = Math.tan(30 * Math.PI / 180) * d
    const hw = hh * (9 / 20)
    const nx = Math.min(Math.max((wx + hw) / (2 * hw), 0), 0.999)
    const ny = Math.min(Math.max((wy - hh * 0.4) / (hh * 0.6), 0), 0.999)
    const col = Math.floor(nx * COLS)
    const row = Math.floor(ny * ROWS)
    grid[row * COLS + col]++
  }

  // 計算月亮所在的格子並排除
  const moonDist = 10 - MOON_Z
  const moonHH = Math.tan(30 * Math.PI / 180) * moonDist
  const moonHW = moonHH * (9 / 20)
  const moonNX = Math.min(Math.max((MOON_X + moonHW) / (2 * moonHW), 0), 0.999)
  const moonNY = Math.min(Math.max((MOON_Y - moonHH * 0.4) / (moonHH * 0.6), 0), 0.999)
  const moonCell = Math.floor(moonNY * ROWS) * COLS + Math.floor(moonNX * COLS)

  // 找出星星最少的格子們（排除月亮格子），隨機選一個
  const minCount = Math.min(...grid.filter((_, i) => i !== moonCell))
  const candidates: number[] = []
  for (let i = 0; i < grid.length; i++) {
    if (i !== moonCell && grid[i] === minCount) candidates.push(i)
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]!
  const chosenCol = chosen % COLS
  const chosenRow = Math.floor(chosen / COLS)

  const z = -2 - Math.random() * 8
  const dist = 10 - z
  const halfHeight = Math.tan(30 * Math.PI / 180) * dist
  const halfWidth = halfHeight * (9 / 20)
  const yMax = halfHeight
  const yMin = halfHeight * 0.4

  // 根據選中格子的螢幕空間範圍反算世界座標
  const nxMin = chosenCol / COLS
  const nxMax = (chosenCol + 1) / COLS
  const nyMin = chosenRow / ROWS
  const nyMax = (chosenRow + 1) / ROWS

  const nx = nxMin + Math.random() * (nxMax - nxMin)
  const ny = nyMin + Math.random() * (nyMax - nyMin)

  const x = nx * 2 * halfWidth - halfWidth
  const y = yMin + ny * (yMax - yMin)

  particle.mesh.position.set(x, y, z)
  particle.mesh.rotation.set(0, 0, Math.random() * Math.PI * 2)
  particle.life = 1.0
  particle.maxLife = 15 + Math.random() * 15
  // 根據深度補償大小，越遠的星星 baseScale 越大，確保螢幕上視覺大小一致
  const depthScale = dist / 12 // 最近 dist=12 時為 1，dist=20 時約 1.67
  particle.baseScale = (0.03 + Math.random() * 0.05) * depthScale
  particle.mesh.visible = true
  particle.mesh.scale.set(particle.baseScale, particle.baseScale, particle.baseScale)
  if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
    particle.mesh.material.opacity = 0
    // 30% 機率是亮星，用 color 放大亮度超過 bloom threshold
    particle.mesh.material.color.setScalar(Math.random() < 0.3 ? 2.5 : 1.0)
  }
}

function createMoon() {
  const moonGeo = new THREE.PlaneGeometry(2.0, 2.0)
  const moonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0.0 },
      uEmissiveIntensity: { value: 0.8 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uEmissiveIntensity;
      varying vec2 vUv;

      // 簡易 2D noise 用於月球表面紋理
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv * 2.0 - 1.0;

        float mainCircle = length(uv);

        vec2 maskCenter = vec2(-0.35, 0.0);
        float maskCircle = length(uv - maskCenter);

        float moonRadius = 0.7;
        float maskRadius = 0.65;

        float moon = smoothstep(moonRadius + 0.02, moonRadius - 0.02, mainCircle);
        float mask = smoothstep(maskRadius - 0.02, maskRadius + 0.02, maskCircle);
        float crescent = moon * mask;

        if (crescent < 0.01) discard;

        // 月球表面基色：亮面與暗面
        vec3 brightColor = vec3(0.96, 0.87, 0.50);
        vec3 darkColor = vec3(0.65, 0.55, 0.28);

        // 大區域明暗斑塊（月海 vs 高地）
        float regions = fbm(uv * 3.0 + vec2(1.5, 2.8));
        float base = smoothstep(0.35, 0.65, regions);
        vec3 color = mix(darkColor, brightColor, base);

        // 隕石坑：用多個固定位置的圓形凹陷
        float crater1 = smoothstep(0.12, 0.08, length(uv - vec2(0.15, 0.2)));
        float crater2 = smoothstep(0.09, 0.06, length(uv - vec2(0.35, -0.1)));
        float crater3 = smoothstep(0.07, 0.04, length(uv - vec2(0.1, -0.15)));
        float crater4 = smoothstep(0.06, 0.03, length(uv - vec2(0.3, 0.25)));
        float crater5 = smoothstep(0.10, 0.06, length(uv - vec2(0.25, 0.05)));
        float craterMask = max(max(max(crater1, crater2), max(crater3, crater4)), crater5);
        color = mix(color, darkColor * 0.7, craterMask * 0.6);

        // 細節 noise 增加質感
        float detail = fbm(uv * 12.0 + vec2(8.1, 5.3));
        color *= (0.85 + detail * 0.3);

        // 邊緣偏暗（模擬球面光照衰減）
        float edge = smoothstep(0.3, 0.7, mainCircle / moonRadius);
        color *= (1.0 - edge * 0.25);

        color *= uEmissiveIntensity;

        // 額外 bloom 增益：當 intensity 高時推高輸出值讓 bloom pass 偵測到
        float bloomBoost = smoothstep(0.9, 1.2, uEmissiveIntensity) * 1.0;
        vec3 finalColor = color + color * bloomBoost;

        gl_FragColor = vec4(finalColor, crescent);
      }
    `,
  })

  const moon = new THREE.Mesh(moonGeo, moonMat)
  moon.position.set(MOON_X, MOON_Y, MOON_Z)
  scene.add(moon)
  moonMesh = moon
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

  const capePositions = cape.geometry.getAttribute('position')
  cape.userData.originalPositions = new Float32Array(capePositions.array)

  leftLeg = stickFigure.getObjectByName('leftLeg')!
  rightLeg = stickFigure.getObjectByName('rightLeg')!
  leftArm = stickFigure.getObjectByName('leftArm')!
  rightArm = stickFigure.getObjectByName('rightArm')!
  capeMesh = cape

  // 側面朝向相機（面向左走）
  stickFigure.rotation.y = Math.PI / 2
  stickFigure.position.set(0, EARTH_Y + EARTH_RADIUS, 0)
  scene.add(stickFigure)
  outlineObjects.push(stickFigure)
}

function animate(timestamp: number = 0) {
  animationId = requestAnimationFrame(animate)
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
  lastTimestamp = timestamp
  const now = timestamp * 0.001

  if (earth) {
    earth.rotation.z -= 0.0008
  }

  // 月亮呼吸效果
  if (moonMesh) {
    const breathe = Math.sin(now * 0.25) * 0.5 + 0.5
    const scale = 1.0 + breathe * 0.05
    moonMesh.scale.set(scale, scale, scale)
    if (moonMesh.material instanceof THREE.ShaderMaterial) {
      if (moonMesh.material.uniforms['uEmissiveIntensity']) {
        moonMesh.material.uniforms['uEmissiveIntensity']!.value = 0.6 + breathe * 0.5
      }
      if (moonMesh.material.uniforms['uTime']) {
        moonMesh.material.uniforms['uTime']!.value = now
      }
    }
  }

  // 星星粒子系統
  let aliveCount = 0
  for (const p of starParticles) {
    if (p.life > 0) aliveCount++
  }
  for (const particle of starParticles) {
    if (particle.life <= 0) {
      if (aliveCount < 15 && Math.random() < 0.05) {
        spawnStar(particle)
        aliveCount++
      }
      continue
    }

    particle.life -= dt / particle.maxLife

    if (particle.life <= 0) {
      particle.life = 0
      particle.mesh.visible = false
      continue
    }

    applyStarAppearance(particle)
  }

  if (stickFigure) {
    const walkTime = now * 1.5

    if (leftLeg) leftLeg.rotation.x = Math.sin(walkTime) * 0.3
    if (rightLeg) rightLeg.rotation.x = Math.sin(walkTime + Math.PI) * 0.3
    if (leftArm) leftArm.rotation.x = Math.sin(walkTime + Math.PI) * 0.2
    if (rightArm) rightArm.rotation.x = Math.sin(walkTime) * 0.2

    stickFigure.position.y = EARTH_Y + EARTH_RADIUS + Math.abs(Math.sin(walkTime * 2)) * 0.02

    if (capeMesh) {
      const capeGeo = capeMesh.geometry as THREE.BufferGeometry
      const posAttr = capeGeo.getAttribute('position')
      const original = capeMesh.userData.originalPositions as Float32Array

      for (let i = 0; i < posAttr.count; i++) {
        const ox = original[i * 3] ?? 0
        const oy = original[i * 3 + 1] ?? 0
        const oz = original[i * 3 + 2] ?? 0
        const distFromTop = 0.25 - oy
        const wave = Math.sin(now * 3 + distFromTop * 5) * distFromTop * 0.15
        posAttr.setZ(i, oz - Math.abs(wave) - distFromTop * 0.1)
        posAttr.setX(i, ox + Math.sin(now * 3 * 0.7 + distFromTop * 3) * distFromTop * 0.05)
      }
      posAttr.needsUpdate = true
    }
  }

  if (bgShaderMaterial) bgShaderMaterial.uniforms['uTime']!.value = now
  if (sketchPass) sketchPass.uniforms['uTime']!.value = now
  if (paperPass) paperPass.uniforms['uTime']!.value = now

  composer.render()
}

function onResize() {
  if (!renderer || !camera) return
  if (!containerRef.value) return
  camera.aspect = SCENE_ASPECT
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  composer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  if (sketchPass) {
    sketchPass.uniforms['uResolution']!.value.set(containerRef.value.clientWidth, containerRef.value.clientHeight)
  }
}

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)

  scene?.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose()
      if (object.material instanceof THREE.Material) {
        object.material.dispose()
      }
      else if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
      }
    }
  })

  composer?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full" />
</template>
