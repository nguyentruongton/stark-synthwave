/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mp3Encoder } from "@breezystack/lamejs";
import { ExportFormatId } from "../types";

export interface ExportResult {
  blob: Blob;
  extension: string;
  mimeType: string;
  label: string;
}

export interface ExportFormatOption {
  id: ExportFormatId;
  label: string;
  description: string;
  ext: string;
  qualityBadge: string;
  isLossless: boolean;
}

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    id: "wav-16",
    label: "WAV (16-bit PCM)",
    description: "Lossless chuẩn CD (1411 kbps), tương thích mọi thiết bị",
    ext: "wav",
    qualityBadge: "Lossless CD",
    isLossless: true,
  },
  {
    id: "wav-24",
    label: "WAV (24-bit Hi-Res)",
    description: "Lossless phòng thu chuyên nghiệp (2116 kbps) dải động cao",
    ext: "wav",
    qualityBadge: "Hi-Res Studio",
    isLossless: true,
  },
  {
    id: "wav-32f",
    label: "WAV (32-bit Float)",
    description: "Dành cho phần mềm sản xuất âm nhạc DAW chuyên nghiệp",
    ext: "wav",
    qualityBadge: "DAW Float",
    isLossless: true,
  },
  {
    id: "mp3-320",
    label: "MP3 (320 kbps)",
    description: "Chất lượng MP3 cao nhất (CBR 320k), âm thanh trong trẻo",
    ext: "mp3",
    qualityBadge: "MP3 Extreme",
    isLossless: false,
  },
  {
    id: "mp3-192",
    label: "MP3 (192 kbps)",
    description: "Cân bằng hoàn hảo giữa dung lượng nhẹ và chất lượng cao",
    ext: "mp3",
    qualityBadge: "MP3 Standard",
    isLossless: false,
  },
  {
    id: "mp3-128",
    label: "MP3 (128 kbps)",
    description: "Dung lượng siêu nhẹ cho web, chia sẻ nhanh hoặc tin nhắn",
    ext: "mp3",
    qualityBadge: "MP3 Compact",
    isLossless: false,
  },
  {
    id: "aiff-16",
    label: "AIFF (Apple 16-bit)",
    description: "Chuẩn phòng thu Apple Logic Pro / macOS lossless nguyên bản",
    ext: "aiff",
    qualityBadge: "Apple Lossless",
    isLossless: true,
  },
  {
    id: "webm-opus",
    label: "WebM (Opus Stream)",
    description: "Bộ mã hóa thế hệ mới IETF Opus tối ưu truyền phát web",
    ext: "webm",
    qualityBadge: "Opus Web",
    isLossless: false,
  },
];

/** Encodes AudioBuffer into the chosen export format. */
export async function exportAudioBuffer(
  buffer: AudioBuffer,
  formatId: ExportFormatId
): Promise<ExportResult> {
  switch (formatId) {
    case "wav-16":
      return {
        blob: encodeWav(buffer, 16),
        extension: "wav",
        mimeType: "audio/wav",
        label: "WAV 16-bit PCM",
      };
    case "wav-24":
      return {
        blob: encodeWav(buffer, 24),
        extension: "wav",
        mimeType: "audio/wav",
        label: "WAV 24-bit Hi-Res",
      };
    case "wav-32f":
      return {
        blob: encodeWav(buffer, 32),
        extension: "wav",
        mimeType: "audio/wav",
        label: "WAV 32-bit Float",
      };
    case "mp3-320":
      return {
        blob: encodeMp3(buffer, 320),
        extension: "mp3",
        mimeType: "audio/mp3",
        label: "MP3 320 kbps",
      };
    case "mp3-192":
      return {
        blob: encodeMp3(buffer, 192),
        extension: "mp3",
        mimeType: "audio/mp3",
        label: "MP3 192 kbps",
      };
    case "mp3-128":
      return {
        blob: encodeMp3(buffer, 128),
        extension: "mp3",
        mimeType: "audio/mp3",
        label: "MP3 128 kbps",
      };
    case "aiff-16":
      return {
        blob: encodeAiff(buffer),
        extension: "aiff",
        mimeType: "audio/aiff",
        label: "AIFF 16-bit",
      };
    case "webm-opus":
      return {
        blob: await encodeWebmOpus(buffer),
        extension: "webm",
        mimeType: "audio/webm",
        label: "WebM Opus",
      };
    default:
      return {
        blob: encodeWav(buffer, 16),
        extension: "wav",
        mimeType: "audio/wav",
        label: "WAV 16-bit PCM",
      };
  }
}

/** Backward compatible bufferToWav export (defaults to 16-bit PCM). */
export function bufferToWav(buffer: AudioBuffer): Blob {
  return encodeWav(buffer, 16);
}

