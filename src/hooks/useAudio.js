import { useRef, useCallback, useState } from 'react';
import subtitleData from '../data/subtitles.json';
import shabdhamAudio from '../audio/shabdham.mp3';

/**
 * Audio management hook.
 *
 * Voice: HTML <audio> element — most reliable cross-browser approach.
 *   Seeks to startTime, plays clip, pauses at endTime.
 *
 * Ambient: Web Audio API oscillator (40 Hz hum).
 *
 * Clips fire ONLY on scroll triggers. Each section plays ONCE per session.
 */
export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(null);

  const audioEl = useRef(null);
  const hasStartedRef = useRef(false);
  const isMutedRef = useRef(false);

  // Web Audio API — ambient only
  const audioCtx = useRef(null);
  const gainNode = useRef(null);
  const ambientOsc = useRef(null);

  /**
   * Called on Enter (user gesture).
   * Creates the <audio> element and unlocks it for later play() calls.
   */
  const initAudio = useCallback(async () => {
    // Create and preload the audio element
    if (!audioEl.current) {
      const el = new Audio(shabdhamAudio);
      el.preload = 'auto';
      el.volume = 1;
      // Load it silently so it's buffered and ready
      el.load();

      // Listen to timeupdate to update active subtitle dynamically in sync with the playhead!
      el.addEventListener('timeupdate', () => {
        const time = el.currentTime;
        const currentSection = subtitleData.sections.find(
          (section) =>
            time >= section.startTime &&
            (section.endTime === null || section.endTime === undefined || time < section.endTime)
        );
        if (currentSection) {
          setActiveSubtitle({
            tamil: currentSection.tamil,
            romanized: currentSection.romanized,
          });
        } else {
          setActiveSubtitle(null);
        }
      });

      audioEl.current = el;
    }

    // Set up Web Audio API for ambient hum
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNode.current = audioCtx.current.createGain();
      gainNode.current.gain.value = 1.0;
      gainNode.current.connect(audioCtx.current.destination);
    }

    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }
  }, []);

  /**
   * Start the ambient 40 Hz sine hum. Called after Enter.
   */
  const startAmbient = useCallback(() => {
    if (!audioCtx.current || ambientOsc.current) return;

    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const aGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    aGain.gain.setValueAtTime(0, ctx.currentTime);
    aGain.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 3);

    osc.connect(aGain);
    aGain.connect(gainNode.current);
    osc.start();

    ambientOsc.current = { osc, aGain };
  }, []);

  /**
   * Triggers the continuous full voice audio to play once the user starts scrolling.
   */
  const syncVoiceWithScroll = useCallback((progress) => {
    if (!audioEl.current) return;
    const el = audioEl.current;

    // If progress is greater than a small threshold and we haven't started playing yet, play the full audio!
    if (progress > 0.01 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      el.play().catch((err) => {
        console.warn('[useAudio] play() failed to start full audio:', err);
      });
    }
  }, []);

  /**
   * Toggle mute — silences both voice and ambient.
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      isMutedRef.current = newMuted;

      // Voice element
      if (audioEl.current) {
        audioEl.current.volume = newMuted ? 0 : 1;
      }

      // Ambient gain
      if (gainNode.current && audioCtx.current) {
        gainNode.current.gain.setTargetAtTime(
          newMuted ? 0 : 1.0,
          audioCtx.current.currentTime,
          0.1
        );
      }

      return newMuted;
    });
  }, []);

  return {
    initAudio,
    startAmbient,
    syncVoiceWithScroll,
    toggleMute,
    isMuted,
    activeSubtitle,
  };
}

export default useAudio;
