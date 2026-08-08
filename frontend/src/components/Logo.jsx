import React from "react";

/**
 * Nirvah mark — an open ring that never quite closes, with a spark
 * travelling the gap. Reads as "in motion" instead of "in a box",
 * which fits the full-circle-giving idea a lot better than a flat
 * icon glyph does.
 *
 * variant: "mono" for a single flat color (footers, dark chrome),
 * "gradient" for the ember-to-gold treatment used in the nav.
 */
export default function Logo({ size = 34, variant = "gradient", animated = true, className = "" }) {
  const id = React.useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`nv-logo-mark ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`nvLogoGrad-${id}`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <filter id={`nvLogoGlow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the ring: open at the top-right, ~300 degrees of a circle */}
      <path
        id={`nvRing-${id}`}
        d="M 27.7 8.6 A 14 14 1 1 0 31.4 27.7"
        stroke={variant === "gradient" ? `url(#nvLogoGrad-${id})` : "currentColor"}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* the spark, travelling the ring and leaping the gap */}
      <g filter={`url(#nvLogoGlow-${id})`}>
        {animated ? (
          <circle r="3.1" fill={variant === "gradient" ? "#6EE7B7" : "currentColor"}>
            <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto">
              <mpath xlinkHref={`#nvRing-${id}`} />
            </animateMotion>
          </circle>
        ) : (
          <circle cx="27.7" cy="8.6" r="3.1" fill={variant === "gradient" ? "#6EE7B7" : "currentColor"} />
        )}
      </g>
    </svg>
  );
}
