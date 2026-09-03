/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  IconButton,
  Text,
  Divider,
  LoadingIndicator,
  Icon,
} from "@bug-on/m3-expressive";
import { AudioFormatInfo, BPMResult } from "../types";
import { detectBPM, safeDecodeAudioData } from "../utils/audioAnalysis";
import { AUDIO_ACCEPT_STRING, detectAudioFormat, GLOBAL_AUDIO_FORMATS } from "../utils/audioFormats";
import { useLanguage } from "../i18n/LanguageContext";

export function TempoDetector() {
  const { t, language } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<AudioFormatInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BPMResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tap Tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapBPM, setTapBPM] = useState<number | null>(null);

  // Animated pulse rate
  const [pulseActive, setPulseActive] = useState(false);
  const pulseIntervalRef = useRef<number | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndDetectBPM(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processAndDetectBPM(droppedFile);
  };

  const processAndDetectBPM = async (selectedFile: File) => {
    setIsLoading(true);
    setResult(null);
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
      const bpmResult = detectBPM(audioBuffer);
      setResult(bpmResult);
    } catch (err: any) {
      console.error("Lỗi đo tempo bài hát:", err);
      setError(
        err?.message ||
        (language === "vi"
          ? "Đã xảy ra lỗi khi phân tích tempo của bài hát này. Hãy chắc chắn rằng tệp âm thanh hợp lệ."
          : "Failed to analyze BPM for this audio file.")
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

  const activeBPM = result?.bpm || tapBPM || null;

  useEffect(() => {
    if (pulseIntervalRef.current) { clearInterval(pulseIntervalRef.current); pulseIntervalRef.current = null; }
    if (!activeBPM) return;
    const intervalMs = (60 / activeBPM) * 1000;
    pulseIntervalRef.current = window.setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 150);
    }, intervalMs);
    return () => { if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current); };
  }, [activeBPM]);

  const handleTap = () => {
    const now = performance.now();
    const newTapTimes = [...tapTimes, now].slice(-12);
    setTapTimes(newTapTimes);
    if (newTapTimes.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const averageInterval = intervals.reduce((acc, curr) => acc + curr, 0) / intervals.length;
      const bpm = Math.round(60000 / averageInterval);
      if (bpm >= 40 && bpm <= 240) setTapBPM(bpm);
    }
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 100);
  };

  const resetTap = () => {
    setTapTimes([]);
    setTapBPM(null);
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="tempo-tab">
      {/* Auto Beat Finder Card */}
      <Card variant="outlined" className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40">
        <div className="flex items-start gap-3 min-w-0">
          <IconButton colorStyle="tonal" aria-label="Timer">
            <Icon name="timer" className="text-m3-primary" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("tempo_title")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">{t("tempo_desc")}</Text>
          </div>
        </div>

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

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-m3-outline-variant/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center bg-m3-surface-container-lowest/40"
            onClick={() => document.getElementById("tempo-upload")?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-m3-primary-container/40 flex items-center justify-center text-m3-primary">
              <Icon name="music_note" size={36} />
            </div>
            <div className="flex flex-col gap-1 max-w-lg">
              <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("tempo_drop_title")}</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">{t("tempo_drop_desc")}</Text>
            </div>

            {/* Global format chips */}
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
                document.getElementById("tempo-upload")?.click();
              }}
            >
              {language === "vi" ? "Chọn tệp âm thanh" : "Select Audio File"}
            </Button>

            <input
              id="tempo-upload"
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
                  <Icon name="album" className={isLoading ? "animate-spin" : ""} />
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
                  setFile(null);
                  setResult(null);
                  setDetectedFormat(null);
                }}
                disabled={isLoading}
              >
                {t("tempo_check_another")}
              </Button>
            </Card>
          </div>
        )}

        {isLoading && (
          <Card variant="outlined" className="flex flex-col items-center justify-center gap-3.5 p-8 sm:p-10 bg-m3-surface-container-low/40 rounded-2xl border-m3-outline-variant/30 text-center">
            <LoadingIndicator aria-label="Calculating song BPM" size={48} />
            <Text variant="title-sm" className="text-m3-primary font-semibold">{t("tempo_analyzing")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant max-w-md">
              {language === "vi" ? "Đang phân tích phổ âm thanh và các đỉnh nhịp điệu trên máy của bạn..." : "Analyzing audio spectrum and rhythmic energy peaks locally..."}
            </Text>
          </Card>
        )}

        {result && (
          <Card variant="filled" className="flex flex-col items-center gap-5 p-6 bg-m3-primary-container/25 border border-m3-primary/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center">
              <Text variant="body-sm" className="text-m3-on-surface-variant uppercase tracking-wider font-semibold">{t("tempo_result_label")}</Text>
              <div className="flex items-baseline justify-center gap-1.5 mt-1">
                <Text variant="display-lg" className="font-extrabold text-m3-primary font-mono tracking-tight text-5xl sm:text-6xl">
                  {result.bpm}
                </Text>
                <Text variant="title-md" className="text-m3-on-surface-variant font-semibold">BPM</Text>
              </div>
              <div className="flex items-center justify-center gap-2.5 mt-2.5 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                  result.confidence > 75
                    ? "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/40"
                    : "bg-m3-tertiary-container text-m3-on-tertiary-container border-m3-tertiary/40"
                }`}>
                  {language === "vi" ? "Độ tin cậy" : "Confidence"}: {result.confidence}%
                </span>
                <Text variant="body-sm" className="text-m3-on-surface-variant font-medium">
                  {language === "vi" ? `Phát hiện ${result.peaksCount} điểm nhấn nhịp` : `${result.peaksCount} rhythmic peaks`}
                </Text>
              </div>
            </div>

            {/* Pulsing indicator to preview BPM speed */}
            <div className="flex flex-col items-center gap-2 mt-1">
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-100 ${
                pulseActive
                  ? "scale-125 bg-m3-primary-container/60 border-m3-primary shadow-md"
                  : "scale-100 bg-m3-surface-container-low/60 border-m3-outline-variant/50"
              }`}>
                <Icon name="favorite" fill={pulseActive ? 1 : 0} size={28} className="text-m3-primary transition-all" />
              </div>
              <Text variant="body-sm" className="text-m3-on-surface-variant text-center font-mono text-xs">
                {language === "vi" ? "Nhịp tim đập theo nhịp điệu của bài hát" : "Pulsing to detected track tempo"}
              </Text>
            </div>
          </Card>
        )}
      </Card>

      <Divider shape="wavy" />

      {/* Manual Tap Tempo Card */}
      <Card variant="outlined" className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40">
        <div className="flex items-start gap-3 min-w-0">
          <IconButton colorStyle="tonal" aria-label="Manual tap">
            <Icon name="touch_app" className="text-m3-secondary" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">{t("tempo_tap_title")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">{t("tempo_tap_desc")}</Text>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 py-2">
          <div className="text-center h-20 flex flex-col justify-center">
            {tapBPM ? (
              <div className="animate-in zoom-in-95 duration-100">
                <Text variant="body-sm" className="text-m3-on-surface-variant uppercase tracking-wider font-semibold">{t("tempo_tap_current")}</Text>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <Text variant="display-lg" className="font-extrabold text-m3-secondary font-mono text-5xl sm:text-6xl">
                    {tapBPM}
                  </Text>
                  <Text variant="title-md" className="text-m3-on-surface-variant font-semibold">BPM</Text>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Text variant="body-md" className="text-m3-on-surface-variant italic font-medium">
                  {language === "vi" ? "Nhấn phím hoặc chạm nút bên dưới theo nhịp..." : "Click or tap button rhythmically..."}
                </Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant/80 text-xs">
                  {language === "vi" ? "Hãy đệm từ 4 nhịp trở lên liên tục" : "Tap at least 4 times consistently"}
                </Text>
              </div>
            )}
          </div>

          {/* Big Tap Interactive Card */}
          <Card
            interactive
            variant="filled"
            onClick={handleTap}
            className={`w-full max-w-72 h-36 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer select-none active:scale-95 transition-all duration-150 ${
              pulseActive && tapBPM
                ? "bg-m3-secondary-container/50 border-m3-secondary shadow-md"
                : "bg-m3-surface-container-low border-m3-outline-variant/40 hover:bg-m3-surface-container-high"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 ${
              pulseActive && tapBPM ? "scale-110 bg-m3-secondary text-m3-on-secondary" : "bg-m3-secondary-container/50 text-m3-secondary"
            }`}>
              <Icon name="album" size={28} className={pulseActive && tapBPM ? "rotate-45" : ""} />
            </div>
            <Text variant="title-md" className="font-bold text-m3-on-surface">{t("tempo_tap_button")}</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant text-xs font-mono">
              {tapTimes.length > 0
                ? (language === "vi" ? `Đã đệm ${tapTimes.length} lần` : `${tapTimes.length} taps recorded`)
                : (language === "vi" ? "Chạm hoặc đệm theo nhịp" : "Tap to Beat")}
            </Text>
          </Card>

          {tapTimes.length > 0 && (
            <Button
              colorStyle="outlined"
              size="sm"
              icon={<Icon name="restart_alt" size={16} />}
              onClick={resetTap}
            >
              {t("tempo_tap_reset")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
