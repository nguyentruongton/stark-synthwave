/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, Button, IconButton, Text, Divider, LoadingIndicator, Icon, useTheme } from "@bug-on/m3-expressive";
import { AudioFormatInfo, QualityResult } from "../types";
import { analyzeLosslessQuality, safeDecodeAudioData } from "../utils/audioAnalysis";
import { AUDIO_ACCEPT_STRING, detectAudioFormat, GLOBAL_AUDIO_FORMATS } from "../utils/audioFormats";
import { useLanguage } from "../i18n/LanguageContext";
import { FrequencyVisualizer } from "./FrequencyVisualizer";

function colorWithAlpha(color: string, alpha: number, fallback: string): string {
  if (color.startsWith("#")) {
    const cleanHex = color.replace("#", "").trim();
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
    const parts = color.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
  }
  return fallback;
}

export function LosslessChecker() {
  const { t, language } = useLanguage();
  const { effectiveMode } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<AudioFormatInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playbackStartCtxTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const getPlaybackContext = () => {
    if (!playbackCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      playbackCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    }
    return playbackCtxRef.current;
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.onended = null;
        playbackSourceRef.current.stop();
        playbackSourceRef.current.disconnect();
      } catch (e) {}
      playbackSourceRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (!decodedBuffer) return;
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const ctx = getPlaybackContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    let offset = playbackTime;
    if (offset >= decodedBuffer.duration - 0.1) {
      offset = 0;
      setPlaybackTime(0);
    }

    const source = ctx.createBufferSource();
    source.buffer = decodedBuffer;
    if (analyserRef.current) {
      source.connect(analyserRef.current);
    } else {
      source.connect(ctx.destination);
    }

    source.start(0, offset);
    playbackSourceRef.current = source;
    playbackStartCtxTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = offset;
    setIsPlaying(true);

    source.onended = () => {
      if (playbackSourceRef.current === source) {
        setIsPlaying(false);
        setPlaybackTime(0);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };

    const updateTime = () => {
      if (!playbackSourceRef.current) return;
      const elapsed = ctx.currentTime - playbackStartCtxTimeRef.current;
      const currentPos = playbackStartOffsetRef.current + elapsed;
      if (currentPos < decodedBuffer.duration) {
        setPlaybackTime(currentPos);
        rafRef.current = requestAnimationFrame(updateTime);
      } else {
        setIsPlaying(false);
        setPlaybackTime(0);
      }
    };
    rafRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {}
        analyserRef.current = null;
      }
      if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
        playbackCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await analyzeFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await analyzeFile(file);
  };

  const analyzeFile = async (selectedFile: File) => {
    stopPlayback();
    setIsLoading(true);
    setResult(null);
    setDecodedBuffer(null);
    setError(null);
    setFile(selectedFile);

    let audioContext: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const fmt = detectAudioFormat(arrayBuffer, selectedFile.name);
      setDetectedFormat(fmt);

      const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer, selectedFile.name);
      setDecodedBuffer(audioBuffer);
      const qualityResult = analyzeLosslessQuality(audioBuffer);
      setResult(qualityResult);
    } catch (err: any) {
      console.error("Lỗi phân tích chất lượng nhạc:", err);
      setError(
        err?.message ||
        (language === "vi"
          ? "Không thể phân tích tệp âm thanh này. Hãy chắc chắn rằng đây là tệp nhạc hợp lệ."
          : "Unable to analyze audio file. Please check that it is a valid audio file.")
      );
      setFile(null);
      setDetectedFormat(null);
    } finally {
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Theme-adaptive canvas colors computed dynamically from active M3 tokens
    const isDark = effectiveMode === "dark";
    const compStyle = window.getComputedStyle(canvas);
    const primaryColor = compStyle.getPropertyValue("--md-sys-color-primary").trim() || (isDark ? "#D0BCFF" : "#6750A4");
    const tertiaryColor = compStyle.getPropertyValue("--md-sys-color-tertiary").trim() || (isDark ? "#EFB8C8" : "#7D5260");
    const errorColor = compStyle.getPropertyValue("--md-sys-color-error").trim() || (isDark ? "#F2B8B5" : "#B3261E");
    const onSurfaceVariant = compStyle.getPropertyValue("--md-sys-color-on-surface-variant").trim() || (isDark ? "#CAC4D0" : "#49454F");
    const outlineVariant = compStyle.getPropertyValue("--md-sys-color-outline-variant").trim() || (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)");

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.02)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = outlineVariant;
    ctx.lineWidth = 1;

    // Vertical grid lines (4k, 8k, 12k, 16k, 20k Hz)
    const gridFreqs = [4000, 8000, 12000, 16000, 20000];
    ctx.fillStyle = onSurfaceVariant;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";

    gridFreqs.forEach(f => {
      const x = (f / 22050) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 15);
      ctx.stroke();
      ctx.fillText(`${f / 1000}kHz`, x, height - 3);
    });

    const gridDB = [-20, -40, -60, -80];
    ctx.textAlign = "left";
    gridDB.forEach(db => {
      const y = (db / -100) * (height - 20);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${db}dB`, 5, y - 2);
    });

    // Spectrum curve
    const points = result.spectrumData;
    const curveColor = result.isRealLossless
      ? primaryColor
      : result.score > 60
        ? tertiaryColor
        : errorColor;

    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    points.forEach((pt, idx) => {
      const x = (pt.frequency / 22050) * width;
      const y = (pt.power / -100) * (height - 20);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under spectrum with smooth dynamic M3 alpha gradient
    ctx.lineTo(width, height - 20);
    ctx.lineTo(0, height - 20);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const startAlphaColor = colorWithAlpha(curveColor, 0.25, isDark ? "rgba(208, 188, 255, 0.25)" : "rgba(103, 80, 164, 0.25)");
    const endAlphaColor = colorWithAlpha(curveColor, 0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0, startAlphaColor);
    gradient.addColorStop(1, endAlphaColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Cutoff frequency marker
    const cutoffX = (result.cutoffFrequency / 22050) * width;
    ctx.strokeStyle = tertiaryColor;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tertiaryColor;
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = cutoffX > width * 0.7 ? "right" : "left";
    const textX = cutoffX > width * 0.7 ? cutoffX - 5 : cutoffX + 5;
    ctx.fillText(`${language === "vi" ? "Giới hạn tần số" : "Cutoff shelf"}: ${(result.cutoffFrequency / 1000).toFixed(1)}kHz`, textX, 20);

  }, [result, effectiveMode, language]);

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="lossless-tab">
      <Card variant="outlined" className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <IconButton colorStyle="tonal" aria-label="Shield check">
              <Icon name="verified_user" className="text-m3-primary" />
            </IconButton>
            <div>
              <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("lossless_title")}</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">{t("lossless_desc")}</Text>
            </div>
          </div>

          <IconButton
            colorStyle="standard"
            aria-label="Help"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Icon name="help" className="text-m3-outline" />
          </IconButton>
        </div>

        {/* Informative Help Card */}
        {showInfo && (
          <Card variant="filled" className="bg-m3-primary-container/30 border border-m3-primary/30 p-4 rounded-xl flex flex-col gap-2">
            <Text variant="body-md" className="font-semibold text-m3-on-primary-container">{t("lossless_help_title")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              {t("lossless_help_p1")}
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              {t("lossless_help_p2")}
            </Text>
          </Card>
        )}

        {/* Error Notification */}
        {error && (
          <Card variant="filled" className="flex items-center justify-between p-4 bg-m3-error-container text-m3-on-error-container border border-m3-error/30 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <Icon name="error" className="text-m3-error shrink-0" />
              <Text variant="body-sm" className="text-m3-on-error-container font-medium">{error}</Text>
            </div>
            <IconButton colorStyle="standard" onClick={() => setError(null)} aria-label="Close error">
              <Icon name="close" size={18} className="text-m3-on-error-container" />
            </IconButton>
          </Card>
        )}

        {/* Upload Dropzone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-m3-outline-variant/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center bg-m3-surface-container-lowest/40"
            onClick={() => document.getElementById("lossless-upload")?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-m3-primary-container/40 flex items-center justify-center text-m3-primary">
              <Icon name="find_in_page" size={36} />
            </div>
            <div className="flex flex-col gap-1 max-w-lg">
              <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("lossless_drop_title")}</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">{t("lossless_drop_desc")}</Text>
            </div>

            {/* Global format badges */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xl mt-1">
              {GLOBAL_AUDIO_FORMATS.map((fmt) => (
                <span
                  key={fmt.extension}
                  className={`text-xs px-2.5 py-1 rounded-full font-mono border transition-all ${
                    fmt.isLossless
                      ? "bg-m3-primary-container/50 text-m3-primary border-m3-primary/30 font-semibold"
                      : "bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/40"
                  }`}
                  title={`${fmt.name}: ${fmt.description}`}
                >
                  .{fmt.extension.toUpperCase()}
                  {fmt.isLossless && " ★"}
                </span>
              ))}
            </div>

            <Button
              colorStyle="tonal"
              icon={<Icon name="upload_file" size={18} />}
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("lossless-upload")?.click();
              }}
            >
              {language === "vi" ? "Chọn tệp âm thanh" : "Select Audio File"}
            </Button>

            <input
              id="lossless-upload"
              type="file"
              accept={AUDIO_ACCEPT_STRING}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File info bar with format badge */}
            <Card variant="filled" className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-m3-surface-container-low rounded-xl min-w-0 border border-m3-outline-variant/40">
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-m3-primary-container flex items-center justify-center text-m3-on-primary-container shrink-0">
                  <Icon name="analytics" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text variant="body-md" className="font-semibold text-m3-on-surface truncate">
                      {file.name}
                    </Text>
                    {detectedFormat && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 border ${
                        (detectedFormat.isLossless ?? (detectedFormat.category === "lossless" || detectedFormat.category === "hi-res"))
                          ? "bg-m3-primary-container/50 text-m3-primary border-m3-primary/30"
                          : "bg-m3-secondary-container/50 text-m3-secondary border-m3-secondary/30"
                      }`}>
                        {detectedFormat.name}
                      </span>
                    )}
                  </div>
                  <Text variant="body-sm" className="text-m3-on-surface-variant">
                    {t("common_file_size")}: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </div>
              </div>
              <Button
                colorStyle="outlined"
                size="sm"
                className="shrink-0"
                icon={<Icon name="refresh" size={16} />}
                onClick={() => {
                  stopPlayback();
                  setFile(null);
                  setResult(null);
                  setDecodedBuffer(null);
                  setDetectedFormat(null);
                }}
                disabled={isLoading}
              >
                {t("lossless_check_another")}
              </Button>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card variant="outlined" className="flex flex-col items-center justify-center gap-3.5 p-8 sm:p-10 bg-m3-surface-container-low/40 rounded-2xl border-m3-outline-variant/30 text-center">
            <LoadingIndicator aria-label="Analyzing spectral cutoff" size={48} />
            <Text variant="title-sm" className="text-m3-primary font-semibold">{t("lossless_analyzing")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant max-w-md">
              {language === "vi" ? "Quá trình này được thực hiện hoàn toàn ẩn danh trên máy của bạn." : "This process runs entirely locally and privately in your browser."}
            </Text>
          </Card>
        )}

        {/* Analysis Result */}
        {result && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Verification Result Banner */}
            <Card
              variant="filled"
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors ${
                result.isRealLossless
                  ? "bg-m3-primary-container/30 border-m3-primary/30 text-m3-on-surface"
                  : result.score > 60
                    ? "bg-m3-tertiary-container/30 border-m3-tertiary/30 text-m3-on-surface"
                    : "bg-m3-error-container/40 border-m3-error/30 text-m3-on-error-container"
              }`}
            >
              <div className="flex gap-4 items-start sm:items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    result.isRealLossless
                      ? "bg-m3-primary text-m3-on-primary"
                      : result.score > 60
                        ? "bg-m3-tertiary text-m3-on-tertiary"
                        : "bg-m3-error text-m3-on-error"
                  }`}
                >
                  {result.isRealLossless ? (
                    <Icon name="verified_user" size={28} />
                  ) : result.score > 60 ? (
                    <Icon name="warning" size={28} />
                  ) : (
                    <Icon name="gpp_bad" size={28} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Text variant="title-lg" className="font-bold text-m3-on-surface">
                      {result.isRealLossless
                        ? t("lossless_result_true")
                        : result.score > 60
                          ? (language === "vi" ? "Chất Lượng Cao (Giới Hạn)" : "High Quality (Transcoded)")
                          : t("lossless_result_fake")}
                    </Text>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                        result.isRealLossless
                          ? "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/40"
                          : result.score > 60
                            ? "bg-m3-tertiary-container text-m3-tertiary border-m3-tertiary/40"
                            : "bg-m3-error-container text-m3-error border-m3-error/40"
                      }`}
                    >
                      {language === "vi" ? "Độ tin cậy" : "Confidence"}: {result.score}%
                    </span>
                  </div>
                  <Text variant="body-md" className="text-m3-on-surface-variant mt-1.5 leading-relaxed">
                    {result.isRealLossless
                      ? (language === "vi" ? "Phổ âm thanh trải rộng liên tục lên trên 20 kHz. Tệp này nguyên gốc phòng thu đạt chuẩn CD chất lượng tốt." : "Full spectral energy seamlessly extends past 20 kHz. Authentic CD/studio master quality.")
                      : result.score > 60
                        ? (language === "vi" ? "Dải cao bị suy hao hoặc có hiện tượng chặn nhẹ ở 18-19 kHz. Đây có thể là nhạc 320kbps upscaled lên." : "High band rolls off near 18-19 kHz. Likely high-bitrate MP3/AAC transcode.")
                        : (language === "vi" ? "Tần số cao bị cắt phăng đột ngột ở ngưỡng dưới 16 kHz. Đây chắc chắn là tệp MP3 chất lượng thấp bị giả mạo FLAC/WAV." : "High frequencies abruptly cut off below 16 kHz. Low-bitrate MP3 disguised as FLAC/WAV.")}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Scientific details cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <Card variant="filled" className="p-4 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center">
                <Text variant="body-sm" className="text-m3-on-surface-variant font-medium">{t("lossless_cutoff_label")}</Text>
                <Text variant="headline-sm" className="font-bold text-m3-primary mt-1 font-mono">
                  {(result.cutoffFrequency / 1000).toFixed(2)} kHz
                </Text>
              </Card>
              <Card variant="filled" className="p-4 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center">
                <Text variant="body-sm" className="text-m3-on-surface-variant font-medium">{t("lossless_high_power")}</Text>
                <Text variant="headline-sm" className="font-bold text-m3-secondary mt-1 font-mono">
                  {result.avgPowerHigh} dB
                </Text>
              </Card>
              <Card variant="filled" className="p-4 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center">
                <Text variant="body-sm" className="text-m3-on-surface-variant font-medium">{t("lossless_mid_power")}</Text>
                <Text variant="headline-sm" className="font-bold text-m3-tertiary mt-1 font-mono">
                  {result.avgPowerMid} dB
                </Text>
              </Card>
            </div>

            {/* Live Audio Preview & Real-Time Frequency Analysis */}
            {decodedBuffer && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon name="hearing" className="text-m3-primary" size={20} />
                    <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                      {language === "vi" ? "Nghe thử & Kiểm tra phổ tần số trực tiếp" : "Live Audio Preview & Frequency Analysis"}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      colorStyle="tonal"
                      onClick={togglePlayback}
                      icon={<Icon name={isPlaying ? "pause" : "play_arrow"} size={16} />}
                    >
                      {isPlaying
                        ? (language === "vi" ? "Tạm dừng" : "Pause")
                        : (language === "vi" ? "Nghe thử tệp" : "Play Preview")}
                    </Button>
                    {playbackTime > 0 && (
                      <Button
                        size="xs"
                        colorStyle="text"
                        onClick={() => {
                          stopPlayback();
                          setPlaybackTime(0);
                        }}
                        icon={<Icon name="replay" size={16} />}
                      >
                        {language === "vi" ? "Đầu bài" : "Restart"}
                      </Button>
                    )}
                  </div>
                </div>

                <FrequencyVisualizer
                  analyserNode={analyserNode}
                  isPlaying={isPlaying}
                  height={115}
                />
              </div>
            )}

            {/* Canvas Spectrum Plot */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Icon name="query_stats" className="text-m3-primary" size={20} />
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">{t("lossless_spectrum_chart")}</Text>
              </div>
              <Card variant="outlined" className="bg-m3-surface-container-lowest rounded-2xl p-4 border border-m3-outline-variant overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  className="w-full h-55 block"
                />
              </Card>
              <div className="flex flex-wrap justify-between items-center text-xs text-m3-on-surface-variant px-1 font-mono gap-y-1">
                <span>0 Hz</span>
                <span>{language === "vi" ? "Tần số kiểm tra" : "Tested Spectrum"}</span>
                <span>22050 Hz (Nyquist)</span>
              </div>
            </div>

            <Divider shape="wavy" />

            {/* Detailed scientific explanation card */}
            <Card variant="filled" className="flex items-start gap-3.5 bg-m3-surface-container-high/50 p-4.5 rounded-xl border border-m3-outline-variant/30">
              <div className="w-8 h-8 rounded-lg bg-m3-primary-container flex items-center justify-center text-m3-on-primary-container shrink-0 mt-0.5">
                <Icon name="auto_awesome" size={20} />
              </div>
              <div>
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">{language === "vi" ? "Nhận định chuyên gia" : "Acoustic Diagnosis"}</Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant mt-1 leading-relaxed">
                  {language === "vi"
                    ? `Đoạn âm thanh thử nghiệm cho thấy biên độ dải cao (${result.avgPowerHigh} dB) lệch so với dải trung (${result.avgPowerMid} dB) là ${Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB.`
                    : `Analysis shows high frequency band power (${result.avgPowerHigh} dB) deviates from mid-range (${result.avgPowerMid} dB) by ${Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB.`}
                  {result.isRealLossless
                    ? (language === "vi" ? " Mức chênh lệch này hoàn toàn nằm trong tiêu chuẩn tuyến tính tự nhiên của tệp nén không hao hụt (Lossless gốc)." : " This delta falls squarely within the natural logarithmic spectral decay of genuine uncompressed studio audio.")
                    : (language === "vi" ? " Sự suy hao đột ngột ở ngưỡng tần số này chỉ ra rằng tệp đã đi qua bộ nén khử dữ liệu (lossy encoder) trước khi được đóng gói lại." : " The steep shelf cutoff indicates the track underwent lossy perceptual encoding before being up-converted.")}
                </Text>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}

