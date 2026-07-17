
# Stark Synthwave

A modern, high-fidelity web application providing essential in-browser audio processing tools. Featuring a premium dark synthwave design unified around Material Design 3 Expressive guidelines, it is optimized for high-performance audio manipulation and analysis directly in the browser.

---

## 🎧 Features

Stark Synthwave is equipped with four core audio tools:

1. **Music Trim & Merge (Cắt Ghép)**
   - High-performance, client-side audio cutting and stitching.
   - Interactive timeline controls with precise time range selections.
   - Live Canvas-rendered waveform visualizations.
   - Exports output to WAV format.

2. **Lossless Quality Checker**
   - Real-time audio spectral and decibel frequency analysis.
   - Visualizes frequency distribution (up to 22kHz) and signal intensity (dB) on a custom canvas.
   - Verifies whether an audio file is authentic lossless quality or upscaled from lossy codecs (like MP3).

3. **Tempo Detector**
   - Automated beat detection algorithm estimating beats-per-minute (BPM) of music files.
   - Displays real-time calculations.

4. **Tone Detector (Dò Tone)**
   - Pitch and key/scale detection using Chromagram note-energy profiling.
   - Detailed visualizer mapping energy across the 12 chromatic musical notes.

---

## 🎨 Aesthetics & Design Spec

The application follows the **Material Design 3 Expressive** guidelines with a dark synthwave theme:
- **Primary Color:** Vibrant neon lavender (`#D0BCFF`) representing primary actions and active state highlights.
- **Background:** Deep black-blue base (`#0A0B0D`) to ensure seamless layouts and eliminate visual gaps on all screen heights.
- **Surfaces:** Dark grey-violet (`#1C1B1E`) container panels with smooth glassmorphism borders.
- **Animations:** Dynamic transitions powered by Framer Motion (`motion/react`) for smooth tab-switching and interactive states.

---

## 🚀 Local Development

### Prerequisites
- **Node.js** (v18+)
- **Bun** (Recommended) or **npm**

### Step-by-Step Setup

1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd stark-synthwave
   ```

2. **Install dependencies:**
   Using Bun:
   ```bash
   bun install
   ```
   *Or using npm:*
   ```bash
   npm install
   ```

3. **Run the development server:**
   Using Bun:
   ```bash
   bun dev
   ```
   *Or using npm:*
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Lint and Type Check:**
   Verify code correctness by running the TypeScript compiler:
   ```bash
   bun run lint
   ```
   *Or using npm:*
   ```bash
   npm run lint
   ```

---

## 📦 Production & Deployment

### Build for Production
To bundle the application for production release:
```bash
bun run build
```
*Or using npm:*
```bash
npm run build
```
This builds static assets into the `dist/` directory.

### Deploying to GitHub Pages
Since the project is built with Vite, follow these steps to deploy to GitHub Pages:

1. **Configure the base path** in `vite.config.ts` if deploying to a subfolder (e.g. `username.github.io/stark-synthwave/`):
   ```typescript
   export default defineConfig({
     base: '/stark-synthwave/', // Set to repository name
     // ... rest of config
   })
   ```
2. Deploy the generated `dist/` folder manually or use a GitHub Action for Vite deployments (e.g., `peaceiris/actions-gh-pages`).

---

## 🤖 AI Agent Integration (AG Kit)

This repository includes an **AG Kit** developer agent configuration folder (`.agents/`). 
- **Compatibility:** This AG Kit is optimized specifically for **Gemini CLI** and **Google Antigravity** developer setups.
- **Workspace Memory:** Persistent project conventions are tracked under `.agents/memory/` to maintain consistent architectural styles, naming conventions, and constraints.

---

## 📄 License

This project is licensed under the Apache-2.0 License. See the header of source files for license notices.
