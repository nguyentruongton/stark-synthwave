/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, Button, IconButton, Text, Divider, LoadingIndicator, Badge, Icon } from "@bug-on/md3-react";
import { BPMResult } from "../types";
import { detectBPM, safeDecodeAudioData } from "../utils/audioAnalysis";

export function TempoDetector() {
  const [file, setFile] = useState<File | null>(null);
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

  const processAndDetectBPM = async (selectedFile: File) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setFile(selectedFile);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer);
      
      const bpmResult = detectBPM(audioBuffer);
      setResult(bpmResult);
    } catch (err) {
      console.error("Lỗi đo tempo bài hát:", err);
      setError("Đã xảy ra lỗi khi phân tích tempo của bài hát này. Hãy chắc chắn rằng tệp âm thanh hợp lệ và trình duyệt hỗ trợ định dạng này.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup pulsing animation depending on active BPM
  const activeBPM = result?.bpm || tapBPM || null;
  
  useEffect(() => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    
    if (!activeBPM) return;
    
    const intervalMs = (60 / activeBPM) * 1000;
    
    pulseIntervalRef.current = window.setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 150);
    }, intervalMs);
    
    return () => {
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    };
  }, [activeBPM]);

  // Tap Tempo Logic
  const handleTap = () => {
    const now = performance.now();
    const newTapTimes = [...tapTimes, now].slice(-12); // Keep last 12 taps for dynamic average
    setTapTimes(newTapTimes);
    
    if (newTapTimes.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      
      // Calculate average interval in milliseconds
      const averageInterval = intervals.reduce((acc, curr) => acc + curr, 0) / intervals.length;
      const bpm = Math.round(60000 / averageInterval);
      
      if (bpm >= 40 && bpm <= 240) {
        setTapBPM(bpm);
      }
    }
    
    // Trigger momentary single tap flash
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 100);
  };

  const resetTap = () => {
    setTapTimes([]);
    setTapBPM(null);
  };

  return (
    <div className="flex flex-col gap-6" id="tempo-tab">
      {/* Auto Beat Finder Card */}
      <Card variant="elevated" className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <IconButton colorStyle="tonal" aria-label="Timer">
            <Icon name="timer" className="text-m3-primary" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">Đo Tempo bài hát (Tự động)</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">Tải tệp âm thanh lên để thuật toán đếm nhịp bass tự động đo chỉ số BPM (Tempo).</Text>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Icon name="error" className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <IconButton onClick={() => setError(null)} aria-label="Close error">
              <Icon name="close" size={18} className="text-red-400" />
            </IconButton>
          </div>
        )}

        {!file ? (
          <div
            className="border-2 border-dashed border-m3-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center"
            onClick={() => document.getElementById("tempo-upload")?.click()}
          >
            <Icon name="music_note" size={64} className="text-m3-primary/60" />
            <div>
              <Text variant="body-lg" className="font-md text-m3-on-surface">Chọn tệp bài hát để bắt đầu đo</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">Hỗ trợ các định dạng MP3, WAV, FLAC, M4A...</Text>
            </div>
            <input
              id="tempo-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-m3-surface-container-low rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <Icon name="album" className={`text-m3-primary shrink-0 ${isLoading ? "animate-spin" : ""}`} />
                <div className="overflow-hidden">
                  <Text variant="body-md" className="font-md text-m3-on-surface truncate block">
                    {file.name}
                  </Text>
                  <Text variant="body-sm" className="text-m3-on-surface-variant">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </div>
              </div>
              <Button
                colorStyle="text"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                disabled={isLoading}
              >
                Đo bài khác
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 p-6">
            <LoadingIndicator aria-label="Calculating song BPM" size={40} />
            <Text variant="body-sm" className="text-m3-primary">Đang đếm nhịp trống bass và phân tích tốc độ BPM...</Text>
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-4 p-4 bg-m3-primary-container/20 border border-m3-primary/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center">
              <Text variant="body-sm" className="text-m3-on-surface-variant uppercase tracking-wider font-semibold">Kết quả đo tự động</Text>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <Text variant="display-lg" className="font-extrabold text-m3-primary font-mono tracking-tight">
                  {result.bpm}
                </Text>
                <Text variant="title-md" className="text-m3-on-surface-variant font-md">BPM</Text>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={result.confidence > 75 ? "bg-green-600 text-white" : "bg-amber-600 text-white"}>
                  Độ tin cậy: {result.confidence}%
                </Badge>
                <Text variant="body-sm" className="text-m3-on-surface-variant">
                  Phát hiện {result.peaksCount} điểm nhấn
                </Text>
              </div>
            </div>

            {/* Pulsing indicator to preview BPM speed */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className={`w-16 h-16 rounded-full border-4 border-m3-primary/20 flex items-center justify-center transition-all duration-100 ${
                pulseActive ? "scale-125 bg-m3-primary/20 border-m3-primary/60" : "scale-100 bg-transparent"
              }`}>
                <Icon name="favorite" fill={pulseActive ? 1 : 0} size={28} className="text-m3-primary" />
              </div>
              <Text variant="body-sm" className="text-m3-on-surface-variant text-center font-mono">Nhịp tim đập theo nhịp điệu của bài hát</Text>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Tap Tempo Card */}
      <Card variant="outlined" className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <IconButton colorStyle="tonal" aria-label="Manual tap">
            <Icon name="play_arrow" className="text-m3-secondary rotate-90" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">Gõ Nhịp thủ công (Tap Tempo)</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">Nhấp chuột hoặc chạm tay vào nút đệm theo nhịp nhạc đang nghe để tự ước lượng BPM.</Text>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-3">
          <div className="text-center h-20 flex flex-col justify-center">
            {tapBPM ? (
              <div className="animate-in zoom-in-95 duration-100">
                <Text variant="body-sm" className="text-m3-on-surface-variant uppercase tracking-wider font-semibold">Tốc độ hiện tại</Text>
                <div className="flex items-baseline justify-center gap-1">
                  <Text variant="display-lg" className="font-extrabold text-m3-secondary font-mono">
                    {tapBPM}
                  </Text>
                  <Text variant="title-md" className="text-m3-on-surface-variant font-md">BPM</Text>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Text variant="body-md" className="text-m3-on-surface-variant italic">Nhấn phím hoặc đệm nút bên dưới...</Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant/70 text-xs">Hãy chạm từ 4 nhịp trở lên liên tục</Text>
              </div>
            )}
          </div>

          {/* Big Tap Button */}
          <button
            onClick={handleTap}
            className={`w-full max-w-[280px] h-[140px] rounded-3xl border-2 border-m3-secondary/30 flex flex-col items-center justify-center gap-2 cursor-pointer outline-none select-none active:scale-95 transition-all duration-100 ${
              pulseActive && tapBPM 
                ? "bg-m3-secondary/20 border-m3-secondary shadow-md" 
                : "bg-m3-surface-container-low hover:bg-m3-surface-container-high"
            }`}
          >
            <Icon name="album" size={40} className={`text-m3-secondary transition-transform duration-100 ${pulseActive && tapBPM ? "rotate-45" : ""}`} />
            <Text variant="title-md" className="font-bold text-m3-on-surface">ĐỆM NHỊP VÀO ĐÂY</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant text-xs">
              {tapTimes.length > 0 ? `Đã đệm ${tapTimes.length} lần` : "Tap to Beat"}
            </Text>
          </button>

          {tapTimes.length > 0 && (
            <Button
              colorStyle="text"
              onClick={resetTap}
            >
              Đặt lại đệm nhịp
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
