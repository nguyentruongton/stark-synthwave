---
version: 1.1.0
name: Stark Synthwave Design Specification
description: Visual language and design tokens for Stark Synthwave in-browser audio suite with MD3 Expressive branding.
colors:
  background: "#0A0B0D"
  surface: "#141218"
  surface-container: "#1D1B20"
  primary: "#D0BCFF"
  primary-container: "#4F378B"
  secondary: "#CCC2DC"
  tertiary: "#EFB8C8"
  outline: "#938F99"
  outline-variant: "#49454F"
  brand-neon-pink: "#FF427F"
  brand-deep-violet: "#8B14CC"
  brand-neon-cyan: "#00F5FF"
  brand-dark-core: "#12062C"
  logo-bg-start: "#12062C"
  logo-bg-mid: "#231052"
  logo-bg-end: "#09031B"
  logo-sun-top: "#FFD15A"
  logo-sun-mid: "#FF6F91"
  logo-sun-bottom: "#D83BFF"
  logo-grid-horizontal: "#B342FF"
  logo-grid-perspective: "#2FE8FF"
  logo-note-cyan: "#00F5FF"
  logo-note-indigo: "#6C5CFF"
  logo-note-magenta: "#E43CFF"
  logo-note-pink: "#FF427F"
  logo-badge-ring-cyan: "#00F5FF"
  logo-badge-ring-indigo: "#7657FF"
  logo-badge-ring-pink: "#FF3DA5"
  logo-badge-core: "#13072D"
typography:
  headline-lg:
    fontFamily: Outfit, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  body-md:
    fontFamily: Roboto, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.01em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  app-logo:
    backgroundColor: "{colors.logo-bg-start}"
    rounded: "squircle-continuous-curvature"
    palette: "synthwave-sun + horizon-grid + dual-neon-notes + lossless-verified-badge"
    variants: ["full", "adaptive", "transparent"]
  navigation-rail:
    backgroundColor: "{colors.surface-container}"
    rounded: "0px"
---

# Stark Synthwave Design Specification

## Overview
Stark Synthwave combines high-performance audio processing with a tactile Synthwave aesthetic adhering to Google Material Design 3 Expressive principles.

## Colors & Iconography
- **Synthwave Cosmic Squircle:** Continuous curvature squircle gradient (`#12062C` → `#231052` → `#09031B`).
- **Retro Horizon & Sun:** Glowing sunset gradient (`#FFD15A` → `#FF6F91` → `#D83BFF`) over neon magenta (`#B342FF`) and cyber cyan (`#2FE8FF`) perspective grid lines.
- **Dual Beamed Musical Notes:** Luminous gradient tube bridging electric cyan (`#00F5FF`), indigo (`#6C5CFF`), neon magenta (`#E43CFF`), and hot pink (`#FF427F`).
- **Lossless Quality Badge:** Shield seal with tri-color ring (`#00F5FF` → `#7657FF` → `#FF3DA5`), dark obsidian core (`#13072D`), and crisp white checkmark.
- **Material Design 3 Expressive Adaptive Integration:**
  - `full`: Signature cosmic Synthwave squircle for standalone, splash, Apple touch icon, and prominent branding.
  - `adaptive`: Dynamically blends squircle container with MD3 surface container tokens (`var(--md-sys-color-surface-container)`).
  - `transparent`: Pure NoBG silhouette allowing direct integration on colored chips, cards, or hero banners.

## Shapes & Depth
- **App Logo:** Continuous squircle bounds with luminance mask clipping the horizon landscape.
- Pill and capsule shapes with ultra-smooth radii for other UI elements.
- Multi-stop linear gradients for rich retro-futuristic depth.
- High-contrast lossless verification checkmark for instantaneous recognition.
