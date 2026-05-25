import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * StarDust — 2000 tiny white dots, opacity 0.1, drifting upward.
 * The world breathing. Never stops. Always present.
 */

const starVertexShader = `
  attribute float aOpacity;
  attribute float aSize;
  
  varying float vOpacity;
  
  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying float vOpacity;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vOpacity);
  }
`;

export default function StarDust({ count = 2000 }) {
  const meshRef = useRef();

  const { positions, opacities, sizes, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const op = new Float32Array(count);
    const sz = new Float32Array(count);
    const sp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 20;
      pos[i3 + 2] = (Math.random() - 0.5) * 10 - 2;
      op[i] = 0.05 + Math.random() * 0.08;
      sz[i] = 0.5 + Math.random() * 1.0;
      sp[i] = 0.0001 + Math.random() * 0.0003;
    }

    return { positions: pos, opacities: op, sizes: sz, speeds: sp };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, opacities, sizes]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(() => {
    const posArray = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += speeds[i];
      if (posArray[i3 + 1] > 10) {
        posArray[i3 + 1] = -10;
        posArray[i3] = (Math.random() - 0.5) * 20;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={meshRef} geometry={geometry} material={material} />;
}
