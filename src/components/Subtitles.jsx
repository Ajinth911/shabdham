import { useEffect, useRef, useState } from 'react';
import './Subtitles.css';

/**
 * Subtitles — Tamil text overlay.
 * Both Tamil script + romanized shown simultaneously.
 * Fades in 0.3s, fades out 0.5s after line ends.
 */
export default function Subtitles({ activeSubtitle }) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (activeSubtitle) {
      setContent(activeSubtitle);
      // Small delay for breath cue
      setTimeout(() => setVisible(true), 200);
    } else {
      setVisible(false);
      // Clear content after fade out
      timeoutRef.current = setTimeout(() => setContent(null), 500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeSubtitle]);

  if (!content) return null;

  return (
    <div
      id="subtitles"
      className={`subtitles-container ${visible ? 'visible' : ''}`}
    >
      {/* Tamil script */}
      <p className="subtitle-tamil">
        {content.tamil}
      </p>

      {/* Romanized */}
      <p className="subtitle-romanized">
        {content.romanized}
      </p>
    </div>
  );
}
