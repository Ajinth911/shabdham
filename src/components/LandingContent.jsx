import React, { useMemo } from 'react';
import './LandingContent.css';

/**
 * LandingContent — A scroll-driven cinematic typography overlay.
 * Features large typography and a left-aligned vignette gradient for readability.
 */
export default function LandingContent({ scrollProgress }) {
  // Define content sections with scroll ranges
  const slides = useMemo(() => [
    {
      id: 1,
      start: 0.02,
      end: 0.22,
      kicker: "THE VOICE EXPERIENCE",
      heading: "SHABDHAM",
      subheading: "சப்தம்",
      description: "An immersive, AI-powered voice outreach experience blending natural Tamil presence and state-of-the-art marketing automation.",
    },
    {
      id: 2,
      start: 0.28,
      end: 0.58,
      kicker: "ALWAYS ON, ALWAYS WORKING",
      heading: "Your AI Marketing Agent",
      description: "Shabdham is an AI-powered marketing platform that automates outreach through intelligent voice calls and personalized messages.",
    },
    {
      id: 3,
      start: 0.62,
      end: 0.82,
      kicker: "NURTURE & QUALIFY LEADS",
      heading: "24/7 Funnel Automation",
      description: "It engages your leads 24/7, qualifies prospects, and nurtures them through your funnel — without adding headcount.",
    },
    {
      id: 4,
      start: 0.86,
      end: 1.0,
      kicker: "GET STARTED",
      heading: "வாங்க சேர்ந்து பேசலாம்",
      description: "Ready to scale your marketing? Speak or type in the console below to begin your consultation.",
    },
  ], []);

  // Compute inline styles for smooth scroll-synced transitions
  const getSlideStyle = (progress, start, end) => {
    const fadeInLength = 0.06;
    const fadeOutLength = 0.06;

    let opacity = 0;
    let translateY = 30; // More pronounced slide up

    if (progress >= start && progress <= end) {
      if (progress < start + fadeInLength) {
        // Fade in phase
        const t = (progress - start) / fadeInLength;
        opacity = t;
        translateY = 30 * (1 - t);
      } else if (progress > end - fadeOutLength) {
        // Fade out phase
        const t = (end - progress) / fadeOutLength;
        opacity = t;
        translateY = -30 * (1 - t); // Slide up and out
      } else {
        // Active display phase
        opacity = 1;
        translateY = 0;
      }
    }

    return {
      opacity,
      transform: `translateY(${translateY}px)`,
      pointerEvents: opacity > 0.1 ? 'auto' : 'none',
    };
  };

  return (
    <div id="landing-content-container">
      <div className="landing-inner">
        {slides.map((slide) => {
          const dynamicStyle = getSlideStyle(scrollProgress, slide.start, slide.end);
          return (
            <div
              key={slide.id}
              className="landing-slide"
              style={dynamicStyle}
            >
              {/* Kicker */}
              {slide.kicker && (
                <span className="slide-kicker">
                  {slide.kicker}
                </span>
              )}

              {/* Heading */}
              <h2 className={`slide-heading ${slide.heading === "SHABDHAM" ? 'shabdham' : 'standard'}`}>
                {slide.heading}
              </h2>

              {/* Subheading (Tamil text) */}
              {slide.subheading && (
                <h3 className="slide-subheading">
                  {slide.subheading}
                </h3>
              )}

              {/* Description */}
              <p className={`slide-description ${slide.id === 4 ? 'tamil-font' : 'garamond-font'}`}>
                {slide.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
