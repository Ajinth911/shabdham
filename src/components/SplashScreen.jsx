import { useState, useEffect, useRef, useCallback } from 'react';
import './SplashScreen.css';

/**
 * SplashScreen — The entrance ritual.
 * Black screen. "SHABDAM" letter by letter.
 * Tamil script below. Ambient hum. Loading.
 * When ready: "Enter" glows softly. Waiting.
 */
export default function SplashScreen({ onEnter, preloadProgress = 0, preloadLoaded = false }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | exiting | done
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [tamilVisible, setTamilVisible] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [enterVisible, setEnterVisible] = useState(false);
  const containerRef = useRef(null);

  const title = 'SHABDAM';

  // Letter-by-letter animation
  useEffect(() => {
    let letterIndex = 0;
    const interval = setInterval(() => {
      letterIndex++;
      setVisibleLetters(letterIndex);
      if (letterIndex >= title.length) {
        clearInterval(interval);
        // Show Tamil script after letters complete
        setTimeout(() => setTamilVisible(true), 400);
        // Mark intro animations as completed after a short delay
        setTimeout(() => {
          setIntroCompleted(true);
        }, 1500);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Transition to ready phase once both intro animations and asset preloading are complete
  useEffect(() => {
    if (introCompleted && preloadLoaded) {
      setPhase('ready');
      setEnterVisible(true);
    }
  }, [introCompleted, preloadLoaded]);

  const handleEnter = useCallback(() => {
    setPhase('exiting');
    setTimeout(() => {
      setPhase('done');
      onEnter();
    }, 1000);
  }, [onEnter]);

  if (phase === 'done') return null;

  return (
    <div
      ref={containerRef}
      id="splash-screen"
      onClick={phase === 'ready' ? handleEnter : undefined}
      className={`splash-screen ${phase === 'ready' ? 'ready' : ''} ${phase === 'exiting' ? 'exiting' : ''}`}
    >
      {/* Title: SHABDAM */}
      <h1 className="splash-title">
        {title.split('').map((letter, i) => (
          <span
            key={i}
            className={`splash-title-letter ${i < visibleLetters ? 'visible' : ''}`}
            style={{
              transitionDelay: `${i * 0.05}s`,
            }}
          >
            {letter}
          </span>
        ))}
      </h1>

      {/* Tamil script */}
      <p className={`splash-tamil ${tamilVisible ? 'visible' : ''}`}>
        சப்தம்
      </p>

      {/* Preload Progress Indicator */}
      {!enterVisible && (
        <div className="preload-container">
          {/* Sleek progress bar container */}
          <div className="preload-bar-bg">
            <div
              className="preload-bar-fill"
              style={{
                width: `${preloadProgress}%`,
              }}
            />
          </div>
          {/* Progress text */}
          <p className="preload-text">
            loading {preloadProgress}%
          </p>
        </div>
      )}

      {/* Enter prompt */}
      {enterVisible && (
        <p id="enter-prompt">
          enter
        </p>
      )}
    </div>
  );
}
