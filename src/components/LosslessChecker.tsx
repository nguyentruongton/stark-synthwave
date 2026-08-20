/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, Button, IconButton, Text, Divider, LoadingIndicator, Badge, Icon } from "@bug-on/m3-expressive";
import { QualityResult } from "../types";
import { analyzeLosslessQuality, safeDecodeAudioData } from "../utils/audioAnalysis";

export function LosslessChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      const qualityResult = analyzeLosslessQuality(audioBuffer);
      setResult(qualityResult);
    } catch (err) {
      console.error("Lỗi phân tích chất lượng nhạc:", err);
      setError("Không thể phân tích tệp âm thanh này. Hãy chắc chắn rằng đây là tệp nhạc hợp lệ và trình duyệt hỗ trợ định dạng này.");
      setFile(null);
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

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    // Vertical grid lines (4k, 8k, 12k, 16k, 20k Hz)
    const gridFreqs = [4000, 8000, 12000, 16000, 20000];
    ctx.fillStyle = "#9092A3"; // Matches on-surface-variant grey
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
    ctx.strokeStyle = result.isRealLossless
      ? "var(--md-sys-color-primary, #D0BCFF)"
      : "var(--md-sys-color-error, #F2B8B5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    points.forEach((pt, idx) => {
      const x = (pt.frequency / 22050) * width;
      const y = (pt.power / -100) * (height - 20); // invert dB to pixels

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under spectrum
    ctx.lineTo(width, height - 20);
    ctx.lineTo(0, height - 20);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (result.isRealLossless) {
      gradient.addColorStop(0, "rgba(208, 188, 255, 0.25)");
      gradient.addColorStop(1, "rgba(208, 188, 255, 0)");
    } else {
      gradient.addColorStop(0, "rgba(242, 184, 181, 0.25)");
      gradient.addColorStop(1, "rgba(242, 184, 181, 0)");
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    // Cutoff frequency marker
    const cutoffX = (result.cutoffFrequency / 22050) * width;
    ctx.strokeStyle = "var(--md-sys-color-tertiary, #E5BAD6)";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutoffX, 0);
    ctx.lineTo(cutoffX, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "var(--md-sys-color-tertiary, #E5BAD6)";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = cutoffX > width * 0.7 ? "right" : "left";
    const textX = cutoffX > width * 0.7 ? cutoffX - 5 : cutoffX + 5;
    ctx.fillText(`Giới hạn tần số: ${(result.cutoffFrequency / 1000).toFixed(1)}kHz`, textX, 20);

  }, [result]);

  return (
    <div className="flex flex-col gap-6 overflow-hidden" id="lossless-tab">
      <div className="p-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
            <IconButton colorStyle="tonal" aria-label="Shield check">
              <Icon name="verified_user" className="text-m3-primary" />
            </IconButton>
            <div>
              <Text variant="title-md" className="font-semibold text-m3-on-surface">Kiểm tra nhạc lossless Thật/Giả</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">Phân tích tần số để phát hiện tệp nhạc MP3 nén bị thổi phồng dung lượng thành FLAC/WAV.</Text>
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

        {showInfo && (
          <div className="bg-m3-primary-container/20 border border-m3-primary/20 p-4 rounded-xl flex flex-col gap-2">
            <Text variant="body-md" className="font-semibold text-m3-on-primary-container">Chỉ số này hoạt động thế nào?</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              Nhạc nén (Lossy) như MP3 hay AAC thường loại bỏ triệt để các tần số cao trên <strong>15 kHz - 16 kHz</strong> để giảm kích thước tệp.
              Khi một tệp MP3 được chuyển đổi giả tạo thành WAV hoặc FLAC ("upscaled/fake lossless"), biểu đồ tần số vẫn sẽ bị giới hạn nghiêm ngặt ở mốc này.
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              Tệp <strong>Lossless thật (100% gốc)</strong> giữ nguyên toàn bộ phổ âm thanh lên tới <strong>20 kHz - 22 kHz</strong> mà không có bất kỳ đường cắt gắt nào.
            </Text>
          </div>
        )}

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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-m3-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center"
            onClick={() => document.getElementById("lossless-upload")?.click()}
          >
            <Icon name="find_in_page" size={64} className="text-m3-primary/60" />
            <div>
              <Text variant="body-lg" className="font-md text-m3-on-surface">Chọn tệp nhạc FLAC, WAV, MP3 cần kiểm tra</Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">Hệ thống sẽ quét phổ âm thanh và đưa ra phân tích chính xác</Text>
            </div>
            <input
              id="lossless-upload"
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
                <Icon name="analytics" className="text-m3-primary shrink-0" />
                <div className="overflow-hidden">
                  <Text variant="body-md" className="font-md text-m3-on-surface truncate block">
                    {file.name}
                  </Text>
                  <Text variant="body-sm" className="text-m3-on-surface-variant">
                    Size: {(file.size / (1024 * 1024)).toFixed(2)} MB • Tệp đang được phân tích
                  </Text>
                </div>
              </div>
              <Button
                colorStyle="text"
                className="shrink-0"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                disabled={isLoading}
              >
                Chọn tệp khác
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 p-8">
            <LoadingIndicator aria-label="Analyzing spectral cutoff" size={48} />
            <Text variant="body-md" className="text-m3-primary font-md">Đang giải mã và chạy thuật toán FFT phân tích phổ...</Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">Quá trình này được thực hiện hoàn toàn ẩn danh trên máy của bạn.</Text>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Verification Result Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${result.isRealLossless
              ? "bg-green-500/10 border-green-500/20 text-green-200"
              : result.score > 60
                ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                : "bg-red-500/10 border-red-500/20 text-red-200"
              }`}>
              <div className="flex gap-4 items-start sm:items-center">
                <div className={`p-3 rounded-full shrink-0 ${result.isRealLossless ? "bg-green-500/20 text-green-400" : result.score > 60 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                  }`}>
                  {result.isRealLossless ? (
                    <Icon name="verified_user" size={32} />
                  ) : result.score > 60 ? (
                    <Icon name="warning" size={32} />
                  ) : (
                    <Icon name="gpp_bad" size={32} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text variant="title-lg" className="font-bold text-m3-on-surface">
                      {result.isRealLossless ? "Lossless Chuẩn Xịn" : result.score > 60 ? "Chất Lượng Cao (Giới Hạn)" : "Fake Lossless (Nhạc Giả)"}
                    </Text>
                    <Badge className={
                      result.isRealLossless ? "bg-green-950/40 text-green-300 border border-green-500/30" : result.score > 60 ? "bg-amber-950/40 text-amber-300 border border-amber-500/30" : "bg-red-950/40 text-red-300 border border-red-500/30"
                    }>
                      Độ chính xác: {result.score}%
                    </Badge>
                  </div>
                  <Text variant="body-md" className="text-m3-on-surface-variant mt-1">
                    {result.isRealLossless
                      ? "Phổ âm thanh trải rộng liên tục lên trên 20 kHz. Tệp này nguyên gốc phòng thu đạt chuẩn CD chất lượng tốt."
                      : result.score > 60
                        ? "Dải cao bị suy hao hoặc có hiện tượng chặn nhẹ ở 18-19 kHz. Đây có thể là nhạc 320kbps upscaled lên."
                        : "Tần số cao bị cắt phăng đột ngột ở ngưỡng dưới 16 kHz. Đây chắc chắn là tệp MP3 chất lượng thấp bị giả mạo FLAC/WAV."}
                  </Text>
                </div>
              </div>
            </div>

            {/* Scientific details cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-m3-surface-container-low rounded-xl">
                <Text variant="body-sm" className="text-m3-on-surface-variant">Tần số chặn tối đa</Text>
                <Text variant="headline-sm" className="font-bold text-m3-primary mt-1">
                  {(result.cutoffFrequency / 1000).toFixed(2)} kHz
                </Text>
              </div>
              <div className="p-3 bg-m3-surface-container-low rounded-xl">
                <Text variant="body-sm" className="text-m3-on-surface-variant">Năng lượng Dải Siêu Cao</Text>
                <Text variant="headline-sm" className="font-bold text-m3-secondary mt-1">
                  {result.avgPowerHigh} dB
                </Text>
              </div>
              <div className="p-3 bg-m3-surface-container-low rounded-xl">
                <Text variant="body-sm" className="text-m3-on-surface-variant">Năng lượng Dải Trung</Text>
                <Text variant="headline-sm" className="font-bold text-m3-tertiary mt-1">
                  {result.avgPowerMid} dB
                </Text>
              </div>
            </div>

            {/* Canvas Spectrum Plot */}
            <div className="flex flex-col gap-2">
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">Biểu đồ phân tích phổ âm thanh (Spectrum Graph)</Text>
              <div className="bg-m3-surface-container-lowest rounded-2xl p-4 border border-m3-outline-variant">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  className="w-full h-55 block"
                />
              </div>
              <div className="flex flex-wrap justify-between items-center text-xs text-m3-on-surface-variant px-1 font-mono gap-y-1">
                <span>0 Hz (Siêu Trầm)</span>
                <span>Tần số kiểm tra</span>
                <span>22050 Hz (Nyquist Limit)</span>
              </div>
            </div>

            <Divider shape='wavy' />

            {/* Detailed scientific explanation text */}
            <div className="flex items-start gap-3 bg-m3-surface-container-high/40 p-4 rounded-xl">
              <Icon name="auto_awesome" className="text-m3-primary shrink-0 mt-0.5" />
              <div>
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">Nhận định kỹ thuật viên</Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant mt-1 leading-relaxed">
                  Đoạn âm thanh thử nghiệm cho thấy biên độ dải cao ({result.avgPowerHigh} dB) lệch so với dải trung ({result.avgPowerMid} dB) là {Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB.
                  {result.isRealLossless
                    ? " Mức chênh lệch này hoàn toàn nằm trong tiêu chuẩn tuyến tính tự nhiên của tệp nén không hao hụt (Lossless gốc)."
                    : " Sự suy hao đột ngột ở ngưỡng tần số này chỉ ra rằng tệp đã đi qua bộ nén khử dữ liệu (lossy encoder) trước khi được đóng gói lại."}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
