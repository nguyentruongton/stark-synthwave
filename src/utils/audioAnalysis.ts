/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BPMResult, KeyResult, QualityResult } from "../types";

/** Decodes audio safely, falling back from promise to callback API for legacy browsers. */
export async function safeDecodeAudioData(audioContext: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  try {
    const promise = audioContext.decodeAudioData(arrayBuffer);
    if (promise && typeof promise.then === "function") return await promise;
  } catch {
    // fall through to callback-based API
  }

  return new Promise<AudioBuffer>((resolve, reject) => {
    try {
      audioContext.decodeAudioData(
        arrayBuffer,
        (buffer) => resolve(buffer),
        (err) => reject(err || new Error("Không thể giải mã dữ liệu âm thanh"))
      );
    } catch (err) {
      reject(err);
    }
  });
}

// --- 1. TEMPO / BPM DETECTOR (Onset Peak Clustering) ---
export function detectBPM(audioBuffer: AudioBuffer): BPMResult {
  if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
    throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
  }
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Downsample to ~4410Hz to speed up processing
  const downsampleRatio = Math.round(sampleRate / 4410);
  const targetLen = Math.floor(channelData.length / downsampleRatio);
  const downsampled = new Float32Array(targetLen);
  for (let i = 0; i < targetLen; i++) {
    downsampled[i] = channelData[i * downsampleRatio];
  }

  const dsSampleRate = sampleRate / downsampleRatio;

  // 1st-order lowpass to isolate bass (kicks/beats) below 150Hz: y[n] = α·x[n] + (1−α)·y[n−1]
  const cutoff = 150;
  const rc = 1.0 / (2.0 * Math.PI * cutoff);
  const dt = 1.0 / dsSampleRate;
  const alpha = dt / (rc + dt);

  const filtered = new Float32Array(downsampled.length);
  let prevY = 0;
  for (let i = 0; i < downsampled.length; i++) {
    filtered[i] = alpha * downsampled[i] + (1 - alpha) * prevY;
    prevY = filtered[i];
  }

  // Dynamic-threshold peak detection (local max within 50ms window, spaced ≥0.3s apart)
  const peakIndices: number[] = [];
  const minPeakDistance = Math.round(dsSampleRate * 0.3);

  let totalAbs = 0;
  for (let i = 0; i < filtered.length; i++) totalAbs += Math.abs(filtered[i]);
  const absoluteThreshold = Math.max(0.01, (totalAbs / filtered.length) * 1.5);

  let i = 0;
  while (i < filtered.length) {
    const val = Math.abs(filtered[i]);
    const lookRadius = Math.round(dsSampleRate * 0.05);
    const startIdx = Math.max(0, i - lookRadius);
    const endIdx = Math.min(filtered.length - 1, i + lookRadius);

    let isLocalMax = true;
    for (let j = startIdx; j <= endIdx; j++) {
      if (Math.abs(filtered[j]) > val) { isLocalMax = false; break; }
    }

    if (isLocalMax && val > absoluteThreshold) {
      peakIndices.push(i);
      i += minPeakDistance;
    } else {
      i++;
    }
  }

  if (peakIndices.length < 5) {
    return { bpm: 120, confidence: 0, peaksCount: peakIndices.length };
  }

  // Convert inter-peak intervals to BPM, clamping to 60-180 range via octave doubling
  const intervals: number[] = [];
  for (let p = 1; p < peakIndices.length; p++) {
    const intervalSec = (peakIndices[p] - peakIndices[p - 1]) / dsSampleRate;
    const bpm = 60 / intervalSec;
    if (bpm >= 60 && bpm <= 180) intervals.push(Math.round(bpm));
    else if (bpm * 2 >= 60 && bpm * 2 <= 180) intervals.push(Math.round(bpm * 2));
    else if (bpm / 2 >= 60 && bpm / 2 <= 180) intervals.push(Math.round(bpm / 2));
  }

  // Smoothed histogram: add half-weight to neighbors to reduce rounding sensitivity
  const counts: Record<number, number> = {};
  for (const bpm of intervals) {
    counts[bpm] = (counts[bpm] || 0) + 1;
    counts[bpm - 1] = (counts[bpm - 1] || 0) + 0.5;
    counts[bpm + 1] = (counts[bpm + 1] || 0) + 0.5;
  }

  let maxCount = 0;
  let estimatedBpm = 120;
  for (const binStr in counts) {
    const bin = parseInt(binStr, 10);
    if (counts[bin] > maxCount) { maxCount = counts[bin]; estimatedBpm = bin; }
  }

  const confidence = intervals.length > 0 ? Math.min(100, Math.round((maxCount / intervals.length) * 100)) : 0;
  return {
    bpm: estimatedBpm,
    confidence: Math.max(10, Math.min(100, confidence * 1.5)),
    peaksCount: peakIndices.length
  };
}


// --- 2. TONE / KEY DETECTOR (Pitch Chroma Correlation) ---

