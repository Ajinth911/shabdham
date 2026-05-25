import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import StarDust from './StarDust';
import './Scene.css';

/**
 * CameraController — Handles scroll-driven camera movement.
 * Ultra smooth lerp, never snaps.
 */
function CameraController({ scrollProgress, getCameraZ, getCameraOrbitY, cameraOrbit }) {
  const { camera } = useThree();
  const targetZ = useRef(12);
  const targetOrbitY = useRef(0);

  useFrame(() => {
    targetZ.current = getCameraZ(scrollProgress);
    targetOrbitY.current = cameraOrbit ? getCameraOrbitY(scrollProgress) : 0;

    // Ultra smooth lerp (factor 0.03)
    camera.position.z += (targetZ.current - camera.position.z) * 0.03;

    // Orbit: rotate around Y axis
    if (cameraOrbit) {
      const orbitX = Math.sin(targetOrbitY.current) * camera.position.z;
      camera.position.x += (orbitX - camera.position.x) * 0.03;
    }

    camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * CursorTracker — Tracks cursor in 3D space for particle interaction.
 */
function CursorTracker({ onCursorUpdate }) {
  const { camera, viewport } = useThree();
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(performance.now());

  useFrame(({ pointer }) => {
    const now = performance.now();
    const elapsed = now - lastTime.current;

    if (elapsed > 33) {
      // Throttle to ~30fps
      const x = (pointer.x * viewport.width) / 2;
      const y = (pointer.y * viewport.height) / 2;

      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy) / (elapsed / 16.67);

      onCursorUpdate({ x, y }, speed);

      lastPos.current = { x, y };
      lastTime.current = now;
    }
  });

  return null;
}

/**
 * Scene — R3F canvas wrapper overlaying a 2D image sequence.
 */
export default function Scene({
  scrollProgress,
  getCameraZ,
  getCameraOrbitY,
  particleState,
  formationProgress,
  glowIntensity,
  config,
  preloadedImages,
}) {
  const [cursorPos, setCursorPos] = useState(null);
  const [cursorSpeed, setCursorSpeed] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  const canvas2dRef = useRef(null);

  const handleCursorUpdate = useCallback((pos, speed) => {
    setCursorPos(pos);
    setCursorSpeed(speed);
  }, []);

  const handlePointerDown = useCallback(() => setIsClicking(true), []);
  const handlePointerUp = useCallback(() => setIsClicking(false), []);

  // Emulate object-fit: cover for drawing the images to 2D canvas
  const drawImageCover = useCallback((ctx, img, width, height) => {
    if (!img) return;
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let dWidth, dHeight, dx, dy;

    if (imgRatio > canvasRatio) {
      dHeight = height;
      dWidth = height * imgRatio;
      dx = (width - dWidth) / 2;
      dy = 0;
    } else {
      dWidth = width;
      dHeight = width / imgRatio;
      dx = 0;
      dy = (height - dHeight) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, dx, dy, dWidth, dHeight);
  }, []);

  // Update canvas sizing and redraw on resize
  useEffect(() => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      if (preloadedImages && preloadedImages.length > 0) {
        const frameIndex = Math.min(
          preloadedImages.length - 1,
          Math.max(0, Math.floor(scrollProgress * preloadedImages.length))
        );
        const img = preloadedImages[frameIndex];
        if (img) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawImageCover(ctx, img, canvas.width, canvas.height);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [preloadedImages, scrollProgress, drawImageCover]);

  // Update frame drawn on scrollProgress changes
  useEffect(() => {
    if (!preloadedImages || preloadedImages.length === 0) return;
    const canvas = canvas2dRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameIndex = Math.min(
      preloadedImages.length - 1,
      Math.max(0, Math.floor(scrollProgress * preloadedImages.length))
    );
    const img = preloadedImages[frameIndex];
    if (img) {
      drawImageCover(ctx, img, canvas.width, canvas.height);
    }
  }, [scrollProgress, preloadedImages, drawImageCover]);

  return (
    <div
      id="scene-container"
      className="scene-container"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 2D Canvas for preloaded background image sequence */}
      <canvas
        ref={canvas2dRef}
        className="scene-canvas-2d"
      />

      {/* R3F WebGL Canvas for 3D overlay elements */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: false,
          alpha: true,      // Set to transparent
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,     // Disable depth since we only have StarDust now
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        className="scene-canvas-3d"
      >
        <CameraController
          scrollProgress={scrollProgress}
          getCameraZ={getCameraZ}
          getCameraOrbitY={getCameraOrbitY}
          cameraOrbit={config.cameraOrbit}
        />
        <CursorTracker onCursorUpdate={handleCursorUpdate} />
        <StarDust count={2000} />
      </Canvas>
    </div>
  );
}