/** Robust WAV Encoder supporting 16-bit PCM, 24-bit PCM, and 32-bit Float. */
export function encodeWav(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;

  const isFloat = bitDepth === 32;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  // RIFF Chunk
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");

  // fmt chunk
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, isFloat ? 3 : 1, true); // 1 = PCM, 3 = IEEE Float
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave and write samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numOfChan; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  if (bitDepth === 16) {
    for (let i = 0; i < numFrames; i++) {
      for (let c = 0; c < numOfChan; c++) {
        const s = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < numFrames; i++) {
      for (let c = 0; c < numOfChan; c++) {
        const s = Math.max(-1, Math.min(1, channels[c][i]));
        const val = Math.floor(s < 0 ? s * 0x800000 : s * 0x7fffff);
        view.setUint8(offset, val & 0xff);
        view.setUint8(offset + 1, (val >> 8) & 0xff);
        view.setUint8(offset + 2, (val >> 16) & 0xff);
        offset += 3;
      }
    }
  } else {
    // 32-bit Float
    for (let i = 0; i < numFrames; i++) {
      for (let c = 0; c < numOfChan; c++) {
        view.setFloat32(offset, channels[c][i], true);
        offset += 4;
      }
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

/** Pure TypeScript AIFF Encoder (Apple 16-bit PCM). */
export function encodeAiff(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const sampleSize = 16;
  const dataSize = numFrames * numOfChan * 2;

  // FORM + COMM (26) + SSND (16 + data)
  const totalLength = 12 + 26 + 16 + dataSize;
  const aiffBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(aiffBuffer);

  // FORM chunk
  writeAscii(view, 0, "FORM");
  view.setUint32(4, totalLength - 8, false); // Big endian
  writeAscii(view, 8, "AIFF");

  // COMM chunk
  writeAscii(view, 12, "COMM");
  view.setUint32(16, 18, false); // Chunk size
  view.setUint16(20, numOfChan, false);
  view.setUint32(22, numFrames, false);
  view.setUint16(26, sampleSize, false);
  writeExtendedFloat(view, 28, sampleRate); // 10 bytes

  // SSND chunk
  writeAscii(view, 38, "SSND");
  view.setUint32(42, 8 + dataSize, false);
  view.setUint32(46, 0, false); // Offset
  view.setUint32(50, 0, false); // Block size

  const channels: Float32Array[] = [];
  for (let c = 0; c < numOfChan; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 54;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numOfChan; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, false); // Big endian
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/aiff" });
}

/** Pure JavaScript MP3 Encoder via LAME. */
export function encodeMp3(buffer: AudioBuffer, kbps: number = 320): Blob {
  const channels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = channels > 1 ? buffer.getChannelData(1) : leftChannel;

  const sampleBlockSize = 1152;
  const totalSamples = buffer.length;

  for (let i = 0; i < totalSamples; i += sampleBlockSize) {
    const blockSize = Math.min(sampleBlockSize, totalSamples - i);
    const leftChunk = new Int16Array(blockSize);
    const rightChunk = new Int16Array(blockSize);

    for (let j = 0; j < blockSize; j++) {
      const l = Math.max(-1, Math.min(1, leftChannel[i + j]));
      leftChunk[j] = l < 0 ? l * 0x8000 : l * 0x7fff;

      if (channels > 1) {
        const r = Math.max(-1, Math.min(1, rightChannel[i + j]));
        rightChunk[j] = r < 0 ? r * 0x8000 : r * 0x7fff;
      }
    }

    const chunk = channels === 1
      ? encoder.encodeBuffer(leftChunk)
      : encoder.encodeBuffer(leftChunk, rightChunk);

    if (chunk.length > 0) {
      mp3Data.push(chunk);
    }
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) {
    mp3Data.push(finalChunk);
  }

  return new Blob(mp3Data, { type: "audio/mp3" });
}

/** WebM / Opus encoding via browser MediaRecorder. */
export async function encodeWebmOpus(buffer: AudioBuffer): Promise<Blob> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();

  // Pick supported MIME type
  let mimeType = "audio/webm;codecs=opus";
  if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
      mimeType = "audio/ogg;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    }
  }

  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported(mimeType)) {
    // Fallback to high quality WAV if MediaRecorder is not supported
    return encodeWav(buffer, 16);
  }

  const dest = ctx.createMediaStreamDestination();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(dest);

  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      ctx.close().catch(() => {});
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start();
    source.start(0);

    // Stop recording when buffer completes
    setTimeout(() => {
      try {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      } catch {
        resolve(new Blob(chunks, { type: mimeType }));
      }
    }, Math.max(500, buffer.duration * 1000 + 100));
  });
}

function writeAscii(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function writeExtendedFloat(view: DataView, offset: number, val: number): void {
  if (val === 0) {
    for (let i = 0; i < 10; i++) view.setUint8(offset + i, 0);
    return;
  }
  let sign = 0;
  if (val < 0) {
    sign = 0x8000;
    val = -val;
  }
  const exp = Math.floor(Math.log2(val));
  const mantissa = val / Math.pow(2, exp);
  const biExp = exp + 16383;
  view.setUint16(offset, sign | biExp, false);
  const hi = Math.floor(mantissa * Math.pow(2, 31));
  const lo = Math.floor((mantissa * Math.pow(2, 31) - hi) * Math.pow(2, 32));
  view.setUint32(offset + 2, hi >>> 0, false);
  view.setUint32(offset + 6, lo >>> 0, false);
}
