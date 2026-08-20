/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Button, IconButton, Text, Divider, LoadingIndicator, Icon } from "@bug-on/m3-expressive";
import { KeyResult } from "../types";
import { detectKey, safeDecodeAudioData } from "../utils/audioAnalysis";

const NOTE_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function ToneDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KeyResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndDetectKey(file);
  };

  const processAndDetectKey = async (selectedFile: File) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setFile(selectedFile);
    await new Promise(resolve => setTimeout(resolve, 500));
    let audioContext: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const audioBuffer = await safeDecodeAudioData(audioContext, arrayBuffer);
      const keyResult = detectKey(audioBuffer);
      setResult(keyResult);
    } catch (err) {
      console.error("Lỗi xác định tone bài hát:", err);
      setError("Đã xảy ra lỗi khi phân tích tone bài hát. Hãy chắc chắn rằng tệp âm thanh hợp lệ và trình duyệt hỗ trợ định dạng này.");
      setFile(null);
    } finally {
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
      setIsLoading(false);
    }
  };

  const getHarmonicMatches = (camelot: string) => {
    const matches: { key: string; relation: string }[] = [];
    const matchNum = parseInt(camelot, 10);
    const matchLetter = camelot.replace(/[0-9]/g, ""); // "A" or "B"

    // 1. Same key code, opposite scale (Major <-> Minor crossover)
    const oppositeLetter = matchLetter === "A" ? "B" : "A";
    matches.push({
      key: `${matchNum}${oppositeLetter}`,
      relation: "Chuyển Đổi Trưởng/Thứ (Parallel)"
    });

    // 2. Neighbor keys (+1 and -1 step on wheel)
    const prevNum = matchNum === 1 ? 12 : matchNum - 1;
    matches.push({
      key: `${prevNum}${matchLetter}`,
      relation: "Hạ tông (Subdominant)"
    });

    const nextNum = matchNum === 12 ? 1 : matchNum + 1;
    matches.push({
      key: `${nextNum}${matchLetter}`,
      relation: "Tăng tông (Dominant)"
    });

    return matches;
  };

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="tone-tab">
      <div className="p-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1">
            <IconButton colorStyle="tonal" aria-label="Key" className="shrink-0">
              <Icon name="vpn_key" className="text-m3-primary" />
            </IconButton>
            <div className="min-w-0 flex-1">
              <Text variant="title-md" className="font-semibold text-m3-on-surface wrap-break-word whitespace-normal">Dò Tone / Thang âm bài hát</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant wrap-break-word whitespace-normal">Phân tích tần số Pitch Chroma để xác định tông chính (Key/Scale) của bản nhạc.</Text>
            </div>
          </div>

          <IconButton
            colorStyle="standard"
            aria-label="Help"
            onClick={() => setShowInfo(!showInfo)}
            className="self-end sm:self-auto shrink-0"
          >
            <Icon name="help" className="text-m3-outline" />
          </IconButton>
        </div>

        {showInfo && (
          <div className="bg-m3-primary-container/20 border border-m3-primary/20 p-4 rounded-xl flex flex-col gap-2">
            <Text variant="body-md" className="font-semibold text-m3-on-primary-container wrap-break-word whitespace-normal">Camelot System & Phối tông hòa âm là gì?</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant wrap-break-word whitespace-normal">
              Mã <strong>Camelot</strong> (ví dụ: 8B, 8A) là hệ thống đánh số mã hóa cho vòng tròn bậc năm (Circle of Fifths).
              Các DJ chuyên nghiệp sử dụng hệ thống này để trộn nhạc hòa âm (harmonic mixing) mượt mà mà không lo bị phô hay lệch tông.
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant wrap-break-word whitespace-normal">
              Các bài hát có mã kề nhau (ví dụ 8B có thể ghép hoàn hảo với 7B, 9B, hoặc 8A) sẽ có cấu trúc hòa âm tương thích và trộn lẫn với nhau tạo cảm giác tự nhiên nhất.
            </Text>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in duration-200 min-w-0 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Icon name="error" className="text-red-400 shrink-0" />
              <span className="wrap-break-word whitespace-normal min-w-0 flex-1">{error}</span>
            </div>
            <IconButton onClick={() => setError(null)} aria-label="Close error" className="shrink-0">
              <Icon name="close" size={18} className="text-red-400" />
            </IconButton>
          </div>
        )}

        {!file ? (
          <div
            className="border-2 border-dashed border-m3-outline-variant rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center"
            onClick={() => document.getElementById("tone-upload")?.click()}
          >
            <Icon name="music_note" size={64} className="text-m3-primary/60 shrink-0" />
            <div className="min-w-0">
              <Text variant="body-lg" className="font-md text-m3-on-surface wrap-break-word whitespace-normal">Chọn tệp nhạc để dò tìm Thang âm</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant wrap-break-word whitespace-normal mt-1">Thuật toán Pitch Class Profile hoạt động hoàn toàn trên client</Text>
            </div>
            <input
              id="tone-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-m3-surface-container-low rounded-xl gap-3">
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <Icon name="album" className={`text-m3-primary shrink-0 ${isLoading ? "animate-spin" : ""}`} />
                <div className="overflow-hidden min-w-0 flex-1">
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
                className="shrink-0 w-full sm:w-auto"
              >
                Dò tệp khác
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 p-6">
            <LoadingIndicator aria-label="Analyzing song key" size={40} className="shrink-0" />
            <Text variant="body-sm" className="text-m3-primary text-center wrap-break-word whitespace-normal">Đang phân tích cấu trúc nốt nhạc và lập bản đồ Chroma...</Text>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Split Key Result Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Core Key Panel */}
              <div className="p-4 sm:p-5 bg-m3-primary-container/20 border border-m3-primary/15 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
                <Text variant="body-sm" className="text-m3-on-surface-variant uppercase tracking-wider font-semibold text-[10px] sm:text-xs md:text-sm text-center">Tông chủ phát hiện (Key)</Text>
                <Text variant="display-md" className="font-extrabold text-m3-primary mt-1 text-2xl sm:text-4xl md:text-5xl">
                  {result.keyName}
                </Text>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <div className="bg-m3-secondary text-m3-on-secondary font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shrink-0">
                    Mã Camelot: {result.camelot}
                  </div>
                  <div className="bg-m3-tertiary-container text-m3-on-tertiary-container font-semibold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shrink-0">
                    Độ tin cậy: {result.confidence}%
                  </div>
                </div>
              </div>

              {/* Harmonic Compatible Suggestions */}
              <div className="p-4 sm:p-5 bg-m3-surface-container-high rounded-2xl flex flex-col gap-3">
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">Tông phối hòa âm tương thích (Mixable)</Text>
                <div className="flex flex-col gap-2">
                  {getHarmonicMatches(result.camelot).map(match => (
                    <div key={match.key} className="flex items-center justify-between p-2 sm:p-2.5 bg-m3-surface-container-lowest rounded-xl border border-m3-outline-variant/50 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon name="arrow_forward" className="text-m3-secondary shrink-0" size={16} />
                        <Text variant="body-md" className="text-m3-on-surface-variant text-xs font-md wrap-break-word whitespace-normal leading-tight">
                          {match.relation}
                        </Text>
                      </div>
                      <div className="bg-m3-secondary-container text-m3-on-secondary-container font-mono font-bold px-2 sm:px-3 py-0.5 text-xs rounded-md shrink-0">
                        {match.key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <Divider shape='wavy' />

            {/* Chroma Profiler Graph */}
            <div className="flex flex-col gap-3">
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">Bản đồ phân phối năng lượng nốt nhạc (Chromagram Profiler)</Text>

              <div className="w-full">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 w-full">
                  {result.chroma.map((energy, idx) => {
                    const isDetectedNote = result.keyName.startsWith(NOTE_LABELS[idx]);
                    return (
                      <div
                        key={NOTE_LABELS[idx]}
                        className={`min-w-0 px-0.5 py-1.5 sm:p-2 rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-2 justify-end min-h-20 sm:min-h-22.5 border transition-colors ${isDetectedNote
                          ? "bg-m3-primary/10 border-m3-primary/40 text-m3-primary"
                          : "bg-m3-surface-container-low border-m3-outline-variant/40 text-m3-on-surface-variant"
                          }`}
                      >
                        {/* Height-based energy bar */}
                        <div className="w-full bg-m3-outline-variant/20 rounded-md h-7.5 sm:h-10 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-sm transition-all duration-500 ${isDetectedNote ? "bg-m3-primary" : "bg-m3-outline"
                              }`}
                            style={{ height: `${Math.max(5, energy * 100)}%` }}
                          />
                        </div>
                        <div className="text-center min-w-0">
                          <Text variant="label-md" className="font-bold text-[10px] sm:text-xs leading-none">{NOTE_LABELS[idx]}</Text>
                          <span className="text-[8px] sm:text-[9px] block font-mono mt-0.5">{(energy * 10).toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Text variant="body-sm" className="text-m3-on-surface-variant text-center mt-1 wrap-break-word whitespace-normal">Các nốt có mức năng lượng cao nhất quyết định cấu trúc giọng và thang âm của toàn bài hát.</Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