// Krumhansl-Schmuckler profiles [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CAMELOT_MAJOR = ["8B", "3B", "10B", "5B", "12B", "7B", "2B", "9B", "4B", "11B", "6B", "1B"];
const CAMELOT_MINOR = ["8A", "3A", "10A", "5A", "12A", "7A", "2A", "9A", "4A", "11A", "6A", "1A"];

export function detectKey(audioBuffer: AudioBuffer): KeyResult {
  if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
    throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
  }
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const chroma = new Float32Array(12);
  const numSamples = 60;
  const frameSize = 2048;
  const step = Math.floor(channelData.length / numSamples);

  // Build fundamental frequencies for C3–B5 (MIDI 48–83)
  const midiFreqs: number[] = [];
  for (let midi = 48; midi <= 83; midi++) {
    midiFreqs.push(440.0 * Math.pow(2.0, (midi - 69) / 12.0));
  }

  // Hann window to reduce spectral leakage
  const hann = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    hann[i] = 0.5 * (1.0 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
  }

  for (let s = 0; s < numSamples; s++) {
    const offset = Math.floor(s * step + step * 0.1);
    if (offset + frameSize > channelData.length) break;

    const frame = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) frame[i] = channelData[offset + i] * hann[i];

    // Goertzel-like DFT at each pitch frequency
    for (let m = 0; m < midiFreqs.length; m++) {
      const freq = midiFreqs[m];
      const noteIdx = (48 + m) % 12;
      const omega = (2 * Math.PI * (freq * frameSize) / sampleRate) / frameSize;

      let real = 0;
      let imag = 0;
      for (let n = 0; n < frameSize; n++) {
        real += frame[n] * Math.cos(omega * n);
        imag -= frame[n] * Math.sin(omega * n);
      }
      chroma[noteIdx] += Math.sqrt(real * real + imag * imag);
    }
  }

  // Normalize chroma energy
  let maxVal = 0.0001;
  for (let i = 0; i < 12; i++) if (chroma[i] > maxVal) maxVal = chroma[i];
  for (let i = 0; i < 12; i++) chroma[i] /= maxVal;

  // Find best matching key via Pearson correlation against Krumhansl-Schmuckler profiles
  let bestKeyIdx = 0;
  let bestIsMajor = true;
  let bestCorrelation = -2;

  for (let keyIdx = 0; keyIdx < 12; keyIdx++) {
    const majorCorr = pearsonCorrelation(chroma, rotateProfile(MAJOR_PROFILE, keyIdx));
    if (majorCorr > bestCorrelation) { bestCorrelation = majorCorr; bestKeyIdx = keyIdx; bestIsMajor = true; }

    const minorCorr = pearsonCorrelation(chroma, rotateProfile(MINOR_PROFILE, keyIdx));
    if (minorCorr > bestCorrelation) { bestCorrelation = minorCorr; bestKeyIdx = keyIdx; bestIsMajor = false; }
  }

  const keyName = NOTE_NAMES[bestKeyIdx] + (bestIsMajor ? " Major" : " Minor");
  const camelot = bestIsMajor ? CAMELOT_MAJOR[bestKeyIdx] : CAMELOT_MINOR[bestKeyIdx];
  const confidence = Math.round(Math.max(10, Math.min(100, (bestCorrelation + 1) * 50)));

  return {
    keyName,
    camelot,
    confidence,
    chroma: Array.from(chroma)
  };
}

function rotateProfile(profile: number[], shift: number): number[] {
  const rotated = new Array(12);
  for (let i = 0; i < 12; i++) {
    rotated[i] = profile[(12 + i - shift) % 12];
  }
  return rotated;
}

function pearsonCorrelation(x: Float32Array, y: number[]): number {
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < 12; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / 12;
  const meanY = sumY / 12;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < 12; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}


