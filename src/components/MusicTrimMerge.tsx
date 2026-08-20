/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Button, Card, RangeSlider, IconButton, Text, Divider, LoadingIndicator, Icon, useSnackbar } from "@bug-on/m3-expressive";
import { AudioTrack } from "../types";
import { bufferToWav } from "../utils/wavEncoder";
import { safeDecodeAudioData } from "../utils/audioAnalysis";

export function MusicTrimMerge() {
  const { showSnackbar } = useSnackbar();
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [mergeQueue, setMergeQueue] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const genId = () => Math.random().toString(36).substr(2, 9);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    return audioContextRef.current;
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
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await safeDecodeAudioData(ctx, arrayBuffer);

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
      };

      setTrack(newTrack);
      setTrimRange([0, 100]);
      startOffsetRef.current = 0;
      setPlaybackTime(0);
    } catch (err) {
      console.error("Lỗi giải mã âm thanh:", err);
      setError("Không thể giải mã tệp âm thanh này. Hãy thử sử dụng tệp MP3, WAV hoặc FLAC hợp lệ và đảm bảo tệp tin không bị lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!track || !track.audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = track.audioBuffer;
    const leftChannel = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
    ctx.fillRect(0, 0, width, height);

    const step = Math.ceil(leftChannel.length / width);
    const amp = height / 2;
    ctx.lineWidth = 1.5;

    const leftBound = (trimRange[0] / 100) * width;
    const rightBound = (trimRange[1] / 100) * width;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = leftChannel[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const isInsideTrim = i >= leftBound && i <= rightBound;
      ctx.strokeStyle = isInsideTrim ? "var(--md-sys-color-primary, #D0BCFF)" : "rgba(208, 188, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(i, amp + min * amp * 0.95);
      ctx.lineTo(i, amp + max * amp * 0.95);
      ctx.stroke();
    }

    if (isPlaying && track.duration) {
      const currentTrimStart = (trimRange[0] / 100) * track.duration;
      const currentTrimEnd = (trimRange[1] / 100) * track.duration;
      const trimLen = currentTrimEnd - currentTrimStart;
      const playProgress = (playbackTime - currentTrimStart) / trimLen;
      const x = leftBound + playProgress * (rightBound - leftBound);
      if (x >= leftBound && x <= rightBound) {
        ctx.strokeStyle = "var(--md-sys-color-error, #F2B8B5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  }, [track, trimRange, isPlaying, playbackTime]);

  const startPlayback = () => {
    if (!track || !track.audioBuffer) return;
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    stopPlayback();

    const duration = track.duration;
    const startSec = (trimRange[0] / 100) * duration;
    const endSec = (trimRange[1] / 100) * duration;
    const durationToPlay = endSec - startSec;

    if (startOffsetRef.current < startSec || startOffsetRef.current >= endSec) {
      startOffsetRef.current = startSec;
    }

    const source = ctx.createBufferSource();
    source.buffer = track.audioBuffer;
    source.connect(ctx.destination);

    const timeRemaining = endSec - startOffsetRef.current;

    source.start(0, startOffsetRef.current, timeRemaining);
    sourceNodeRef.current = source;
    startTimeRef.current = ctx.currentTime - (startOffsetRef.current - startSec);
    setIsPlaying(true);

    source.onended = () => {
      const currentPlayback = ctx.currentTime - startTimeRef.current + startSec;
      if (currentPlayback >= endSec - 0.05) {
        setIsPlaying(false);
        startOffsetRef.current = startSec;
        setPlaybackTime(startSec);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
    };

    const updatePlayhead = () => {
      if (!isPlaying) return;
      const elapsed = ctx.currentTime - startTimeRef.current;
      const currentPos = startSec + elapsed;
      if (currentPos <= endSec) {
        setPlaybackTime(currentPos);
        startOffsetRef.current = currentPos;
        rafRef.current = requestAnimationFrame(updatePlayhead);
      } else {
        setIsPlaying(false);
        startOffsetRef.current = startSec;
        setPlaybackTime(startSec);
      }
    };
    rafRef.current = requestAnimationFrame(updatePlayhead);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { }
      sourceNodeRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
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
    };

    setMergeQueue([...mergeQueue, queueItem]);
    showSnackbar({
      message: "Đã thêm đoạn nhạc đã cắt!",
      withDismissAction: true,
    });
  };

  const removeFromQueue = (id: string) => {
    setMergeQueue(mergeQueue.filter(item => item.id !== id));
  };

  const handleMergeAndExport = async () => {
    if (mergeQueue.length === 0) return;
    setIsMerging(true);
    await new Promise(resolve => setTimeout(resolve, 500));
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

      const wavBlob = bufferToWav(mergedBuffer);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GhepNhac_${new Date().toISOString().slice(0, 10)}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi ghép nhạc:", err);
      setError("Đã xảy ra lỗi khi ghép nhạc. Vui lòng kiểm tra lại định dạng tệp.");
    } finally {
      setIsMerging(false);
    }
  };

  useEffect(() => { return () => { stopPlayback(); }; }, []);

  useEffect(() => { setError(null); }, [track, mergeQueue]);

  const { start: trimmedStart, end: trimmedEnd, length: trimmedLength } = getTrimmedDurations();

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="trim-merge-tab">
      <div className="p-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <IconButton colorStyle="tonal" aria-label="Scissors">
            <Icon name="content_cut" className="text-m3-primary" />
          </IconButton>
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">Cắt ghép & Sắp xếp nhạc</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">Tải nhạc lên, chỉnh khoảng thời gian cần cắt, sau đó thêm vào hàng đợi ghép nối.</Text>
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

        {/* Dropzone container */}
        {!track ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-m3-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center"
            onClick={() => document.getElementById("audio-upload")?.click()}
          >
            <Icon name="audiotrack" size={64} className="text-m3-primary/60" />
            <div>
              <Text variant="body-lg" className="font-md text-m3-on-surface">Kéo thả tệp âm thanh vào đây</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">hoặc nhấp chuột để chọn tệp từ thiết bị</Text>
            </div>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File info bar */}
            <div className="flex items-center gap-2 p-3 bg-m3-surface-container-low rounded-xl min-w-0">
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <Icon name="audiotrack" className="text-m3-primary shrink-0" />
                <div className="overflow-hidden">
                  <Text variant="body-md" className="font-md text-m3-on-surface truncate block">
                    {track.name}
                  </Text>
                  <Text variant="body-sm" className="text-m3-on-surface-variant">
                    {formatTime(track.duration)} • {(track.size / (1024 * 1024)).toFixed(2)} MB • {track.sampleRate}Hz
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
                Đổi tệp
              </Button>
            </div>

            {/* Canvas Waveform visualizer */}
            <div className="relative bg-m3-surface-container-lowest rounded-xl overflow-hidden border border-m3-outline-variant">
              <canvas
                ref={canvasRef}
                width={600}
                height={120}
                className="w-full h-30 block"
              />
              <div className="absolute bottom-2 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md font-mono">
                {formatTime(playbackTime)} / {formatTime(track.duration)}
              </div>
            </div>

            {/* Slider Range Trimming */}
            <div className="px-2 py-1 flex flex-col gap-1">
              <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-xs text-m3-on-surface-variant font-mono">
                <span>Cắt từ: {formatTime(trimmedStart)}</span>
                <span className="font-semibold text-m3-primary">Độ dài: {formatTime(trimmedLength)}</span>
                <span>Đến: {formatTime(trimmedEnd)}</span>
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
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                colorStyle="tonal"
                onClick={togglePlayback}
                icon={isPlaying ? <Icon name="pause" /> : <Icon name="play_arrow" />}
              >
                {isPlaying ? "Tạm dừng nghe" : "Nghe thử"}
              </Button>

              <Button
                colorStyle="outlined"
                onClick={resetTrim}
                icon={<Icon name="restart_alt" />}
                disabled={trimRange[0] === 0 && trimRange[1] === 100}
              >
                Đặt lại
              </Button>

              <Button
                colorStyle="filled"
                onClick={addToMergeQueue}
                icon={<Icon name="add" />}
              >
                Thêm vào hàng đợi ghép
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 p-4">
            <LoadingIndicator aria-label="Đang phân tích" size={40} />
            <Text variant="body-sm" className="text-m3-primary">Đang tải và giải mã tệp âm thanh...</Text>
          </div>
        )}
      </div>

      {/* Merge Queue / Splicing Manager Card */}
      <div className="p-5 flex flex-col gap-4 overflow-hidden border border-m3-outline-variant/30 rounded-2xl bg-transparent">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <IconButton colorStyle="tonal" aria-label="Merge queue">
              <Icon name="play_arrow" className="text-m3-secondary rotate-90" />
            </IconButton>
            <div className="overflow-hidden min-w-0">
              <Text variant="title-md" className="font-semibold text-m3-on-surface">Danh sách ghép nối ({mergeQueue.length})</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">Các đoạn nhạc sẽ được nối tiếp nhau theo thứ tự dưới đây.</Text>
            </div>
          </div>

          {mergeQueue.length > 0 && (
            <Button
              colorStyle="text"
              className="shrink-0"
              onClick={() => setMergeQueue([])}
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        <Divider shape='wavy' />

        {mergeQueue.length === 0 ? (
          <div className="p-8 text-center text-m3-on-surface-variant/60 flex flex-col items-center justify-center gap-2">
            <Icon name="content_cut" size={40} className="text-m3-on-surface-variant/40" />
            <Text variant="body-md">Chưa có đoạn nhạc nào được xếp hàng.</Text>
            <Text variant="body-sm">Chỉnh khoảng cắt ở trên và nhấn "Thêm vào hàng đợi ghép".</Text>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* List segments */}
            <div className="flex flex-col gap-2 max-h-55 overflow-y-auto pr-1">
              {mergeQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-m3-surface-container-high rounded-xl border border-m3-outline-variant"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <Text variant="body-md" className="font-md text-m3-on-surface truncate block">
                        {item.name}
                      </Text>
                      <Text variant="body-sm" className="text-m3-on-surface-variant">
                        Độ dài: {formatTime(item.duration)}
                      </Text>
                    </div>
                  </div>
                  <IconButton
                    aria-label="Xóa"
                    onClick={() => removeFromQueue(item.id)}
                  >
                    <Icon name="delete" />
                  </IconButton>
                </div>
              ))}
            </div>

            {/* Export and merge action */}
            <div className="flex flex-col gap-3 items-center mt-3 p-3 bg-m3-primary-container/20 rounded-xl border border-m3-primary/10">
              <div className="text-center">
                <Text variant="body-md" className="font-semibold text-m3-primary">Tổng thời lượng tệp xuất: {formatTime(
                  mergeQueue.reduce((acc, curr) => acc + curr.duration, 0)
                )}</Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant">Nhạc sẽ được xuất ở dạng WAV lossless 16-bit PCM chất lượng phòng thu.</Text>
              </div>

              <Button
                colorStyle="filled"
                onClick={handleMergeAndExport}
                icon={<Icon name="download" />}
                disabled={isMerging}
                className="w-full sm:w-auto"
              >
                {isMerging ? "Đang ghép & mã hóa..." : "Ghép nhạc & Tải về (.WAV)"}
              </Button>
            </div>
          </div>
        )}

        {isMerging && (
          <div className="flex flex-col items-center gap-3 p-4">
            <LoadingIndicator aria-label="Đang xử lý" size={40} />
            <Text variant="body-sm" className="text-m3-secondary">Đang nối các kênh âm thanh và đóng gói mã hóa PCM WAV...</Text>
          </div>
        )}
      </div>
    </div>
  );
}
