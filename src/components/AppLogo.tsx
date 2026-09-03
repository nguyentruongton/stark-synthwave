/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { cn } from "@bug-on/m3-expressive";

interface AppLogoProps {
  className?: string;
  size?: number;
  interactive?: boolean;
  onClick?: () => void;
  title?: string;
}

/**
 * Stark Synthwave Brand Logo Component
 * Renders a stylized synthwave audio cassette / waveform neon icon.
 */
export function AppLogo({
  className,
  size = 36,
  interactive = false,
  onClick,
  title = "Stark Synthwave",
}: AppLogoProps) {
  const content = (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none",
        interactive && "cursor-pointer active:scale-95 transition-transform duration-150",
        className
      )}
      style={{ width: size, height: size }}
      onClick={interactive ? onClick : undefined}
      title={title}
      aria-label={title}
      role={interactive ? "button" : "img"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200"
      >
        <defs>
          <linearGradient id="sw-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--md-sys-color-primary, #795290)" />
            <stop offset="100%" stopColor="var(--md-sys-color-tertiary, #9C4146)" />
          </linearGradient>
          <linearGradient id="sw-grad-wave" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--md-sys-color-secondary, #625B71)" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary, #D0BCFF)" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Shield / Hexagon-Squircle */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="12"
          fill="url(#sw-grad-primary)"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-m3-primary/60"
        />

        {/* Cassette / Synth Audio Bars */}
        <rect
          x="11"
          y="23"
          width="3.5"
          height="11"
          rx="1.75"
          fill="currentColor"
          className="text-m3-primary"
        />
        <rect
          x="17"
          y="15"
          width="3.5"
          height="19"
          rx="1.75"
          fill="currentColor"
          className="text-m3-primary"
        />
        <rect
          x="23"
          y="10"
          width="3.5"
          height="24"
          rx="1.75"
          fill="currentColor"
          className="text-m3-primary"
        />
        <rect
          x="29"
          y="16"
          width="3.5"
          height="18"
          rx="1.75"
          fill="currentColor"
          className="text-m3-primary"
        />
        <rect
          x="35"
          y="21"
          width="3.5"
          height="13"
          rx="1.75"
          fill="currentColor"
          className="text-m3-primary"
        />

        {/* Synthwave horizon bar accent */}
        <path
          d="M8 38H40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-m3-tertiary/70"
        />
      </svg>
    </div>
  );

  return content;
}
