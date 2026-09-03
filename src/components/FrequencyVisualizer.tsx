/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, Text, IconButton, Icon, useTheme } from "@bug-on/m3-expressive";
import { useLanguage } from "../i18n/LanguageContext";

export interface FrequencyVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
  height?: number;
  showMetrics?: boolean;
  showBands?: boolean;
  initialMode?: "bars" | "wave";
}

interface BandEnergy {
  bass: number;     // 20 - 250 Hz
  lowMid: number;   // 250 - 1000 Hz
  highMid: number;  // 1000 - 4000 Hz
  treble: number;   // 4000 - 20000 Hz
}

export function FrequencyVisualizer({
  analyserNode,
  isPlaying,
  className = "",
  height = 130,
  showMetrics = true,
  showBands = true,
  initialMode = "bars",
}: FrequencyVisualizerProps) {
  const { language } = useLanguage();
  const { effectiveMode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [mode, setMode] = useState<"bars" | "wave">(initialMode);
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [peakDb, setPeakDb] = useState<number>(-90);
  const [bandEnergy, setBandEnergy] = useState<BandEnergy>({
    bass: 0,
    lowMid: 0,
    highMid: 0,
    treble: 0,
  });

  // Track peak cap positions for each bar to simulate studio hardware meters
  const peakCapsRef = useRef<number[]>([]);
  const peakCapDecayRef = useRef<number[]>([]);

  // Format frequency to human-readable string
  const formatFreq = useCallback((hz: number) => {
    if (hz < 1000) {
      return `${Math.round(hz)} Hz`;
    }
    return `${(hz / 1000).toFixed(1)} kHz`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    let idleAngle = 0;

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = height;

      // Fetch dynamic M3 colors
      const isDark = effectiveMode === "dark";
      const compStyle = window.getComputedStyle(canvas);
      const primaryColor = compStyle.getPropertyValue("--md-sys-color-primary").trim() || (isDark ? "#D0BCFF" : "#6750A4");
      const tertiaryColor = compStyle.getPropertyValue("--md-sys-color-tertiary").trim() || (isDark ? "#EFB8C8" : "#7D5260");
      const secondaryColor = compStyle.getPropertyValue("--md-sys-color-secondary").trim() || (isDark ? "#CCC2DC" : "#625B71");
      const outlineColor = compStyle.getPropertyValue("--md-sys-color-outline-variant").trim() || (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)");

      ctx.clearRect(0, 0, w, h);

      // Draw subtle background grid lines
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 0.5;
      for (let y = 0.25; y <= 0.75; y += 0.25) {
        ctx.beginPath();
        ctx.moveTo(0, h * y);
        ctx.lineTo(w, h * y);
        ctx.stroke();
      }

      if (isPlaying && analyserNode) {
        const bufferLength = analyserNode.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(freqData);

        const sampleRate = analyserNode.context.sampleRate;
        const nyquist = sampleRate / 2;

        // Calculate peak frequency and 4-band energies
        let maxVal = 0;
        let maxIndex = 0;
        let bassSum = 0, bassCount = 0;
        let lowMidSum = 0, lowMidCount = 0;
        let highMidSum = 0, highMidCount = 0;
        let trebleSum = 0, trebleCount = 0;

        for (let i = 0; i < bufferLength; i++) {
          const val = freqData[i];
          const binFreq = (i / bufferLength) * nyquist;

          if (val > maxVal) {
            maxVal = val;
            maxIndex = i;
          }

          if (binFreq >= 20 && binFreq < 250) {
            bassSum += val;
            bassCount++;
          } else if (binFreq >= 250 && binFreq < 1000) {
            lowMidSum += val;
            lowMidCount++;
          } else if (binFreq >= 1000 && binFreq < 4000) {
            highMidSum += val;
            highMidCount++;
          } else if (binFreq >= 4000 && binFreq <= 20000) {
            trebleSum += val;
            trebleCount++;
          }
        }

        const detectedPeak = (maxIndex / bufferLength) * nyquist;
        const calculatedDb = maxVal > 0 ? Math.round((maxVal / 255) * 60 - 60) : -90;

        setPeakFreq(detectedPeak);
        setPeakDb(calculatedDb);
        setBandEnergy({
          bass: bassCount > 0 ? Math.min(100, Math.round((bassSum / (bassCount * 255)) * 100)) : 0,
          lowMid: lowMidCount > 0 ? Math.min(100, Math.round((lowMidSum / (lowMidCount * 255)) * 100)) : 0,
          highMid: highMidCount > 0 ? Math.min(100, Math.round((highMidSum / (highMidCount * 255)) * 100)) : 0,
          treble: trebleCount > 0 ? Math.min(100, Math.round((trebleSum / (trebleCount * 255)) * 100)) : 0,
        });

        if (mode === "bars") {
          // Render Equalizer Spectrum Bars with Peak Falloff
          const barCount = 48;
          const barSpacing = 2;
          const totalSpacing = (barCount - 1) * barSpacing;
          const barWidth = Math.max(2, (w - totalSpacing) / barCount);

          if (peakCapsRef.current.length !== barCount) {
            peakCapsRef.current = new Array(barCount).fill(0);
            peakCapDecayRef.current = new Array(barCount).fill(0);
          }

          // Generate gradient
          const gradient = ctx.createLinearGradient(0, h, 0, 0);
          gradient.addColorStop(0, primaryColor);
          gradient.addColorStop(0.65, tertiaryColor);
          gradient.addColorStop(1, isDark ? "#F48FB1" : "#D81B60");

          for (let i = 0; i < barCount; i++) {
            // Logarithmic/perceptual frequency bin distribution
            const logRatio = Math.pow(i / barCount, 1.8);
            const dataIndex = Math.min(
              bufferLength - 1,
              Math.floor(logRatio * (bufferLength * 0.85))
            );
            const value = freqData[dataIndex] || 0;
            const normalizedHeight = (value / 255) * (h - 16);
            const barHeight = Math.max(2, normalizedHeight);
            const x = i * (barWidth + barSpacing);
            const y = h - barHeight - 4;

            // Draw bar with subtle rounded top
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();

            // Update and draw floating peak cap
            if (barHeight >= peakCapsRef.current[i]) {
              peakCapsRef.current[i] = barHeight;
              peakCapDecayRef.current[i] = 0;
            } else {
              peakCapDecayRef.current[i] += 0.25;
              peakCapsRef.current[i] = Math.max(0, peakCapsRef.current[i] - peakCapDecayRef.current[i]);
            }

            const capY = h - peakCapsRef.current[i] - 6;
            ctx.fillStyle = tertiaryColor;
            ctx.fillRect(x, Math.max(2, capY), barWidth, 2);
          }
        } else {
          // Waveform Curve / Smooth Oscilloscope Mode
          const timeData = new Uint8Array(bufferLength);
          analyserNode.getByteTimeDomainData(timeData);

          const waveGradient = ctx.createLinearGradient(0, 0, 0, h);
          waveGradient.addColorStop(0, isDark ? "rgba(208, 188, 255, 0.45)" : "rgba(103, 80, 164, 0.35)");
          waveGradient.addColorStop(0.7, isDark ? "rgba(239, 184, 200, 0.2)" : "rgba(125, 82, 96, 0.15)");
          waveGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.beginPath();
          const sliceWidth = w / bufferLength;
          let currentX = 0;

          ctx.moveTo(0, h / 2);
          for (let i = 0; i < bufferLength; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * (h - 20)) / 2 + 10;

            if (i === 0) {
              ctx.moveTo(currentX, y);
            } else {
              ctx.lineTo(currentX, y);
            }
            currentX += sliceWidth;
          }

          // Stroke line
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Fill underneath
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fillStyle = waveGradient;
          ctx.fill();
        }
      } else {
        // Idle / Paused ambient standby wave
        idleAngle += 0.03;
        ctx.beginPath();
        const baseLine = h / 2;
        ctx.moveTo(0, baseLine);

        for (let x = 0; x <= w; x += 4) {
          const wave1 = Math.sin((x * 0.015) + idleAngle) * 6;
          const wave2 = Math.cos((x * 0.03) - (idleAngle * 0.8)) * 3;
          ctx.lineTo(x, baseLine + wave1 + wave2);
        }

        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying, mode, height, effectiveMode]);

  return (
    <Card
      variant="outlined"
      ref={containerRef}
      className={`relative p-3.5 bg-m3-surface-container-lowest/90 rounded-xl border border-m3-outline-variant/50 overflow-hidden flex flex-col gap-2.5 ${className}`}
    >
      {/* Top Header & Visualizer Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-m3-primary-container flex items-center justify-center text-m3-primary shrink-0">
            <Icon name={isPlaying ? "graphic_eq" : "equalizer"} size={16} className={isPlaying ? "animate-pulse" : ""} />
          </div>
          <div className="overflow-hidden min-w-0">
            <Text variant="label-md" className="font-semibold text-m3-on-surface truncate block">
              {language === "vi" ? "Phổ Tần Số Thời Gian Thực (Web Audio)" : "Real-time Frequency Spectrum"}
            </Text>
            <Text variant="label-sm" className="text-m3-on-surface-variant text-[11px] block">
              {isPlaying
                ? (language === "vi" ? "Đang phân tích phản hồi âm thanh 20Hz - 20kHz" : "Live acoustic FFT response 20Hz - 20kHz")
                : (language === "vi" ? "Sẵn sàng (Phát nhạc để kích hoạt)" : "Ready (Play track to activate)")}
            </Text>
          </div>
        </div>

        {/* Action Controls: Mode Switch & Peak Tag */}
        <div className="flex items-center gap-2">
          {isPlaying && peakFreq > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-m3-surface-container-high border border-m3-outline-variant/60 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-m3-primary animate-ping" />
              <span className="text-m3-on-surface-variant font-sans">{language === "vi" ? "Đỉnh:" : "Peak:"}</span>
              <span className="font-bold text-m3-primary">{formatFreq(peakFreq)}</span>
              <span className="text-m3-on-surface-variant/80">({peakDb} dB)</span>
            </div>
          )}

          <div className="flex items-center bg-m3-surface-container-high rounded-lg p-0.5 border border-m3-outline-variant/40">
            <IconButton
              size="xs"
              colorStyle={mode === "bars" ? "tonal" : "standard"}
              onClick={() => setMode("bars")}
              title={language === "vi" ? "Hiển thị dạng cột quang phổ (FFT)" : "Spectrum Bars mode"}
              aria-label="Spectrum Bars"
            >
              <Icon name="bar_chart" size={16} />
            </IconButton>
            <IconButton
              size="xs"
              colorStyle={mode === "wave" ? "tonal" : "standard"}
              onClick={() => setMode("wave")}
              title={language === "vi" ? "Hiển thị dạng sóng âm mượt" : "Wave curve mode"}
              aria-label="Waveform Curve"
            >
              <Icon name="waves" size={16} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Main Canvas Visualizer Screen */}
      <div className="relative rounded-lg overflow-hidden bg-m3-surface-container-low/60 border border-m3-outline-variant/30">
        <canvas
          ref={canvasRef}
          className="w-full block select-none"
          style={{ height: `${height}px` }}
        />

        {/* Frequency scale marks at bottom */}
        <div className="absolute bottom-1 left-2 right-2 flex justify-between items-center text-[10px] font-mono text-m3-on-surface-variant/70 pointer-events-none select-none">
          <span>60Hz</span>
          <span className="hidden sm:inline">250Hz</span>
          <span>1kHz</span>
          <span className="hidden sm:inline">4kHz</span>
          <span>16kHz+</span>
        </div>

        {/* Inactive overlay hint when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-m3-surface-container-lowest/25 backdrop-blur-[0.5px]">
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-m3-surface-container-high/90 text-m3-on-surface-variant border border-m3-outline-variant/50 shadow-xs">
              {language === "vi" ? "Nhấn Phát để xem chuyển động phổ tần số" : "Press Play to view real-time frequency"}
            </span>
          </div>
        )}
      </div>

      {/* 4-Band Acoustic Energy HUD */}
      {showBands && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-m3-on-surface-variant font-medium">Sub/Bass</span>
              <span className="font-mono font-bold text-m3-primary">{bandEnergy.bass}%</span>
            </div>
            <div className="w-full h-1.5 bg-m3-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-m3-primary transition-all duration-75 rounded-full"
                style={{ width: `${bandEnergy.bass}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2 rounded-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-m3-on-surface-variant font-medium">Low-Mid</span>
              <span className="font-mono font-bold text-m3-secondary">{bandEnergy.lowMid}%</span>
            </div>
            <div className="w-full h-1.5 bg-m3-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-m3-secondary transition-all duration-75 rounded-full"
                style={{ width: `${bandEnergy.lowMid}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2 rounded-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-m3-on-surface-variant font-medium">High-Mid</span>
              <span className="font-mono font-bold text-m3-tertiary">{bandEnergy.highMid}%</span>
            </div>
            <div className="w-full h-1.5 bg-m3-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-m3-tertiary transition-all duration-75 rounded-full"
                style={{ width: `${bandEnergy.highMid}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2 rounded-lg bg-m3-surface-container-high/40 border border-m3-outline-variant/20">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-m3-on-surface-variant font-medium">Treble</span>
              <span className="font-mono font-bold text-m3-primary">{bandEnergy.treble}%</span>
            </div>
            <div className="w-full h-1.5 bg-m3-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-m3-primary/80 transition-all duration-75 rounded-full"
                style={{ width: `${bandEnergy.treble}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
