import * as THREE from 'three'
import { COMMON_VERTEX_SHADER, GLSL_HASH, createTimeUniform } from './common'

export const SketchPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: createTimeUniform(),
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
