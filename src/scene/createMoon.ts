import * as THREE from 'three'
import { MOON_X, MOON_Y, MOON_Z } from '@/constants/scene'
import { COMMON_VERTEX_SHADER, createTimeUniform } from '@/shaders/common'

export function createMoon(scene: THREE.Scene): THREE.Mesh {
  const moonGeo = new THREE.PlaneGeometry(2.0, 2.0)
  const moonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: createTimeUniform(),
      uEmissiveIntensity: { value: 0.8 },
    },
    vertexShader: COMMON_VERTEX_SHADER,
    fragmentShader: `
      uniform float uTime;
      uniform float uEmissiveIntensity;
      varying vec2 vUv;

      // 使用不同常數的 hash，與 GLSL_HASH 的 vec2(12.9898, 78.233) 不同，
      // 此版本產生更適合月球表面紋理的噪點分布
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
        vec3 brightColor = vec3(0.96, 0.87, 0.50);
        vec3 darkColor = vec3(0.65, 0.55, 0.28);
        float regions = fbm(uv * 3.0 + vec2(1.5, 2.8));
        float base = smoothstep(0.35, 0.65, regions);
        vec3 color = mix(darkColor, brightColor, base);
        float crater1 = smoothstep(0.12, 0.08, length(uv - vec2(0.15, 0.2)));
        float crater2 = smoothstep(0.09, 0.06, length(uv - vec2(0.35, -0.1)));
        float crater3 = smoothstep(0.07, 0.04, length(uv - vec2(0.1, -0.15)));
        float crater4 = smoothstep(0.06, 0.03, length(uv - vec2(0.3, 0.25)));
        float crater5 = smoothstep(0.10, 0.06, length(uv - vec2(0.25, 0.05)));
        float craterMask = max(max(max(crater1, crater2), max(crater3, crater4)), crater5);
        color = mix(color, darkColor * 0.7, craterMask * 0.6);
        float detail = fbm(uv * 12.0 + vec2(8.1, 5.3));
        color *= (0.85 + detail * 0.3);
        float edge = smoothstep(0.3, 0.7, mainCircle / moonRadius);
        color *= (1.0 - edge * 0.25);
        color *= uEmissiveIntensity;
        float bloomBoost = smoothstep(0.9, 1.2, uEmissiveIntensity) * 1.0;
        vec3 finalColor = color + color * bloomBoost;
        gl_FragColor = vec4(finalColor, crescent);
      }
    `,
  })

  const moon = new THREE.Mesh(moonGeo, moonMat)
  moon.position.set(MOON_X, MOON_Y, MOON_Z)
  scene.add(moon)

  return moon
}
