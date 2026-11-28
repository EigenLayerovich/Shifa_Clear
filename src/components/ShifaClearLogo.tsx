'use client';

import React from 'react';

interface ShifaClearLogoProps {
  size?: number;
  className?: string;
}

/**
 * Bespoke ShifaClear geometric brand mark:
 * Deep botanical teal squircle, subtle Abu Dhabi arch silhouette,
 * crisp alabaster pulse wave, and a warm-sand clarity accent dot.
 */
export function ShifaClearLogo({ size = 38, className = '' }: ShifaClearLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="shifaTileGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#127068" />
          <stop offset="100%" stopColor="#094540" />
        </linearGradient>
      </defs>

      {/* Deep botanical teal squircle with subtle warm-sand rim */}
      <rect width="40" height="40" rx="11" fill="url(#shifaTileGrad)" />
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="10.25"
        stroke="#E2CFA8"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />

      {/* Soft architectural clinic arch echoing the editorial hero */}
      <path
        d="M11 32V19.5C11 14.2533 15.0294 10 20 10C24.9706 10 29 14.2533 29 19.5V32H11Z"
        fill="#FAF9F6"
        fillOpacity="0.12"
      />

      {/* Crisp minimalist vital pulse wave */}
      <path
        d="M7.5 22.5H13.2L16.1 17.8L19.6 26.8L23.4 13.5L26.3 22.5H32.5"
        stroke="#FAF9F6"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Warm golden-sand clarity accent above peak */}
      <circle cx="23.4" cy="8.5" r="2.1" fill="#E2CFA8" />
    </svg>
  );
}
