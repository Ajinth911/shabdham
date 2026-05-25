import { useState, useCallback, useEffect, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import Scene from './components/Scene';
import LandingContent from './components/LandingContent';
import Subtitles from './components/Subtitles';
import UI from './components/UI';
import { useScroll } from './hooks/useScroll';
import { useDeviceTier } from './hooks/useDeviceTier';
import { useAudio } from './hooks/useAudio';
import { useImagePreloader } from './hooks/useImagePreloader';
import './App.css';

// Generate static list of 54 background image URLs
const BG_IMAGE_URLS = Array.from({ length: 54 }, (_, i) => {
  const num = String(i).padStart(3, '0');
  return `/bg/continue-the-smooth-cinematic-push-deeper-inside-t_${num}.webp`;
});

/**
 * SHABDAM — சப்தம்
 * An immersive antigravity particle experience
 * blending Tamil culture, AI presence, and cinematic storytelling.
 */
export default function App() {
  const [entered, setEntered] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const { tier, config, monitorFPS } = useDeviceTier();
  const {
    progress,
    getCameraZ,
    getCameraOrbitY,
    getParticleState,
    getFormationProgress,
    getGlowIntensity,
  } = useScroll();
  const {
    initAudio,
    startAmbient,
    syncVoiceWithScroll,
    toggleMute,
    isMuted,
    activeSubtitle,
  } = useAudio();


  // Preload all cinematic background frames
  const {
    progress: preloadProgress,
    loaded: preloadLoaded,
    images: preloadedImages,
  } = useImagePreloader(BG_IMAGE_URLS);

  // Derive states from scroll progress
  const particleState = getParticleState(progress);
  const formationProgress = getFormationProgress(progress);
  const glowIntensity = getGlowIntensity(progress);

  // Handle entry
  const handleEnter = useCallback(async () => {
    await initAudio();
    startAmbient();
    setEntered(true);
    setTimeout(() => setSceneReady(true), 100);
  }, [initAudio, startAmbient]);

  // Sync voice with scroll progress
  useEffect(() => {
    if (!entered) return;
    syncVoiceWithScroll(progress);
  }, [progress, entered, syncVoiceWithScroll]);

  // Pause animation when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Animation will pause naturally via RAF
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <>
      {/* Splash Screen */}
      {!entered && (
        <SplashScreen
          onEnter={handleEnter}
          preloadProgress={preloadProgress}
          preloadLoaded={preloadLoaded}
        />
      )}

      {/* Main Experience */}
      {entered && (
        <>
          {/* Scroll content — 600vh height driver */}
          <div id="scroll-driver" />

          {/* Fixed Scene */}
          <Scene
            scrollProgress={progress}
            getCameraZ={getCameraZ}
            getCameraOrbitY={getCameraOrbitY}
            particleState={particleState}
            formationProgress={formationProgress}
            glowIntensity={glowIntensity}
            config={config}
            preloadedImages={preloadedImages}
          />

          {/* Scrolling Landing Content Overlay */}
          <LandingContent scrollProgress={progress} />

          {/* Subtitles */}
          <Subtitles activeSubtitle={activeSubtitle} />

          {/* UI Overlay */}
          <UI
            isMuted={isMuted}
            onToggleMute={toggleMute}
            scrollProgress={progress}
            particleState={particleState}
          />
        </>
      )}
    </>
  );
}
