import { COMMON_VERTEX_SHADER, GLSL_HASH, createTimeUniform } from './common'

export const PaperTextureShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: createTimeUniform(),
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
      vec3 result = mix(color.rgb, vec3(paperNoise), 0.018);
      gl_FragColor = vec4(result, color.a);
    }
  `,
}
