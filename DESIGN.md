---
version: 1.0.0
name: Stark Synthwave Design Specification
description: Visual language and design tokens for Stark Synthwave in-browser audio suite.
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
  brand-neon-pink: "#FF2D78"
  brand-deep-violet: "#8B14CC"
  brand-neon-cyan: "#00EEFF"
  brand-dark-core: "#16092E"
  logo-shell-base: "#2A303C"
  logo-shell-light: "#3A4150"
  logo-neon-indigo: "#5865F2"
  logo-neon-cyan: "#00DEFF"
  logo-neon-sky: "#38BDF8"
  logo-groove-floor: "#080B10"
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
    backgroundColor: "transparent"
    rounded: "organic-wave-silhouette"
    palette: "claymorphic-dark-graphite + neon-indigo-cyan"
  navigation-rail:
    backgroundColor: "{colors.surface-container}"
    rounded: "0px"
---

# Stark Synthwave Design Specification

## Overview
Stark Synthwave combines high-performance audio processing with a tactile Synthwave aesthetic adhering to Google Material Design 3 Expressive principles.

## Colors
- Primary neon magenta/pink (`#FF2D78`) and cyber cyan (`#00EEFF`) represent audio waveforms and energy.
- Deep violet (`#8B14CC`) and navy midnight (`#16092E`) create deep optical chambers.
- Background uses deep space black (`#0A0B0D`) to prevent visual seams and provide maximum contrast.
- **App Logo palette:** Dark graphite clay shell (`#2A303C`→`#141820`) with luminous neon tube gradient from Indigo (`#5865F2`) through Electric Cyan (`#00DEFF`) to Ice Blue (`#38BDF8`).

## Shapes & Depth
- **App Logo:** Organic acoustic waveform silhouette (claymorphic 3D clay-matte body with 5 wave peaks and recessed inner groove). No rectangular frame — fully organic outline.
- Pill and capsule shapes with ultra-smooth radii for other UI elements.
- Layered multi-stop gradients for 3D tactile depth without harsh black shadows.
- Ambient bounce lighting from neon glow hashes into surrounding matte cavity.
