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
  const clipStopTimer = useRef(null);
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
   * Sync voice playhead and active subtitle continuously with scroll progress.
   * Automatically starts audio when scrolling occurs and pauses after scrolling stops.
   */
  const syncVoiceWithScroll = useCallback((progress) => {
    if (!audioEl.current) return;
    const el = audioEl.current;

    // Wait until metadata has loaded and duration is known
    if (!el.duration || isNaN(el.duration)) return;

    // Map scroll progress (0.0 to 1.0) directly to the audio track duration
    const targetTime = Math.max(0, Math.min(progress * el.duration, el.duration));

    // Seek to the calculated target time
    el.currentTime = targetTime;

    // Play if paused (and not muted)
    if (el.paused && !isMutedRef.current) {
      el.play().catch((err) => {
        console.warn('[useAudio] play() failed during scroll sync:', err);
      });
    }

    // Identify and display the correct subtitle matching this playhead timestamp
    const currentSection = subtitleData.sections.find(
      (section) =>
        targetTime >= section.startTime &&
        (section.endTime === null || section.endTime === undefined || targetTime < section.endTime)
    );

    if (currentSection) {
      setActiveSubtitle({
        tamil: currentSection.tamil,
        romanized: currentSection.romanized,
      });
    } else {
      setActiveSubtitle(null);
    }

    // Reset the pause timeout: if no new scroll event is received in 150ms, pause the audio
    if (clipStopTimer.current) {
      clearTimeout(clipStopTimer.current);
    }
    clipStopTimer.current = setTimeout(() => {
      if (audioEl.current && !audioEl.current.paused) {
        audioEl.current.pause();
      }
    }, 150);
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
