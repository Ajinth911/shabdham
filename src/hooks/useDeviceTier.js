import { useState, useEffect, useRef } from 'react';

/**
 * Device tier detection using detect-gpu and navigator info.
 * HIGH: full Three.js + bloom + 8000 particles
 * MID:  Three.js + CSS filters + 3000 particles
 * LOW:  Canvas 2D + 800 particles
 */

const TIERS = {
  HIGH: 'high',
  MID: 'mid',
  LOW: 'low',
};

const TIER_CONFIG = {
  [TIERS.HIGH]: {
    particleCount: 8000,
    useWebGL: true,
    bloom: true,
    glowMode: 'shader',
    cameraOrbit: true,
    maxFPS: 60,
  },
  [TIERS.MID]: {
    particleCount: 3000,
    useWebGL: true,
    bloom: false,
    glowMode: 'opacity',
    cameraOrbit: false,
    maxFPS: 60,
  },
  [TIERS.LOW]: {
    particleCount: 800,
    useWebGL: false,
    bloom: false,
    glowMode: 'color',
    cameraOrbit: false,
    maxFPS: 30,
  },
};

export function useDeviceTier() {
  const [tier, setTier] = useState(TIERS.MID);
  const [config, setConfig] = useState(TIER_CONFIG[TIERS.MID]);
  const fpsHistory = useRef([]);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const degraded = useRef(false);

  useEffect(() => {
    async function detect() {
      try {
        const { getGPUTier } = await import('detect-gpu');
        const gpuTier = await getGPUTier();
        const memory = navigator.deviceMemory || 4;

        let detectedTier;
        if (gpuTier.tier >= 3 && memory >= 4) {
          detectedTier = TIERS.HIGH;
        } else if (gpuTier.tier >= 2 && memory >= 2) {
          detectedTier = TIERS.MID;
        } else {
          detectedTier = TIERS.LOW;
        }

        setTier(detectedTier);
        setConfig(TIER_CONFIG[detectedTier]);
      } catch (e) {
        // Fallback: try WebGL context test
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            setTier(TIERS.MID);
            setConfig(TIER_CONFIG[TIERS.MID]);
          } else {
            setTier(TIERS.LOW);
            setConfig(TIER_CONFIG[TIERS.LOW]);
          }
        } catch {
          setTier(TIERS.LOW);
          setConfig(TIER_CONFIG[TIERS.LOW]);
        }
      }
    }

    detect();
  }, []);

  /**
   * Call this in the animation loop to monitor FPS
   * and auto-degrade if needed
   */
  const monitorFPS = () => {
    if (degraded.current) return;

    frameCount.current++;
    if (frameCount.current % 60 === 0) {
      const now = performance.now();
      const elapsed = now - lastTime.current;
      const fps = (60 * 1000) / elapsed;
      lastTime.current = now;

      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 3) {
        fpsHistory.current.shift();
      }

      // Check if avg FPS < 24 for 3 consecutive checks (3 seconds)
      if (fpsHistory.current.length >= 3) {
        const avgFPS =
          fpsHistory.current.reduce((a, b) => a + b, 0) /
          fpsHistory.current.length;
        if (avgFPS < 24) {
          degraded.current = true;
          setConfig((prev) => ({
            ...prev,
            particleCount: Math.floor(prev.particleCount * 0.6),
            bloom: false,
            glowMode: 'color',
          }));
          console.log('Performance reduced for smooth experience');
        }
      }
    }
  };

  return { tier, config, monitorFPS, TIERS };
}

export { TIERS, TIER_CONFIG };
export default useDeviceTier;
