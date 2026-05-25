import { useState, useCallback } from 'react';
import './UI.css';

/**
 * UI — Mute button, CTA, and input field.
 * Minimal. She is the interface. This is just utility.
 */
export default function UI({
  isMuted,
  onToggleMute,
  scrollProgress,
  particleState,
}) {
  const [inputValue, setInputValue] = useState('');
  const showCTA = particleState === 'INVITATION';
  const showScrollHint = scrollProgress < 0.05;

  return (
    <>
      {/* Mute Button — always visible */}
      <button
        id="mute-button"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00D4FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {isMuted ? (
            // Flat line (muted)
            <line x1="4" y1="12" x2="20" y2="12" />
          ) : (
            // Sound wave
            <>
              <path d="M6 12 Q8 8, 10 6 Q12 4, 12 12 Q12 20, 10 18 Q8 16, 6 12Z" />
              <path d="M15 8 Q18 10, 18 12 Q18 14, 15 16" opacity="0.6" />
              <path d="M17 5 Q22 9, 22 12 Q22 15, 17 19" opacity="0.3" />
            </>
          )}
        </svg>
      </button>

      {/* Scroll Hint */}
      <div
        id="scroll-hint"
        className={showScrollHint ? 'visible' : ''}
      >
        <p className="scroll-hint-text">
          scroll to begin
        </p>
        {/* Scroll indicator line */}
        <div className="scroll-hint-line" />
      </div>

      {/* CTA — Invitation phase */}
      <div
        id="cta-section"
        className={showCTA ? 'visible' : ''}
      >
        {/* CTA Text */}
        <p className={`cta-text ${showCTA ? 'breathe-animation' : ''}`}>
          பேசலாம்
        </p>

        {/* Input field */}
        <div className="cta-input-container">
          <input
            id="voice-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="உங்கள் குரல்…"
          />
          {/* Glowing underline animation */}
          <div
            className="cta-input-glow"
            style={{
              width: inputValue ? '100%' : '0%',
            }}
          />
        </div>
      </div>

      {/* Progress indicator */}
      <div
        className="scroll-progress-container"
        style={{
          opacity: scrollProgress > 0.05 ? 0.3 : 0,
        }}
      >
        <div className="scroll-progress-bg">
          <div
            className="scroll-progress-fill"
            style={{
              height: `${scrollProgress * 100}%`,
            }}
          />
        </div>
      </div>
    </>
  );
}
