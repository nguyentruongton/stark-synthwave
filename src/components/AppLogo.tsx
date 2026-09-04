/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from "react";
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
 * 3D Claymorphic Soundwave — dark graphite matte shell with luminous
 * indigo-to-cyan neon tube, matching public/icon.svg master vector.
 */
export function AppLogo({
  className,
  size = 36,
  interactive = false,
  onClick,
  title = "Stark Synthwave",
}: AppLogoProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none",
        interactive &&
          "cursor-pointer active:scale-95 hover:brightness-110 transition-all duration-200 group",
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
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "w-full h-full drop-shadow-sm transition-transform duration-200",
          interactive && "group-hover:scale-105"
        )}
      >
        <defs>
          {/* Dark Graphite Matte Shell — main body fill */}
          <linearGradient id={`${uid}-shell-body`} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%"   stopColor="#3A4150" />
            <stop offset="35%"  stopColor="#2A303C" />
            <stop offset="70%"  stopColor="#1E232C" />
            <stop offset="100%" stopColor="#141820" />
          </linearGradient>

          {/* Top specular — soft matte sheen */}
          <linearGradient id={`${uid}-shell-spec`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#6B7A90" stopOpacity="0.7" />
            <stop offset="40%"  stopColor="#485060" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E232C" stopOpacity="0" />
          </linearGradient>

          {/* Left edge rim catch-light */}
          <linearGradient id={`${uid}-shell-rim`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7A8CA0" stopOpacity="0.5" />
            <stop offset="30%"  stopColor="#485060" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1E232C" stopOpacity="0" />
          </linearGradient>

          {/* Groove shadow — recessed trench depth */}
          <linearGradient id={`${uid}-groove`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#080B10" />
            <stop offset="50%"  stopColor="#0D1119" />
            <stop offset="100%" stopColor="#13171F" />
          </linearGradient>

          {/* Groove ambient neon bounce-glow */}
          <radialGradient id={`${uid}-groove-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00C8FF" stopOpacity="0.18" />
            <stop offset="60%"  stopColor="#4F6EF5" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#0D1119"  stopOpacity="0" />
          </radialGradient>

          {/* Neon luminous tube — indigo to electric cyan */}
          <linearGradient id={`${uid}-neon-core`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#5865F2" />
            <stop offset="30%"  stopColor="#4F83EF" />
            <stop offset="55%"  stopColor="#0EA5E9" />
            <stop offset="80%"  stopColor="#00DEFF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Neon glow halo (diffuse underlay) */}
          <linearGradient id={`${uid}-neon-glow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4F6EF5" />
            <stop offset="50%"  stopColor="#00C8FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Neon core specular highlight */}
          <linearGradient id={`${uid}-neon-hl`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#AABFFF" />
            <stop offset="50%"  stopColor="#E8F8FF" />
            <stop offset="100%" stopColor="#B8EEFF" />
          </linearGradient>

          {/* Contact shadow */}
          <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#000307" stopOpacity="0.55" />
            <stop offset="60%"  stopColor="#000307" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000307" stopOpacity="0" />
          </radialGradient>

          {/* Clip path — organic acoustic waveform silhouette */}
          <clipPath id={`${uid}-clip`}>
            <path d="
              M 68 256
              C 68 176, 100 130, 140 118
              C 158 112, 170 108, 185 115
              C 195 120, 202 130, 210 128
              C 218 126, 226 112, 236 108
              C 246 104, 256 102, 266 106
              C 276 110, 284 124, 292 126
              C 300 128, 308 120, 318 116
              C 330 110, 345 112, 362 120
              C 400 136, 444 180, 444 256
              C 444 332, 400 376, 362 392
              C 345 400, 330 402, 318 396
              C 308 392, 300 384, 292 386
              C 284 388, 276 402, 266 406
              C 256 410, 246 408, 236 404
              C 226 400, 218 386, 210 384
              C 202 382, 195 392, 185 397
              C 170 404, 158 400, 140 394
              C 100 382, 68 336, 68 256 Z
            " />
          </clipPath>
        </defs>

        {/* Contact shadow below icon */}
        <ellipse cx="256" cy="460" rx="165" ry="26" fill={`url(#${uid}-shadow)`} />

        {/* ── Outer Shell — Organic Acoustic Silhouette ── */}
        <path
          d="M 68 256 C 68 176, 100 130, 140 118 C 158 112, 170 108, 185 115 C 195 120, 202 130, 210 128 C 218 126, 226 112, 236 108 C 246 104, 256 102, 266 106 C 276 110, 284 124, 292 126 C 300 128, 308 120, 318 116 C 330 110, 345 112, 362 120 C 400 136, 444 180, 444 256 C 444 332, 400 376, 362 392 C 345 400, 330 402, 318 396 C 308 392, 300 384, 292 386 C 284 388, 276 402, 266 406 C 256 410, 246 408, 236 404 C 226 400, 218 386, 210 384 C 202 382, 195 392, 185 397 C 170 404, 158 400, 140 394 C 100 382, 68 336, 68 256 Z"
          fill={`url(#${uid}-shell-body)`}
        />

        {/* Top surface specular sheen */}
        <path
          d="M 68 256 C 68 176, 100 130, 140 118 C 158 112, 170 108, 185 115 C 195 120, 202 130, 210 128 C 218 126, 226 112, 236 108 C 246 104, 256 102, 266 106 C 276 110, 284 124, 292 126 C 300 128, 308 120, 318 116 C 330 110, 345 112, 362 120 C 400 136, 444 180, 444 256 L 68 256 Z"
          fill={`url(#${uid}-shell-spec)`}
        />

        {/* Left rim catch-light */}
        <path
          d="M 68 256 C 68 200, 88 160, 115 138 C 125 130, 135 124, 140 118 C 158 112, 170 108, 185 115 C 195 120, 202 130, 210 128 L 140 256 Z"
          fill={`url(#${uid}-shell-rim)`}
          opacity={0.6}
        />

        {/* ── Recessed Inner Groove ── */}
        <path
          d="M 100 256 C 100 196, 124 157, 155 146 C 167 142, 178 141, 190 148 C 200 154, 206 165, 213 164 C 220 163, 229 150, 240 147 C 248 144, 256 143, 264 146 C 272 149, 281 162, 288 163 C 295 164, 302 155, 313 150 C 324 144, 337 143, 350 149 C 380 162, 412 198, 412 256 C 412 314, 380 350, 350 363 C 337 369, 324 368, 313 362 C 302 357, 295 348, 288 349 C 281 350, 272 363, 264 366 C 256 369, 248 368, 240 365 C 229 362, 220 349, 213 348 C 206 347, 200 358, 190 364 C 178 371, 167 370, 155 366 C 124 355, 100 316, 100 256 Z"
          fill={`url(#${uid}-groove)`}
        />

        {/* Groove ambient neon glow */}
        <path
          d="M 108 256 C 108 200, 130 163, 158 152 C 169 148, 179 148, 191 154 C 200 159, 206 168, 213 167 C 220 166, 229 154, 240 151 C 248 148, 256 147, 264 150 C 272 153, 281 165, 288 166 C 295 167, 303 158, 314 153 C 325 148, 337 148, 349 154 C 377 166, 404 200, 404 256 C 404 312, 377 346, 349 358 C 337 364, 325 364, 314 359 C 303 354, 295 345, 288 346 C 281 347, 272 359, 264 362 C 256 365, 248 364, 240 361 C 229 358, 220 346, 213 345 C 206 344, 200 353, 191 358 C 179 364, 169 364, 158 360 C 130 349, 108 312, 108 256 Z"
          fill={`url(#${uid}-groove-glow)`}
        />

        {/* ── Neon Luminous Waveform Tube ── */}
        {/* Wide diffuse glow halo */}
        <path
          d="M 116 256 C 150 166, 196 166, 222 256 C 248 346, 294 346, 328 256 C 352 196, 380 196, 396 256"
          fill="none"
          stroke={`url(#${uid}-neon-glow)`}
          strokeWidth="52"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.28}
          clipPath={`url(#${uid}-clip)`}
        />
        {/* Medium bloom */}
        <path
          d="M 116 256 C 150 166, 196 166, 222 256 C 248 346, 294 346, 328 256 C 352 196, 380 196, 396 256"
          fill="none"
          stroke={`url(#${uid}-neon-glow)`}
          strokeWidth="32"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.45}
          clipPath={`url(#${uid}-clip)`}
        />
        {/* Core tube */}
        <path
          d="M 116 256 C 150 166, 196 166, 222 256 C 248 346, 294 346, 328 256 C 352 196, 380 196, 396 256"
          fill="none"
          stroke={`url(#${uid}-neon-core)`}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath={`url(#${uid}-clip)`}
        />
        {/* Specular highlight on tube surface */}
        <path
          d="M 116 256 C 150 166, 196 166, 222 256 C 248 346, 294 346, 328 256 C 352 196, 380 196, 396 256"
          fill="none"
          stroke={`url(#${uid}-neon-hl)`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.75}
          clipPath={`url(#${uid}-clip)`}
        />

        {/* ── Surface Micro-detail — Ridge catch-light lines ── */}
        <path
          d="M 150 136 C 170 122, 185 118, 200 122 C 210 125, 218 132, 228 130 C 238 128, 246 116, 256 114 C 266 112, 274 124, 282 128 C 292 132, 306 124, 320 118 C 338 112, 355 116, 370 128"
          fill="none"
          stroke="#7A8CA0"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.5}
        />
        <path
          d="M 150 376 C 170 390, 185 394, 200 390 C 210 387, 218 380, 228 382 C 238 384, 246 396, 256 398 C 266 400, 274 388, 282 384 C 292 380, 306 388, 320 394 C 338 400, 355 396, 370 384"
          fill="none"
          stroke="#38414F"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.4}
        />
      </svg>
    </div>
  );
}
