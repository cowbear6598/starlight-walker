import { GLSL_HASH, createTimeUniform } from './common'

export const BackgroundShader = {
  uniforms: {
    uTime: createTimeUniform(),
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

    ${GLSL_HASH}

    void main() {
      float y = vUv.y;
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
      float glowCenter = 0.35;
      float glow = exp(-pow((y - glowCenter) / 0.15, 2.0));
      vec3 glowColor = vec3(0.015, 0.025, 0.04);
      color += glowColor * glow * 0.2;
      float n = hash(vUv * 500.0 + vec2(uTime * 0.01)) * 0.004;
      color += n;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
}
