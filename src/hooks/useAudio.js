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
  const playedSections = useRef(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(null);

  const audioEl = useRef(null);
  const clipStopTimer = useRef(null);
  const subtitleTimer = useRef(null);
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
   * Check scroll progress against section triggers.
   */
  const checkSectionTrigger = useCallback((scrollProgress) => {
    if (isMutedRef.current) return null;

    for (const section of subtitleData.sections) {
      if (
        !playedSections.current.has(section.id) &&
        scrollProgress >= section.trigger &&
        scrollProgress < section.trigger + 0.1
      ) {
        return section;
      }
    }
    return null;
  }, []);

  /**
   * Play the audio clip for this section and show its subtitle.
   * Uses the <audio> element: seeks to startTime, plays, pauses at endTime.
   */
  const playSection = useCallback((section) => {
    // Guard: only fire once per section
    if (playedSections.current.has(section.id)) return;
    if (!audioEl.current) return;

    playedSections.current.add(section.id);

    const el = audioEl.current;

    // Cancel any running clip stop timer
    if (clipStopTimer.current) {
      clearTimeout(clipStopTimer.current);
      clipStopTimer.current = null;
    }

    // Seek to the clip start and play
    el.currentTime = section.startTime;
    el.volume = isMutedRef.current ? 0 : 1;

    el.play().catch((err) => {
      console.warn('[useAudio] play() failed:', err);
    });

    // Stop at endTime — use timeupdate for accuracy (fires every ~16ms via rAF)
    // plus a setTimeout fallback with 200ms startup buffer
    if (section.endTime !== null && section.endTime !== undefined) {
      const stopAt = section.endTime;

      // timeupdate listener: pauses exactly when currentTime crosses endTime
      const onTimeUpdate = () => {
        if (el.currentTime >= stopAt) {
          el.pause();
          el.removeEventListener('timeupdate', onTimeUpdate);
          if (clipStopTimer.current) {
            clearTimeout(clipStopTimer.current);
            clipStopTimer.current = null;
          }
        }
      };
      el.addEventListener('timeupdate', onTimeUpdate);

      // Fallback: 200ms startup buffer + clip duration
      const clipMs = (stopAt - section.startTime) * 1000;
      clipStopTimer.current = setTimeout(() => {
        el.pause();
        el.removeEventListener('timeupdate', onTimeUpdate);
        clipStopTimer.current = null;
      }, clipMs + 200);
    }

    // Show subtitle
    if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
    setActiveSubtitle({ tamil: section.tamil, romanized: section.romanized });

    subtitleTimer.current = setTimeout(() => {
      setActiveSubtitle(null);
    }, (section.duration || 3000) + 500);

    return true;
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
    checkSectionTrigger,
    playSection,
    toggleMute,
    isMuted,
    activeSubtitle,
  };
}

export default useAudio;
