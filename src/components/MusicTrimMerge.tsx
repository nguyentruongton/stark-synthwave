/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  RangeSlider,
  Slider,
  IconButton,
  Text,
  Divider,
  LoadingIndicator,
  Icon,
  useSnackbar,
} from "@bug-on/m3-expressive";
import { AudioTrack, ExportFormatId } from "../types";
import { safeDecodeAudioData } from "../utils/audioAnalysis";
import { exportAudioBuffer, EXPORT_FORMAT_OPTIONS } from "../utils/audioEncoder";
import { AUDIO_ACCEPT_STRING, detectAudioFormat, GLOBAL_AUDIO_FORMATS } from "../utils/audioFormats";
import { useLanguage } from "../i18n/LanguageContext";
import { AdaptiveScrollArea } from "./AdaptiveScrollArea";
import { FrequencyVisualizer } from "./FrequencyVisualizer";

export function MusicTrimMerge() {
  const { showSnackbar } = useSnackbar();
  const { t, language } = useLanguage();
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [mergeQueue, setMergeQueue] = useState<AudioTrack[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormatId>("wav-16");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizerView, setVisualizerView] = useState<"both" | "waveform" | "spectrum">("both");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(640);
  const [cursorStyle, setCursorStyle] = useState<string>("pointer");

  const isPlayingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingHandleRef = useRef<"start" | "end" | null>(null);
  const zoomLevelRef = useRef<number>(1);
  zoomLevelRef.current = zoomLevel;

  const currentWaveformWidth = Math.max(300, Math.round(containerWidth * zoomLevel));

  const genId = () => Math.random().toString(36).substr(2, 9);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);
      analyserNodeRef.current = analyser;
      setAnalyserNode(analyser);
    }
    return audioContextRef.current;
  };

  const getAnalyserNode = () => {
    getAudioContext();
    return analyserNodeRef.current;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    stopPlayback();
    try {
      const ctx = getAudioContext();
      getAnalyserNode();
      const arrayBuffer = await file.arrayBuffer();
      const formatInfo = detectAudioFormat(arrayBuffer, file.name);
      const audioBuffer = await safeDecodeAudioData(ctx, arrayBuffer, file.name);

      const newTrack: AudioTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        audioBuffer,
        trimStart: 0,
        trimEnd: audioBuffer.duration,
        formatInfo,
      };

      setTrack(newTrack);
      setTrimRange([0, 100]);
      setZoomLevel(1);
      zoomLevelRef.current = 1;
      startOffsetRef.current = 0;
      setPlaybackTime(0);
    } catch (err: any) {
      console.error("Lỗi giải mã âm thanh:", err);
      setError(
        err?.message ||
        (language === "vi"
          ? "Không thể giải mã tệp âm thanh này. Hãy thử sử dụng tệp MP3, WAV, FLAC, M4A, OGG hoặc AIFF hợp lệ."
          : "Unable to decode audio. Please try a valid MP3, WAV, FLAC, M4A, OGG, or AIFF file.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (analyserNodeRef.current) {
        try {
          analyserNodeRef.current.disconnect();
        } catch (e) {}
        analyserNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Dynamically observe container width for responsive waveform rendering
  useEffect(() => {
    if (!waveformContainerRef.current) return;
    const el = waveformContainerRef.current;
    if (el.clientWidth > 0) {
      setContainerWidth(el.clientWidth);
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [track]);

  // Enhanced Waveform rendering with zoom, timeline ruler ticks, handles & playhead
  useEffect(() => {
    if (!track || !track.audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = track.audioBuffer;
    const leftChannel = buffer.getChannelData(0);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = currentWaveformWidth;
    const displayHeight = 132;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);

    const width = displayWidth;
    const height = displayHeight;

    const compStyle = window.getComputedStyle(canvas);
    const primaryColor = compStyle.getPropertyValue("--md-sys-color-primary").trim() || "#6750A4";
    const tertiaryColor = compStyle.getPropertyValue("--md-sys-color-tertiary").trim() || "#6366F1";
    const errorColor = compStyle.getPropertyValue("--md-sys-color-error").trim() || "#EF4444";
    const onSurfaceVariant = compStyle.getPropertyValue("--md-sys-color-on-surface-variant").trim() || "rgba(100, 100, 110, 0.7)";
    const outlineVariantColor = compStyle.getPropertyValue("--md-sys-color-outline-variant").trim() || "rgba(103, 80, 164, 0.25)";

    ctx.clearRect(0, 0, width, height);

    const duration = track.duration;
    const leftBound = (trimRange[0] / 100) * width;
    const rightBound = (trimRange[1] / 100) * width;

    // --- 1. Background Grid & Timeline Ruler Ticks ---
    let tickInterval = 10;
    const pxPerSec = width / Math.max(0.1, duration);
    if (pxPerSec > 150) tickInterval = 0.2;
    else if (pxPerSec > 75) tickInterval = 0.5;
    else if (pxPerSec > 35) tickInterval = 1;
    else if (pxPerSec > 15) tickInterval = 2;
    else if (pxPerSec > 8) tickInterval = 5;
    else if (pxPerSec > 3) tickInterval = 10;
    else if (pxPerSec > 1) tickInterval = 30;
    else tickInterval = 60;

    const numTicks = Math.floor(duration / tickInterval);
    ctx.strokeStyle = "rgba(160, 160, 175, 0.16)";
    ctx.lineWidth = 1;
    ctx.fillStyle = onSurfaceVariant;
    ctx.font = "9px ui-monospace, monospace";

    for (let i = 0; i <= numTicks; i++) {
      const sec = i * tickInterval;
      const x = (sec / duration) * width;

      // Vertical grid line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Top tick mark & label
      if (sec < duration) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 6);
        ctx.stroke();

        const mins = Math.floor(sec / 60);
        const secs = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 10);
        const label = tickInterval < 1
          ? `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
          : `${mins}:${secs.toString().padStart(2, "0")}`;

        ctx.fillText(label, x + 3, 11);
      }
    }

    // --- 2. Waveform Bars ---
    const step = Math.max(1, Math.floor(leftChannel.length / width));
    const amp = height / 2;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      const startIdx = i * step;
      const endIdx = Math.min(leftChannel.length, startIdx + step);
      for (let j = startIdx; j < endIdx; j++) {
        const datum = leftChannel[j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      if (min > max) {
        min = 0;
        max = 0;
      }

      const isInsideTrim = i >= leftBound && i <= rightBound;
      ctx.strokeStyle = isInsideTrim ? primaryColor : outlineVariantColor;
      ctx.beginPath();
      ctx.moveTo(i, amp + min * amp * 0.88);
      ctx.lineTo(i, amp + max * amp * 0.88);
      ctx.stroke();
    }

    // --- 3. Shaded Dim Overlay for Unselected Outside Regions ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    if (leftBound > 0) {
      ctx.fillRect(0, 0, leftBound, height);
    }
    if (rightBound < width) {
      ctx.fillRect(rightBound, 0, width - rightBound, height);
    }

    // --- 4. Trim Boundary Lines & Badges ---
    // Start boundary line
    ctx.strokeStyle = tertiaryColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftBound, 0);
    ctx.lineTo(leftBound, height);
    ctx.stroke();

    // Start Handle Flag
    const startSec = (trimRange[0] / 100) * duration;
    const startText = `START ${formatTime(startSec)}`;
    ctx.font = "bold 9px ui-monospace, monospace";
    const startTextW = ctx.measureText(startText).width;
    const startBadgeW = startTextW + 8;
    const startBadgeX = Math.max(1, Math.min(width - startBadgeW - 1, leftBound - 1));

    ctx.fillStyle = tertiaryColor;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(startBadgeX, 14, startBadgeW, 16, 4);
    } else {
      ctx.rect(startBadgeX, 14, startBadgeW, 16);
    }
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(startText, startBadgeX + 4, 25);

    // End boundary line
    ctx.strokeStyle = tertiaryColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rightBound, 0);
    ctx.lineTo(rightBound, height);
    ctx.stroke();

    // End Handle Flag
    const endSec = (trimRange[1] / 100) * duration;
    const endText = `END ${formatTime(endSec)}`;
    const endTextW = ctx.measureText(endText).width;
    const endBadgeW = endTextW + 8;
    const endBadgeX = Math.max(1, Math.min(width - endBadgeW - 1, rightBound - endBadgeW + 1));

    ctx.fillStyle = tertiaryColor;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(endBadgeX, 14, endBadgeW, 16, 4);
    } else {
      ctx.rect(endBadgeX, 14, endBadgeW, 16);
    }
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(endText, endBadgeX + 4, 25);

    // --- 5. Playhead Needle ---
    if (duration > 0) {
      const playX = (playbackTime / duration) * width;
      if (playX >= 0 && playX <= width) {
        ctx.strokeStyle = errorColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playX, 0);
        ctx.lineTo(playX, height);
        ctx.stroke();

        // Top triangle pointer
        ctx.fillStyle = errorColor;
        ctx.beginPath();
        ctx.moveTo(playX - 6, 0);
        ctx.lineTo(playX + 6, 0);
        ctx.lineTo(playX, 8);
        ctx.closePath();
        ctx.fill();

        // Bottom triangle pointer
        ctx.beginPath();
        ctx.moveTo(playX - 6, height);
        ctx.lineTo(playX + 6, height);
        ctx.lineTo(playX, height - 8);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }, [track, trimRange, playbackTime, currentWaveformWidth, zoomLevel]);

  // Auto-scroll waveform viewport during playback when zoomed
  useEffect(() => {
    if (!isPlaying || zoomLevel <= 1 || !track || !waveformContainerRef.current) return;
    const container = waveformContainerRef.current;
    const playX = (playbackTime / track.duration) * currentWaveformWidth;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;

    if (playX > viewRight - 60 || playX < viewLeft) {
      container.scrollTo({
        left: Math.max(0, playX - container.clientWidth * 0.25),
        behavior: "smooth",
      });
    }
  }, [playbackTime, isPlaying, zoomLevel, currentWaveformWidth, track]);

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
  };

  const startPlaybackFrom = async (offsetSec: number) => {
    if (!track || !track.audioBuffer) return;
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    stopPlayback();

    const duration = track.duration;
    const startSec = (trimRange[0] / 100) * duration;
    const endSec = (trimRange[1] / 100) * duration;

    // Constrain offset inside [startSec, endSec]
    let startAt = offsetSec;
    if (startAt < startSec || startAt >= endSec - 0.05) {
      startAt = startSec;
    }

    const timeRemaining = endSec - startAt;
    if (timeRemaining <= 0.02) {
      startOffsetRef.current = startSec;
      setPlaybackTime(startSec);
      return;
    }

    const analyser = getAnalyserNode();
    const source = ctx.createBufferSource();
    source.buffer = track.audioBuffer;
    if (analyser) {
      source.connect(analyser);
    } else {
      source.connect(ctx.destination);
    }

    source.start(0, startAt, timeRemaining);
    sourceNodeRef.current = source;

    const startedCtxTime = ctx.currentTime;
    startTimeRef.current = startedCtxTime;
    startOffsetRef.current = startAt;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setPlaybackTime(startAt);

    source.onended = () => {
      if (sourceNodeRef.current === source && isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        startOffsetRef.current = startSec;
        setPlaybackTime(startSec);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };

    const updatePlayhead = () => {
      if (!isPlayingRef.current || sourceNodeRef.current !== source) return;
      const elapsed = ctx.currentTime - startedCtxTime;
      const currentPos = startAt + elapsed;

      if (currentPos < endSec) {
        startOffsetRef.current = currentPos;
        setPlaybackTime(currentPos);
        rafRef.current = requestAnimationFrame(updatePlayhead);
      } else {
        isPlayingRef.current = false;
        setIsPlaying(false);
        startOffsetRef.current = startSec;
        setPlaybackTime(startSec);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };
    rafRef.current = requestAnimationFrame(updatePlayhead);
  };

  const startPlayback = () => {
    startPlaybackFrom(startOffsetRef.current);
  };

  const togglePlayback = () => {
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlaybackFrom(startOffsetRef.current);
    }
  };

  const seekTo = (targetSec: number, keepPlaying = false) => {
    if (!track) return;
    const duration = track.duration;
    const clamped = Math.max(0, Math.min(duration, targetSec));
    startOffsetRef.current = clamped;
    setPlaybackTime(clamped);

    const wasPlaying = isPlayingRef.current;
    if (wasPlaying || keepPlaying) {
      stopPlayback();
      startPlaybackFrom(clamped);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(10, Math.round(newZoom * 10) / 10));
    const prevZoom = zoomLevelRef.current;
    if (clampedZoom === prevZoom) return;

    if (waveformContainerRef.current) {
      const container = waveformContainerRef.current;
      const clientW = container.clientWidth;
      const anchorRatio = track && track.duration > 0
        ? playbackTime / track.duration
        : ((trimRange[0] + trimRange[1]) / 200);

      setZoomLevel(clampedZoom);
      zoomLevelRef.current = clampedZoom;

      requestAnimationFrame(() => {
        if (waveformContainerRef.current) {
          const newTotalW = Math.max(300, Math.round(containerWidth * clampedZoom));
          const targetScroll = anchorRatio * newTotalW - clientW / 2;
          waveformContainerRef.current.scrollLeft = Math.max(0, targetScroll);
        }
      });
    } else {
      setZoomLevel(clampedZoom);
      zoomLevelRef.current = clampedZoom;
    }
  };

  const zoomToSelection = () => {
    if (!track) return;
    const selRangePct = trimRange[1] - trimRange[0];
    if (selRangePct <= 0) return;

    const targetZoom = Math.min(10, Math.max(1, Math.round((75 / selRangePct) * 10) / 10));
    handleZoomChange(targetZoom);

    requestAnimationFrame(() => {
      if (waveformContainerRef.current) {
        const newTotalW = Math.max(300, Math.round(containerWidth * targetZoom));
        const selStartPx = (trimRange[0] / 100) * newTotalW;
        const clientW = waveformContainerRef.current.clientWidth;
        waveformContainerRef.current.scrollTo({
          left: Math.max(0, selStartPx - clientW * 0.1),
          behavior: "smooth",
        });
      }
    });

    showSnackbar({
      message: language === "vi" ? `Đã phóng to vùng chọn (${targetZoom}x)` : `Zoomed to selection (${targetZoom}x)`,
      withDismissAction: true,
    });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!track || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const leftBound = (trimRange[0] / 100) * currentWaveformWidth;
    const rightBound = (trimRange[1] / 100) * currentWaveformWidth;

    const hitThreshold = 14;
    if (Math.abs(clickX - leftBound) <= hitThreshold) {
      isDraggingHandleRef.current = "start";
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {}
      return;
    }

    if (Math.abs(clickX - rightBound) <= hitThreshold) {
      isDraggingHandleRef.current = "end";
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {}
      return;
    }

    // Direct click to seek
    const ratio = Math.max(0, Math.min(1, clickX / currentWaveformWidth));
    const targetSec = ratio * track.duration;
    seekTo(targetSec, isPlayingRef.current);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!track || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const leftBound = (trimRange[0] / 100) * currentWaveformWidth;
    const rightBound = (trimRange[1] / 100) * currentWaveformWidth;

    if (isDraggingHandleRef.current === "start") {
      const newStartPct = Math.max(0, Math.min(trimRange[1] - 0.05, (curX / currentWaveformWidth) * 100));
      setTrimRange([newStartPct, trimRange[1]]);
      const newSec = (newStartPct / 100) * track.duration;
      startOffsetRef.current = newSec;
      setPlaybackTime(newSec);
      return;
    }

    if (isDraggingHandleRef.current === "end") {
      const newEndPct = Math.min(100, Math.max(trimRange[0] + 0.05, (curX / currentWaveformWidth) * 100));
      setTrimRange([trimRange[0], newEndPct]);
      return;
    }

    const hitThreshold = 12;
    if (Math.abs(curX - leftBound) <= hitThreshold || Math.abs(curX - rightBound) <= hitThreshold) {
      setCursorStyle("col-resize");
    } else {
      setCursorStyle("pointer");
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingHandleRef.current) {
      isDraggingHandleRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!track || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / currentWaveformWidth));
    const targetSec = ratio * track.duration;
    seekTo(targetSec, isPlayingRef.current);
  };

  const adjustTrimStart = (deltaSec: number) => {
    if (!track) return;
    const duration = track.duration;
    const currentStartSec = (trimRange[0] / 100) * duration;
    const currentEndSec = (trimRange[1] / 100) * duration;
    const newStartSec = Math.max(0, Math.min(currentEndSec - 0.02, currentStartSec + deltaSec));
    const newStartPct = (newStartSec / duration) * 100;
    setTrimRange([newStartPct, trimRange[1]]);
    seekTo(newStartSec, false);
  };

  const adjustTrimEnd = (deltaSec: number) => {
    if (!track) return;
    const duration = track.duration;
    const currentStartSec = (trimRange[0] / 100) * duration;
    const currentEndSec = (trimRange[1] / 100) * duration;
    const newEndSec = Math.min(duration, Math.max(currentStartSec + 0.02, currentEndSec + deltaSec));
    const newEndPct = (newEndSec / duration) * 100;
    setTrimRange([trimRange[0], newEndPct]);
  };

  const setStartToCurrentPlayback = () => {
    if (!track) return;
    const duration = track.duration;
    const currentEndSec = (trimRange[1] / 100) * duration;
    const newStartSec = Math.max(0, Math.min(currentEndSec - 0.1, playbackTime));
    const newStartPct = (newStartSec / duration) * 100;
    setTrimRange([newStartPct, trimRange[1]]);
    showSnackbar({
      message: language === "vi" ? `Đã đặt mốc bắt đầu: ${formatTime(newStartSec)}` : `Set start marker to ${formatTime(newStartSec)}`,
      withDismissAction: true,
    });
  };

  const setEndToCurrentPlayback = () => {
    if (!track) return;
    const duration = track.duration;
    const currentStartSec = (trimRange[0] / 100) * duration;
    const newEndSec = Math.min(duration, Math.max(currentStartSec + 0.1, playbackTime));
    const newEndPct = (newEndSec / duration) * 100;
    setTrimRange([trimRange[0], newEndPct]);
    showSnackbar({
      message: language === "vi" ? `Đã đặt mốc kết thúc: ${formatTime(newEndSec)}` : `Set end marker to ${formatTime(newEndSec)}`,
      withDismissAction: true,
    });
  };

  const resetTrim = () => {
    stopPlayback();
    setTrimRange([0, 100]);
    if (track) {
      startOffsetRef.current = 0;
      setPlaybackTime(0);
    }
  };

  const getTrimmedDurations = () => {
    if (!track) return { start: 0, end: 0, length: 0 };
    const start = (trimRange[0] / 100) * track.duration;
    const end = (trimRange[1] / 100) * track.duration;
    return {
      start,
      end,
      length: end - start
    };
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  // Extract trimmed audio from current track and add to Merge Queue
  const addToMergeQueue = () => {
    if (!track || !track.audioBuffer) return;

    stopPlayback();
    const { start, end, length } = getTrimmedDurations();
    const ctx = getAudioContext();

    const sampleRate = track.audioBuffer.sampleRate;
    const channels = track.audioBuffer.numberOfChannels;

    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const lengthSamples = endSample - startSample;

    // Create new AudioBuffer for trimmed slice
    const trimmedBuffer = ctx.createBuffer(channels, lengthSamples, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const originalData = track.audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < lengthSamples; i++) {
        trimmedData[i] = originalData[startSample + i];
      }
    }

    const queueItem: AudioTrack = {
      id: genId(),
      name: `[Cắt] ${track.name.replace(/\.[^/.]+$/, "")} (${formatTime(length).replace(".", "_")})`,
      size: 0,
      duration: length,
      sampleRate,
      numberOfChannels: channels,
      audioBuffer: trimmedBuffer,
      trimStart: 0,
      trimEnd: length,
      formatInfo: track.formatInfo,
    };

    setMergeQueue([...mergeQueue, queueItem]);
    showSnackbar({
      message: language === "vi" ? "Đã thêm đoạn nhạc đã cắt vào hàng chờ!" : "Trimmed segment added to queue!",
      withDismissAction: true,
    });
  };

  const removeFromQueue = (id: string) => {
    setMergeQueue(mergeQueue.filter(item => item.id !== id));
  };

  /** Quickly export current trimmed selection without needing to merge. */
  const handleQuickExportCurrent = async () => {
    if (!track || !track.audioBuffer) return;
    setIsMerging(true);
    stopPlayback();
    try {
      const { start, end, length } = getTrimmedDurations();
      const ctx = getAudioContext();
      const sampleRate = track.audioBuffer.sampleRate;
      const channels = track.audioBuffer.numberOfChannels;
      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.floor(end * sampleRate);
      const lengthSamples = endSample - startSample;

      const trimmedBuffer = ctx.createBuffer(channels, lengthSamples, sampleRate);
      for (let channel = 0; channel < channels; channel++) {
        const originalData = track.audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < lengthSamples; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }

      const exportResult = await exportAudioBuffer(trimmedBuffer, exportFormat);
      const url = URL.createObjectURL(exportResult.blob);
      const link = document.createElement("a");
      const baseName = track.name.replace(/\.[^/.]+$/, "");
      link.href = url;
      link.download = `${baseName}_trimmed.${exportResult.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar({
        message: `${t("trim_export_success")} (${exportResult.label})`,
        withDismissAction: true,
      });
    } catch (err: any) {
      console.error("Lỗi xuất đoạn nhạc:", err);
      setError(err?.message || (language === "vi" ? "Lỗi xuất đoạn nhạc." : "Error exporting audio."));
    } finally {
      setIsMerging(false);
    }
  };

  const handleMergeAndExport = async () => {
    if (mergeQueue.length === 0) return;
    setIsMerging(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const ctx = getAudioContext();
      const sampleRate = mergeQueue[0].sampleRate;
      const channels = mergeQueue[0].numberOfChannels;
      let totalSamples = 0;
      for (const t of mergeQueue) {
        if (t.audioBuffer) totalSamples += t.audioBuffer.length;
      }

      const mergedBuffer = ctx.createBuffer(channels, totalSamples, sampleRate);

      for (let channel = 0; channel < channels; channel++) {
        const mergedData = mergedBuffer.getChannelData(channel);
        let writeOffset = 0;
        for (const segment of mergeQueue) {
          if (segment.audioBuffer) {
            // Fall back to ch0 if this segment has fewer channels
            const segChannelData = segment.audioBuffer.numberOfChannels > channel
              ? segment.audioBuffer.getChannelData(channel)
              : segment.audioBuffer.getChannelData(0);
            mergedData.set(segChannelData, writeOffset);
            writeOffset += segment.audioBuffer.length;
          }
        }
      }

      const exportResult = await exportAudioBuffer(mergedBuffer, exportFormat);
      const url = URL.createObjectURL(exportResult.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AudioMerge_${new Date().toISOString().slice(0, 10)}.${exportResult.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSnackbar({
        message: `${t("trim_export_success")} (${exportResult.label})`,
        withDismissAction: true,
      });
    } catch (err) {
      console.error("Lỗi khi ghép nhạc:", err);
      setError(language === "vi" ? "Đã xảy ra lỗi khi ghép nhạc. Vui lòng kiểm tra lại định dạng tệp." : "Error merging audio. Please check the file formats.");
    } finally {
      setIsMerging(false);
    }
  };

  useEffect(() => { return () => { stopPlayback(); }; }, []);

  useEffect(() => { setError(null); }, [track, mergeQueue]);

  const { start: trimmedStart, end: trimmedEnd, length: trimmedLength } = getTrimmedDurations();

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="trim-merge-tab">
      <Card variant="outlined" className="p-4 sm:p-5 flex flex-col gap-4 overflow-hidden bg-m3-surface-container-lowest/50">
        <div className="flex items-center gap-3">
          <IconButton colorStyle="tonal" aria-label="Scissors">
            <Icon name="content_cut" className="text-m3-primary" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("trim_title")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">{t("trim_desc")}</Text>
          </div>
        </div>

        {error && (
          <Card variant="filled" className="flex items-center justify-between p-3.5 bg-m3-error-container text-m3-on-error-container border border-m3-error/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Icon name="error" className="text-m3-error shrink-0" />
              <Text variant="body-sm" className="text-m3-on-error-container font-medium">{error}</Text>
            </div>
            <IconButton colorStyle="standard" onClick={() => setError(null)} aria-label="Close error">
              <Icon name="close" size={18} className="text-m3-on-error-container" />
            </IconButton>
          </Card>
        )}

        {/* Dropzone container */}
        {!track ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-m3-outline-variant rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center bg-m3-surface-container-lowest/40"
            onClick={() => document.getElementById("audio-upload")?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-m3-primary-container/40 flex items-center justify-center text-m3-primary">
              <Icon name="audiotrack" size={36} />
            </div>
            <div className="flex flex-col gap-1 max-w-lg">
              <Text variant="body-lg" className="font-semibold text-m3-on-surface">{t("trim_drop_title")}</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">{t("trim_drop_desc")}</Text>
            </div>

            {/* Global audio formats badges */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xl mt-1">
              {GLOBAL_AUDIO_FORMATS.map((fmt) => (
                <span
                  key={fmt.extension}
                  className={`text-xs px-2.5 py-1 rounded-full font-mono border transition-all ${
                    fmt.isLossless
                      ? "bg-m3-primary-container/40 text-m3-primary border-m3-primary/40 font-semibold"
                      : "bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/50"
                  }`}
                  title={`${fmt.name}: ${fmt.description}`}
                >
                  .{fmt.extension.toUpperCase()}
                  {fmt.isLossless && " ★"}
                </span>
              ))}
            </div>

            <Text variant="label-sm" className="text-m3-primary font-medium">
              {t("trim_global_formats_hint")}
            </Text>

            <input
              id="audio-upload"
              type="file"
              accept={AUDIO_ACCEPT_STRING}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File info bar */}
            <Card variant="filled" className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-m3-surface-container-low rounded-xl min-w-0 border border-m3-outline-variant/40">
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-m3-primary-container flex items-center justify-center text-m3-primary shrink-0">
                  <Icon name="audiotrack" className="text-m3-on-primary-container" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text variant="body-md" className="font-semibold text-m3-on-surface truncate">
                      {track.name}
                    </Text>
                    {track.formatInfo && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 border ${
                          (track.formatInfo.isLossless ?? (track.formatInfo.category === "lossless" || track.formatInfo.category === "hi-res"))
                            ? "bg-m3-primary-container/50 text-m3-primary border-m3-primary/30"
                            : "bg-m3-secondary-container/50 text-m3-secondary border-m3-secondary/30"
                        }`}
                      >
                        {track.formatInfo.name}
                      </span>
                    )}
                  </div>
                  <Text variant="body-sm" className="text-m3-on-surface-variant">
                    {formatTime(track.duration)} • {(track.size / (1024 * 1024)).toFixed(2)} MB • {track.sampleRate}Hz • {track.numberOfChannels === 2 ? "Stereo" : "Mono"}
                  </Text>
                </div>
              </div>
              <Button
                colorStyle="text"
                className="shrink-0"
                onClick={() => {
                  stopPlayback();
                  setTrack(null);
                }}
              >
                {t("trim_select_new")}
              </Button>
            </Card>

            {/* Waveform Zoom & Display Control Toolbar */}
            <Card variant="filled" className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40">
              {/* Zoom Slider and Controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Icon name="zoom_in" size={18} className="text-m3-primary" />
                  <Text variant="label-sm" className="font-semibold text-m3-on-surface">
                    {t("trim_zoom_label")}
                  </Text>
                  <span className="font-mono text-xs font-bold text-m3-primary bg-m3-primary-container/40 px-2 py-0.5 rounded-md">
                    {zoomLevel.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    size="xs"
                    onClick={() => handleZoomChange(Math.max(1, zoomLevel - 0.5))}
                    disabled={zoomLevel <= 1}
                    title={t("trim_zoom_out")}
                    aria-label={t("trim_zoom_out")}
                  >
                    <Icon name="remove" size={16} />
                  </IconButton>

                  <div className="w-24 sm:w-36 md:w-44 px-1">
                    <Slider
                      min={1}
                      max={10}
                      step={0.2}
                      value={zoomLevel}
                      onValueChange={handleZoomChange}
                      size="xs"
                    />
                  </div>

                  <IconButton
                    size="xs"
                    onClick={() => handleZoomChange(Math.min(10, zoomLevel + 0.5))}
                    disabled={zoomLevel >= 10}
                    title={t("trim_zoom_in")}
                    aria-label={t("trim_zoom_in")}
                  >
                    <Icon name="add" size={16} />
                  </IconButton>
                </div>

                {/* Quick Presets & Zoom to Selection */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ButtonGroup variant="connected" size="xs">
                    <Button
                      colorStyle={zoomLevel === 1 ? "tonal" : "outlined"}
                      onClick={() => handleZoomChange(1)}
                      title={t("trim_zoom_reset")}
                    >
                      1x
                    </Button>
                    <Button
                      colorStyle={Math.abs(zoomLevel - 2) < 0.1 ? "tonal" : "outlined"}
                      onClick={() => handleZoomChange(2)}
                    >
                      2x
                    </Button>
                    <Button
                      colorStyle={Math.abs(zoomLevel - 4) < 0.1 ? "tonal" : "outlined"}
                      onClick={() => handleZoomChange(4)}
                    >
                      4x
                    </Button>
                    <Button
                      colorStyle={Math.abs(zoomLevel - 8) < 0.1 ? "tonal" : "outlined"}
                      onClick={() => handleZoomChange(8)}
                    >
                      8x
                    </Button>
                  </ButtonGroup>

                  <Button
                    size="xs"
                    colorStyle="tonal"
                    onClick={zoomToSelection}
                    icon={<Icon name="zoom_in_map" size={14} />}
                    title={t("trim_zoom_to_selection")}
                  >
                    {language === "vi" ? "Vùng chọn" : "Selection"}
                  </Button>
                </div>
              </div>

              {/* Display View Mode Switcher */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                <Text variant="label-sm" className="hidden sm:inline font-medium text-m3-on-surface-variant">
                  {language === "vi" ? "Chế độ:" : "View:"}
                </Text>
                <div className="flex items-center bg-m3-surface-container-high rounded-lg p-0.5 border border-m3-outline-variant/40">
                  <Button
                    size="xs"
                    colorStyle={visualizerView === "both" ? "tonal" : "text"}
                    onClick={() => setVisualizerView("both")}
                    icon={<Icon name="splitscreen" size={14} />}
                  >
                    {t("visualizer_view_both")}
                  </Button>
                  <Button
                    size="xs"
                    colorStyle={visualizerView === "waveform" ? "tonal" : "text"}
                    onClick={() => setVisualizerView("waveform")}
                    icon={<Icon name="graphic_eq" size={14} />}
                  >
                    {t("visualizer_view_waveform")}
                  </Button>
                  <Button
                    size="xs"
                    colorStyle={visualizerView === "spectrum" ? "tonal" : "text"}
                    onClick={() => setVisualizerView("spectrum")}
                    icon={<Icon name="bar_chart" size={14} />}
                  >
                    {t("visualizer_view_spectrum")}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Canvas Waveform visualizer with horizontal scroll when zoomed & direct handle dragging */}
            {(visualizerView === "waveform" || visualizerView === "both") && (
              <Card variant="outlined" className="relative bg-m3-surface-container-lowest rounded-xl overflow-hidden border border-m3-outline-variant group p-0">
                {/* Horizontal Scrollable Viewport */}
                <div
                  ref={waveformContainerRef}
                  className="w-full overflow-x-auto overflow-y-hidden select-none scroll-smooth"
                  style={{ maxHeight: "150px" }}
                >
                  <div
                    style={{
                      width: `${currentWaveformWidth}px`,
                      minWidth: "100%",
                      height: "132px",
                      position: "relative",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
                        width: `${currentWaveformWidth}px`,
                        height: "132px",
                        cursor: cursorStyle,
                        display: "block",
                      }}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      title={language === "vi"
                        ? "Kéo các cờ START/END để cắt chính xác, hoặc nhấp vào sóng âm để nhảy thời gian"
                        : "Drag START/END handles to trim precisely, or click waveform to seek"}
                    />
                  </div>
                </div>

                {/* Real-time playback position badge */}
                <Card variant="elevated" className="absolute top-2 right-2 bg-m3-surface-container-high/90 backdrop-blur-md text-m3-on-surface text-xs px-2.5 py-1 rounded-md font-mono border border-m3-outline-variant/60 flex items-center gap-1.5 shadow-md pointer-events-none">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-m3-primary animate-pulse" : "bg-m3-secondary"}`} />
                  <Text variant="label-sm" className="text-m3-on-surface-variant font-medium">
                    {language === "vi" ? "Đang nghe:" : "Position:"}
                  </Text>
                  <Text variant="label-sm" className="font-bold text-m3-primary font-mono">
                    {formatTime(playbackTime)}
                  </Text>
                </Card>

                {/* Bottom stats and zoom/drag hint */}
                <div className="absolute bottom-2 left-3 flex items-center gap-2 pointer-events-none">
                  <Card variant="filled" className="bg-m3-surface-container-high/90 backdrop-blur-sm text-m3-on-surface text-xs px-2.5 py-0.5 rounded-md font-mono border border-m3-outline-variant/40">
                    <Text variant="label-sm" className="font-mono text-m3-on-surface">
                      {formatTime(playbackTime)} / {formatTime(track.duration)}
                    </Text>
                  </Card>
                  <Card variant="filled" className="hidden sm:inline-block bg-m3-surface-container-high/80 backdrop-blur-sm text-m3-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-m3-outline-variant/30">
                    <Text variant="label-sm" className="text-[11px] text-m3-on-surface-variant">
                      {zoomLevel > 1
                        ? (language === "vi" ? `Thu phóng ${zoomLevel.toFixed(1)}x - Kéo cờ START/END hoặc cuộn ngang` : `Zoom ${zoomLevel.toFixed(1)}x - Drag START/END flags or scroll`)
                        : (language === "vi" ? "Kéo cờ START/END để cắt • Nhấp để nghe thử" : "Drag START/END flags to trim • Click to seek")}
                    </Text>
                  </Card>
                </div>
              </Card>
            )}

            {/* Real-time Web Audio API Frequency Visualizer */}
            {(visualizerView === "spectrum" || visualizerView === "both") && (
              <FrequencyVisualizer
                analyserNode={analyserNode}
                isPlaying={isPlaying}
                height={120}
              />
            )}

            {/* Current Listening Position & Quick Marker Placement Tools */}
            <Card variant="filled" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-m3-primary-container flex items-center justify-center text-m3-primary shrink-0">
                  <Icon name={isPlaying ? "graphic_eq" : "headphones"} size={18} className={`${isPlaying ? "animate-pulse" : ""} text-m3-on-primary-container`} />
                </div>
                <div>
                  <Text variant="label-sm" className="text-m3-on-surface-variant font-medium leading-none block">
                    {language === "vi" ? "Vị trí con trỏ nghe thử" : "Current Playhead"}
                  </Text>
                  <Text variant="label-lg" className="font-mono font-bold text-m3-primary mt-0.5 block">
                    {formatTime(playbackTime)}
                  </Text>
                </div>
              </div>

              {/* Instant marker placement at exact listening point */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="xs"
                  colorStyle="tonal"
                  onClick={setStartToCurrentPlayback}
                  icon={<Icon name="first_page" size={16} />}
                  title={language === "vi" ? "Lấy thời điểm nghe hiện tại làm mốc Bắt đầu cắt" : "Set current listening position as Trim Start"}
                >
                  {language === "vi" ? "Đặt làm Điểm Bắt Đầu" : "Set as Start"}
                </Button>

                <Button
                  size="xs"
                  colorStyle="tonal"
                  onClick={setEndToCurrentPlayback}
                  icon={<Icon name="last_page" size={16} />}
                  title={language === "vi" ? "Lấy thời điểm nghe hiện tại làm mốc Kết thúc cắt" : "Set current listening position as Trim End"}
                >
                  {language === "vi" ? "Đặt làm Điểm Kết Thúc" : "Set as End"}
                </Button>
              </div>
            </Card>

            {/* Slider Range Trimming */}
            <div className="px-2 py-1 flex flex-col gap-1">
              <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-xs text-m3-on-surface-variant font-mono">
                <Text variant="label-sm" className="font-mono text-m3-on-surface-variant">
                  {t("trim_start_time")}: {formatTime(trimmedStart)}
                </Text>
                <Text variant="label-sm" className="font-mono font-semibold text-m3-primary">
                  {t("trim_duration")}: {formatTime(trimmedLength)}
                </Text>
                <Text variant="label-sm" className="font-mono text-m3-on-surface-variant">
                  {t("trim_end_time")}: {formatTime(trimmedEnd)}
                </Text>
              </div>
              <RangeSlider
                value={trimRange}
                onValueChange={(val) => {
                  stopPlayback();
                  setTrimRange(val);
                  const currentSec = (val[0] / 100) * track.duration;
                  startOffsetRef.current = currentSec;
                  setPlaybackTime(currentSec);
                }}
                min={0}
                max={100}
                className="my-3"
                size="xs"
              />

              {/* Fine-tuning steppers for Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                <Card variant="outlined" className="flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-container-high/50 border border-m3-outline-variant/30 text-xs">
                  <div className="flex flex-col">
                    <Text variant="label-sm" className="text-m3-on-surface-variant font-sans font-medium">
                      {t("trim_start_time")}
                    </Text>
                    <Text variant="label-md" className="font-bold text-m3-on-surface font-mono">
                      {formatTime(trimmedStart)}
                    </Text>
                  </div>
                  <ButtonGroup variant="connected" size="xs">
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(-1)} title="-1.0s">-1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(-0.1)} title="-0.1s">-0.1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(-0.01)} title="-10ms">-10ms</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(0.01)} title="+10ms">+10ms</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(0.1)} title="+0.1s">+0.1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimStart(1)} title="+1.0s">+1s</Button>
                  </ButtonGroup>
                </Card>

                <Card variant="outlined" className="flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-container-high/50 border border-m3-outline-variant/30 text-xs">
                  <div className="flex flex-col">
                    <Text variant="label-sm" className="text-m3-on-surface-variant font-sans font-medium">
                      {t("trim_end_time")}
                    </Text>
                    <Text variant="label-md" className="font-bold text-m3-on-surface font-mono">
                      {formatTime(trimmedEnd)}
                    </Text>
                  </div>
                  <ButtonGroup variant="connected" size="xs">
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(-1)} title="-1.0s">-1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(-0.1)} title="-0.1s">-0.1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(-0.01)} title="-10ms">-10ms</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(0.01)} title="+10ms">+10ms</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(0.1)} title="+0.1s">+0.1s</Button>
                    <Button colorStyle="outlined" onClick={() => adjustTrimEnd(1)} title="+1.0s">+1s</Button>
                  </ButtonGroup>
                </Card>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <Button
                colorStyle="tonal"
                onClick={togglePlayback}
                icon={isPlaying ? <Icon name="pause" /> : <Icon name="play_arrow" />}
              >
                {isPlaying ? t("trim_pause") : t("trim_play")}
              </Button>

              <Button
                colorStyle="outlined"
                onClick={() => {
                  seekTo(trimmedStart, true);
                }}
                icon={<Icon name="replay" />}
                title={language === "vi" ? "Nghe lại từ đầu đoạn cắt" : "Preview from trim start"}
              >
                {language === "vi" ? "Nghe từ điểm đầu" : "From Start"}
              </Button>

              <Button
                colorStyle="outlined"
                onClick={resetTrim}
                icon={<Icon name="restart_alt" />}
                disabled={trimRange[0] === 0 && trimRange[1] === 100}
              >
                {t("trim_reset")}
              </Button>

              <Button
                colorStyle="outlined"
                onClick={handleQuickExportCurrent}
                icon={<Icon name="file_download" />}
                disabled={isMerging}
              >
                {language === "vi" ? "Xuất nhanh đoạn này" : "Quick Export Selection"}
              </Button>

              <Button
                colorStyle="filled"
                onClick={addToMergeQueue}
                icon={<Icon name="add" />}
              >
                {t("trim_add_queue")}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 p-4">
            <LoadingIndicator aria-label="Loading audio" size={40} />
            <Text variant="body-sm" className="text-m3-primary">{language === "vi" ? "Đang tải và giải mã tệp âm thanh..." : "Loading and decoding audio file..."}</Text>
          </div>
        )}
      </Card>

      {/* Merge Queue / Splicing Manager Card */}
      <Card variant="outlined" className="p-5 flex flex-col gap-4 overflow-hidden border border-m3-outline-variant/30 rounded-2xl bg-m3-surface-container-lowest/30">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <IconButton colorStyle="tonal" aria-label="Merge queue">
              <Icon name="call_merge" className="text-m3-secondary" />
            </IconButton>
            <div className="overflow-hidden min-w-0">
              <Text variant="title-md" className="font-semibold text-m3-on-surface">
                {t("trim_queue_title")} ({mergeQueue.length})
              </Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">
                {language === "vi" ? "Các đoạn nhạc sẽ được nối tiếp nhau theo thứ tự dưới đây." : "Segments will be concatenated in sequential order below."}
              </Text>
            </div>
          </div>

          {mergeQueue.length > 0 && (
            <Button
              colorStyle="text"
              className="shrink-0"
              onClick={() => setMergeQueue([])}
            >
              {language === "vi" ? "Xóa tất cả" : "Clear all"}
            </Button>
          )}
        </div>

        <Divider shape="wavy" />

        {/* Global Export Format Selector */}
        <Card variant="filled" className="flex flex-col gap-2.5 p-4 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40">
          <div className="flex items-center justify-between">
            <Text variant="body-md" className="font-semibold text-m3-on-surface">
              {t("trim_export_format")}
            </Text>
            <Text variant="label-sm" className="text-m3-primary font-mono font-medium">
              {EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat)?.qualityBadge}
            </Text>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EXPORT_FORMAT_OPTIONS.map((opt) => {
              const isSelected = exportFormat === opt.id;
              return (
                <Card
                  key={opt.id}
                  variant={isSelected ? "filled" : "outlined"}
                  interactive
                  onClick={() => setExportFormat(opt.id)}
                  className={`p-3 text-left transition-all ${
                    isSelected
                      ? "ring-2 ring-m3-primary bg-m3-primary-container/30"
                      : "bg-m3-surface-container-high/60 border-m3-outline-variant/40 hover:bg-m3-surface-container-high"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <Text variant="label-lg" className={`font-semibold ${isSelected ? "text-m3-primary" : "text-m3-on-surface"}`}>
                      {opt.label}
                    </Text>
                    {opt.isLossless && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-m3-primary-container/60 text-m3-primary border border-m3-primary/30">
                        Lossless
                      </span>
                    )}
                  </div>
                  <Text variant="body-sm" className="text-m3-on-surface-variant text-xs line-clamp-1 mt-0.5">
                    {opt.description}
                  </Text>
                </Card>
              );
            })}
          </div>
        </Card>

        {mergeQueue.length === 0 ? (
          <div className="p-8 text-center text-m3-on-surface-variant/60 flex flex-col items-center justify-center gap-2">
            <Icon name="content_cut" size={40} className="text-m3-on-surface-variant/40" />
            <Text variant="body-md">{t("trim_queue_empty")}</Text>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* List segments */}
            <AdaptiveScrollArea className="max-h-55 pr-1" orientation="vertical">
              <div className="flex flex-col gap-2">
                {mergeQueue.map((item, idx) => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    className="flex items-center justify-between p-3 bg-m3-surface-container-high border-m3-outline-variant/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-6 h-6 rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="overflow-hidden">
                        <Text variant="body-md" className="font-medium text-m3-on-surface truncate block">
                          {item.name}
                        </Text>
                        <Text variant="body-sm" className="text-m3-on-surface-variant">
                          {t("trim_duration")}: {formatTime(item.duration)}
                        </Text>
                      </div>
                    </div>
                    <IconButton
                      aria-label="Delete segment"
                      onClick={() => removeFromQueue(item.id)}
                    >
                      <Icon name="delete" />
                    </IconButton>
                  </Card>
                ))}
              </div>
            </AdaptiveScrollArea>

            {/* Export and merge action */}
            <Card variant="filled" className="flex flex-col gap-3 items-center mt-3 p-4 bg-m3-primary-container/20 rounded-xl border border-m3-primary/20">
              <div className="text-center">
                <Text variant="body-md" className="font-semibold text-m3-primary">
                  {language === "vi" ? "Tổng thời lượng tệp xuất" : "Total export duration"}: {formatTime(
                    mergeQueue.reduce((acc, curr) => acc + curr.duration, 0)
                  )}
                </Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant">
                  {language === "vi" ? "Định dạng xuất chọn:" : "Selected export format:"} <strong>{EXPORT_FORMAT_OPTIONS.find(f => f.id === exportFormat)?.label}</strong> (.{EXPORT_FORMAT_OPTIONS.find(f => f.id === exportFormat)?.ext})
                </Text>
              </div>

              <Button
                colorStyle="filled"
                onClick={handleMergeAndExport}
                icon={<Icon name="download" />}
                disabled={isMerging}
                className="w-full sm:w-auto"
              >
                {isMerging ? t("trim_exporting") : `${t("trim_export_btn")} (.${EXPORT_FORMAT_OPTIONS.find(f => f.id === exportFormat)?.ext.toUpperCase()})`}
              </Button>
            </Card>
          </div>
        )}

        {isMerging && (
          <div className="flex flex-col items-center gap-3 p-4">
            <LoadingIndicator aria-label="Merging audio" size={40} />
            <Text variant="body-sm" className="text-m3-secondary">{t("trim_exporting")}</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
