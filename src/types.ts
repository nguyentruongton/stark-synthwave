/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AudioTrack {
  id: string;
  name: string;
  size: number;
  duration: number; // in seconds
  sampleRate: number;
  numberOfChannels: number;
  audioBuffer: AudioBuffer | null;
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
}

export interface BPMResult {
  bpm: number;
  confidence: number;
  peaksCount: number;
}

export interface KeyResult {
  keyName: string;
  camelot: string;
  confidence: number;
  chroma: number[]; // 12 notes chroma energy
}

export interface QualityResult {
  isRealLossless: boolean;
  score: number; // 0 - 100
  cutoffFrequency: number; // in Hz
  avgPowerHigh: number; // dB
  avgPowerMid: number; // dB
  spectrumData: { frequency: number; power: number }[];
}