// --- 3. LOSSLESS QUALITY CHECKER (Spectral Cutoff) ---
export function analyzeLosslessQuality(audioBuffer: AudioBuffer): QualityResult {
  if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
    throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
  }
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const frameSize = 1024;
  const numFrames = 30;
  const startOffset = Math.floor(channelData.length * 0.25);
  const endOffset = Math.floor(channelData.length * 0.75);
  const step = Math.floor((endOffset - startOffset) / numFrames);

  const fftLength = frameSize / 2;
  const avgSpectrum = new Float32Array(fftLength);

  // Blackman window: high dynamic range, side lobes attenuated to -58dB
  const window = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    window[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (frameSize - 1));
  }

  let framesAnalyzed = 0;
  for (let f = 0; f < numFrames; f++) {
    const offset = startOffset + f * step;
    if (offset + frameSize > channelData.length) break;

    const signal = new Float32Array(frameSize);
    let energy = 0;
    for (let i = 0; i < frameSize; i++) {
      signal[i] = channelData[offset + i] * window[i];
      energy += signal[i] * signal[i];
    }
    if (energy < 0.1) continue; // skip silent frames

    const spectrum = computeDFT(signal);
    for (let i = 0; i < fftLength; i++) avgSpectrum[i] += spectrum[i];
    framesAnalyzed++;
  }

  if (framesAnalyzed > 0) {
    for (let i = 0; i < fftLength; i++) avgSpectrum[i] /= framesAnalyzed;
  }

  // Convert magnitudes to dB, normalize peak to 0dB
  const dbSpectrum = new Float32Array(fftLength);
  let maxDB = -200;
  for (let i = 0; i < fftLength; i++) {
    const db = avgSpectrum[i] > 1e-8 ? 20 * Math.log10(avgSpectrum[i]) : -160;
    dbSpectrum[i] = db;
    if (db > maxDB) maxDB = db;
  }
  for (let i = 0; i < fftLength; i++) dbSpectrum[i] -= maxDB;

  // Scan backwards from Nyquist for first bin sustained below -48dB for ~600Hz
  const hzPerBin = (sampleRate / 2) / fftLength;
  const thresholdDB = -48;
  let cutoffBin = fftLength - 1;
  let consecutiveBelow = 0;
  const requiredConsecutive = Math.round(600 / hzPerBin);
  for (let i = fftLength - 10; i >= 0; i--) {
    if (dbSpectrum[i] < thresholdDB) {
      consecutiveBelow++;
      if (consecutiveBelow >= requiredConsecutive) cutoffBin = i + consecutiveBelow;
    } else {
      consecutiveBelow = 0;
    }
  }
  const cutoffFrequency = Math.round(cutoffBin * hzPerBin);

  // Average power: mid reference band (1–10 kHz) and high check band (16.5–20 kHz)
  let midSum = 0, midCount = 0, highSum = 0, highCount = 0;
  for (let i = 0; i < fftLength; i++) {
    const freq = i * hzPerBin;
    if (freq >= 1000 && freq <= 10000) { midSum += dbSpectrum[i]; midCount++; }
    else if (freq >= 16500 && freq <= 20000) { highSum += dbSpectrum[i]; highCount++; }
  }
  const avgPowerMid = midCount > 0 ? midSum / midCount : -100;
  const avgPowerHigh = highCount > 0 ? highSum / highCount : -100;
  const powerLoss = avgPowerMid - avgPowerHigh;

  // Heuristic scoring by cutoff frequency tier
  let score = 0;
  let isRealLossless = false;
  if (cutoffFrequency >= 20000) {
    isRealLossless = powerLoss < 40;
    score = Math.round(Math.max(85, Math.min(100, 100 - (powerLoss - 15) * 0.6)));
  } else if (cutoffFrequency >= 18000) {
    score = Math.round(Math.max(60, Math.min(84, 84 - (20000 - cutoffFrequency) * 0.01)));
  } else if (cutoffFrequency >= 15500) {
    score = Math.round(Math.max(35, Math.min(59, 59 - (18000 - cutoffFrequency) * 0.01)));
  } else {
    score = Math.round(Math.max(10, Math.min(34, 34 - (15500 - cutoffFrequency) * 0.012)));
  }

  if (sampleRate < 40000) { isRealLossless = false; score = 30; }

  // Downsample spectrum to ~120 points for chart rendering
  const stepPoints = Math.max(1, Math.floor(fftLength / 120));
  const spectrumData: { frequency: number; power: number }[] = [];
  for (let i = 0; i < fftLength; i += stepPoints) {
    const f = Math.round(i * hzPerBin);
    if (f > 22050) break;
    spectrumData.push({ frequency: f, power: Math.max(-100, Math.round(dbSpectrum[i])) });
  }

  return {
    isRealLossless,
    score,
    cutoffFrequency,
    avgPowerHigh: Math.round(avgPowerHigh),
    avgPowerMid: Math.round(avgPowerMid),
    spectrumData
  };
}

/** Radix-2 Cooley-Tukey FFT — returns magnitude spectrum (first N/2 bins). */
function computeDFT(signal: Float32Array): Float32Array {
  const n = signal.length;
  const fftLength = n / 2;
  const spectrum = new Float32Array(fftLength);

  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  real.set(signal);

  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let m = n >> 1;
    while (m >= 2 && j >= m) { j -= m; m >>= 1; }
    j += m;
  }

  // Butterfly stages
  for (let size = 2; size <= n; size <<= 1) {
    const halfSize = size >> 1;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < halfSize; k++) {
        const angle = (-2 * Math.PI * k) / size;
        const wR = Math.cos(angle);
        const wI = Math.sin(angle);
        const tR = real[i + k + halfSize] * wR - imag[i + k + halfSize] * wI;
        const tI = real[i + k + halfSize] * wI + imag[i + k + halfSize] * wR;
        real[i + k + halfSize] = real[i + k] - tR;
        imag[i + k + halfSize] = imag[i + k] - tI;
        real[i + k] += tR;
        imag[i + k] += tI;
      }
    }
  }

  for (let i = 0; i < fftLength; i++) {
    spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  return spectrum;
}
