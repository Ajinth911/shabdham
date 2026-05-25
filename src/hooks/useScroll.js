import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Scroll progress hook.
 * Tracks normalized scroll position (0.0 to 1.0) across 600vh.
 * Uses requestAnimationFrame for smooth lerped values.
 */
export function useScroll() {
  const [progress, setProgress] = useState(0);
  const rawProgress = useRef(0);
  const lerpedProgress = useRef(0);
  const rafId = useRef(null);

  useEffect(() => {
    const updateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      rawProgress.current = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    };

    const animate = () => {
      // Lerp toward raw progress — ultra smooth
      lerpedProgress.current +=
        (rawProgress.current - lerpedProgress.current) * 0.06;
      setProgress(lerpedProgress.current);
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  /**
   * Get the camera Z position based on scroll progress
   */
  const getCameraZ = useCallback((p) => {
    if (p < 0.10) return 12;
    if (p < 0.35) {
      const t = (p - 0.10) / 0.25;
      return 12 + (6 - 12) * easeOutExpo(t);
    }
    if (p < 0.50) return 6;
    if (p < 0.65) return 6;
    if (p < 0.80) {
      const t = (p - 0.65) / 0.15;
      return 6 + (8 - 6) * easeOutExpo(t);
    }
    return 7;
  }, []);

  /**
   * Get camera orbit angle based on scroll
   */
  const getCameraOrbitY = useCallback((p) => {
    if (p < 0.50) return 0;
    if (p < 0.65) {
      const t = (p - 0.50) / 0.15;
      return 15 * easeOutExpo(t) * (Math.PI / 180);
    }
    if (p < 0.80) return 15 * (Math.PI / 180);
    // Return to center
    const t = (p - 0.80) / 0.20;
    return 15 * (1 - easeOutExpo(t)) * (Math.PI / 180);
  }, []);

  /**
   * Get particle state based on scroll
   */
  const getParticleState = useCallback((p) => {
    if (p < 0.12) return 'SCATTERED';
    if (p < 0.40) return 'FORMING';
    if (p < 0.75) return 'FORMED';
    if (p < 0.88) return 'SPEAKING';
    return 'INVITATION';
  }, []);

  /**
   * Get formation progress (0-1) within FORMING phase
   */
  const getFormationProgress = useCallback((p) => {
    if (p < 0.12) return 0;
    if (p > 0.40) return 1;
    return easeOutExpo((p - 0.12) / 0.28);
  }, []);

  /**
   * Get glow intensity based on scroll
   */
  const getGlowIntensity = useCallback((p) => {
    if (p < 0.40) return p / 0.40 * 0.3;
    if (p < 0.65) return 0.3 + ((p - 0.40) / 0.25) * 0.7;
    if (p < 0.88) return 1.0;
    return 0.8 + Math.sin(p * Math.PI * 2) * 0.1;
  }, []);

  return {
    progress,
    getCameraZ,
    getCameraOrbitY,
    getParticleState,
    getFormationProgress,
    getGlowIntensity,
  };
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default useScroll;
