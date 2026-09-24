import type { BPMResult, KeyResult, QualityResult } from "../types";
import {
	detectAudioFormat,
	parseAiffToAudioBuffer,
	parseAuToAudioBuffer,
	parseWavToAudioBuffer,
	stripId3Tag,
} from "./audioFormats";

/** Decodes audio safely with multi-format fallbacks (ID3 strip, manual WAV 8/16/24/32-bit PCM/Float, AIFF, AU/SND). */
export async function safeDecodeAudioData(
	audioContext: AudioContext,
	arrayBuffer: ArrayBuffer,
	fileName: string = "audio",
): Promise<AudioBuffer> {
	if (audioContext.state === "suspended") {
		try {
			await audioContext.resume();
		} catch {
			// Ignore resume errors
		}
	}

	// Attempt 1: Standard browser decodeAudioData
	try {
		const bufferCopy = arrayBuffer.slice(0);
		const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
			let settled = false;
			const onSuccess = (buf: AudioBuffer) => {
				if (!settled) {
					settled = true;
					resolve(buf);
				}
			};
			const onError = (err: unknown) => {
				if (!settled) {
					settled = true;
					reject(err);
				}
			};
			try {
				const promise = audioContext.decodeAudioData(
					bufferCopy,
					onSuccess,
					onError,
				);
				if (promise && typeof promise.then === "function") {
					promise.then(onSuccess).catch(onError);
				}
			} catch (e) {
				onError(e);
			}
		});
		return audioBuffer;
	} catch (nativeErr) {
		console.warn(
			"Native decodeAudioData failed, attempting fallback decoders...",
			nativeErr,
		);
	}

	// Attempt 2: Strip prepended ID3v2 tag and retry native decode
	const strippedBuffer = stripId3Tag(arrayBuffer);
	if (strippedBuffer) {
		try {
			const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
				let settled = false;
				const onSuccess = (buf: AudioBuffer) => {
					if (!settled) {
						settled = true;
						resolve(buf);
					}
				};
				const onError = (err: unknown) => {
					if (!settled) {
						settled = true;
						reject(err);
					}
				};
				try {
					const promise = audioContext.decodeAudioData(
						strippedBuffer.slice(0),
						onSuccess,
						onError,
					);
					if (promise && typeof promise.then === "function") {
						promise.then(onSuccess).catch(onError);
					}
				} catch (e) {
					onError(e);
				}
			});
			return audioBuffer;
		} catch {
			// Continue to next fallback
		}
	}

	// Attempt 3: Pure TypeScript RIFF WAV parser (8/16/24/32-bit PCM and 32-bit Float)
	const wavBuffer = parseWavToAudioBuffer(audioContext, arrayBuffer);
	if (wavBuffer) {
		return wavBuffer;
	}

	// Attempt 4: Pure TypeScript AIFF/AIF big-endian PCM parser
	const aiffBuffer = parseAiffToAudioBuffer(audioContext, arrayBuffer);
	if (aiffBuffer) {
		return aiffBuffer;
	}

	// Attempt 5: Sun/NeXT AU (.snd) parser
	const auBuffer = parseAuToAudioBuffer(audioContext, arrayBuffer);
	if (auBuffer) {
		return auBuffer;
	}

	// Attempt 6: If strippedBuffer exists, also try WAV/AIFF parser on stripped buffer
	if (strippedBuffer) {
		const strippedWav = parseWavToAudioBuffer(audioContext, strippedBuffer);
		if (strippedWav) return strippedWav;
		const strippedAiff = parseAiffToAudioBuffer(audioContext, strippedBuffer);
		if (strippedAiff) return strippedAiff;
	}

	const format = detectAudioFormat(arrayBuffer, fileName);
	throw new Error(
		`Không thể giải mã tệp định dạng [${format.name}]. Vui lòng đảm bảo tệp âm thanh không bị hỏng và không bị khóa bản quyền DRM.`,
	);
}

// --- 1. TEMPO / BPM DETECTOR (Onset Peak Clustering) ---
export function detectBPM(
	audioInput:
		| AudioBuffer
		| {
				channelData: Float32Array;
				sampleRate: number;
				numberOfChannels?: number;
		  },
): BPMResult {
	const isBuffer =
		typeof (audioInput as AudioBuffer).getChannelData === "function";
	const channelData = isBuffer
		? (audioInput as AudioBuffer).getChannelData(0)
		: (audioInput as { channelData: Float32Array }).channelData;
	const sampleRate = audioInput.sampleRate;

	if (!channelData || channelData.length === 0) {
		throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
	}

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
			if (Math.abs(filtered[j]) > val) {
				isLocalMax = false;
				break;
			}
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
		else if (bpm * 2 >= 60 && bpm * 2 <= 180)
			intervals.push(Math.round(bpm * 2));
		else if (bpm / 2 >= 60 && bpm / 2 <= 180)
			intervals.push(Math.round(bpm / 2));
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
		if (counts[bin] > maxCount) {
			maxCount = counts[bin];
			estimatedBpm = bin;
		}
	}

	const confidence =
		intervals.length > 0
			? Math.min(100, Math.round((maxCount / intervals.length) * 100))
			: 0;
	return {
		bpm: estimatedBpm,
		confidence: Math.max(10, Math.min(100, confidence * 1.5)),
		peaksCount: peakIndices.length,
	};
}

// --- 2. TONE / KEY DETECTOR (Pitch Chroma Correlation) ---

// Krumhansl-Schmuckler profiles [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
const MAJOR_PROFILE = [
	6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE = [
	6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

const NOTE_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];
const CAMELOT_MAJOR = [
	"8B",
	"3B",
	"10B",
	"5B",
	"12B",
	"7B",
	"2B",
	"9B",
	"4B",
	"11B",
	"6B",
	"1B",
];
const CAMELOT_MINOR = [
	"8A",
	"3A",
	"10A",
	"5A",
	"12A",
	"7A",
	"2A",
	"9A",
	"4A",
	"11A",
	"6A",
	"1A",
];

export function detectKey(
	audioInput:
		| AudioBuffer
		| {
				channelData: Float32Array;
				sampleRate: number;
				numberOfChannels?: number;
		  },
): KeyResult {
	const isBuffer =
		typeof (audioInput as AudioBuffer).getChannelData === "function";
	const channelData = isBuffer
		? (audioInput as AudioBuffer).getChannelData(0)
		: (audioInput as { channelData: Float32Array }).channelData;
	const sampleRate = audioInput.sampleRate;

	if (!channelData || channelData.length === 0) {
		throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
	}

	const chroma = new Float32Array(12);
	const numSamples = 60;
	const frameSize = 2048;
	const step = Math.floor(channelData.length / numSamples);

	// Build fundamental frequencies for C3–B5 (MIDI 48–83)
	const midiFreqs: number[] = [];
	for (let midi = 48; midi <= 83; midi++) {
		midiFreqs.push(440.0 * 2.0 ** ((midi - 69) / 12.0));
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
		for (let i = 0; i < frameSize; i++)
			frame[i] = channelData[offset + i] * hann[i];

		// Goertzel-like DFT at each pitch frequency
		for (let m = 0; m < midiFreqs.length; m++) {
			const freq = midiFreqs[m];
			const noteIdx = (48 + m) % 12;
			const omega = (2 * Math.PI * (freq * frameSize)) / sampleRate / frameSize;

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
		const majorCorr = pearsonCorrelation(
			chroma,
			rotateProfile(MAJOR_PROFILE, keyIdx),
		);
		if (majorCorr > bestCorrelation) {
			bestCorrelation = majorCorr;
			bestKeyIdx = keyIdx;
			bestIsMajor = true;
		}

		const minorCorr = pearsonCorrelation(
			chroma,
			rotateProfile(MINOR_PROFILE, keyIdx),
		);
		if (minorCorr > bestCorrelation) {
			bestCorrelation = minorCorr;
			bestKeyIdx = keyIdx;
			bestIsMajor = false;
		}
	}

	const keyName = NOTE_NAMES[bestKeyIdx] + (bestIsMajor ? " Major" : " Minor");
	const camelot = bestIsMajor
		? CAMELOT_MAJOR[bestKeyIdx]
		: CAMELOT_MINOR[bestKeyIdx];
	const confidence = Math.round(
		Math.max(10, Math.min(100, (bestCorrelation + 1) * 50)),
	);

	return {
		keyName,
		camelot,
		confidence,
		chroma: Array.from(chroma),
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

// --- 3. LOSSLESS QUALITY CHECKER (7-Factor High Resolution DSP) ---

/**
 * Estimates the spectral noise floor (in dB) by taking the 10th percentile of high-frequency bins (12 kHz - Nyquist).
 */
export function estimateNoiseFloor(dbSpectrum: Float32Array): number {
	const n = dbSpectrum.length;
	const startIdx = Math.floor(n * 0.55);
	const endIdx = Math.max(startIdx + 10, n - 10);
	const slice = Array.from(dbSpectrum.slice(startIdx, endIdx));
	if (slice.length === 0) return -80;
	slice.sort((a, b) => a - b);
	const p10 = slice[Math.floor(slice.length * 0.1)] ?? -80;
	return Math.max(-95, Math.min(-45, p10));
}

/**
 * Measures spectral texture / entropy variation in the high-frequency band (14 kHz - 20 kHz).
 * True lossless audio contains natural harmonics and reverberation (high stddev).
 * Fake/lossy audio exhibits flat quantization noise or dead silence (near-zero stddev).
 */
export function computeHighFreqTexture(
	dbSpectrum: Float32Array,
	hzPerBin: number,
): number {
	const startBin = Math.max(0, Math.floor(14000 / hzPerBin));
	const endBin = Math.min(dbSpectrum.length, Math.floor(20000 / hzPerBin));
	if (endBin <= startBin) return 0;

	let sum = 0;
	let count = 0;
	for (let i = startBin; i < endBin; i++) {
		sum += dbSpectrum[i];
		count++;
	}
	const mean = sum / count;

	let varianceSum = 0;
	for (let i = startBin; i < endBin; i++) {
		const diff = dbSpectrum[i] - mean;
		varianceSum += diff * diff;
	}
	return Math.sqrt(varianceSum / count);
}

/**
 * Detects effective PCM bit-depth (16-bit vs 20-bit vs 24-bit/Float) by analyzing
 * quantization grid alignment on active (non-silent) audio samples.
 * Catches fake/upscaled hi-res audio (e.g. 16-bit master packaged into 24-bit container).
 */
export function detectEffectiveBitDepth(
	channelData: Float32Array,
	claimedBitDepth?: number,
): { effectiveBitDepth: number; isUpscaled: boolean; snapRatio16: number } {
	let match16 = 0;
	let match20 = 0;
	let testedCount = 0;
	const targetSamples = 50000;

	// Pick evenly spaced samples across the track, skipping near-silent samples
	const step = Math.max(1, Math.floor(channelData.length / targetSamples));
	for (
		let i = 0;
		i < channelData.length && testedCount < targetSamples;
		i += step
	) {
		const s = channelData[i];
		if (Math.abs(s) < 0.002) continue; // Skip zero/near-silent samples

		// 16-bit quantization grid: scale by 32768 or 32767
		const rem16A = Math.abs(s * 32768 - Math.round(s * 32768));
		const rem16B = Math.abs(s * 32767 - Math.round(s * 32767));
		if (rem16A < 0.015 || rem16B < 0.015) {
			match16++;
		}

		// 20-bit quantization grid: scale by 524288
		const rem20 = Math.abs(s * 524288 - Math.round(s * 524288));
		if (rem20 < 0.015) {
			match20++;
		}

		testedCount++;
	}

	if (testedCount < 200) {
		return {
			effectiveBitDepth: claimedBitDepth || 16,
			isUpscaled: false,
			snapRatio16: 0,
		};
	}

	const snapRatio16 = match16 / testedCount;
	const snapRatio20 = match20 / testedCount;

	let effectiveBitDepth = 24;
	if (snapRatio16 >= 0.9) {
		effectiveBitDepth = 16;
	} else if (snapRatio20 >= 0.9) {
		effectiveBitDepth = 20;
	}

	// Flag as upscaled if container metadata claimed > 16-bit but effective bit-depth is 16-bit
	const isUpscaled = Boolean(
		claimedBitDepth && claimedBitDepth > 16 && effectiveBitDepth === 16,
	);

	return { effectiveBitDepth, isUpscaled, snapRatio16 };
}

export interface AnalyzeLosslessOptions {
	channelData?: Float32Array;
	sampleRate?: number;
	duration?: number;
	claimedBitDepth?: number;
	onProgress?: (percent: number) => void;
}

export function analyzeLosslessQuality(
	audioInput:
		| AudioBuffer
		| { channelData: Float32Array; sampleRate: number; duration?: number },
	claimedBitDepth?: number,
	onProgress?: (percent: number) => void,
): QualityResult {
	let channelData: Float32Array;
	let sampleRate: number;

	if ("getChannelData" in audioInput) {
		if (audioInput.numberOfChannels === 0) {
			throw new Error("Tệp âm thanh không có dữ liệu kênh hợp lệ.");
		}
		channelData = audioInput.getChannelData(0);
		sampleRate = audioInput.sampleRate;
	} else {
		channelData = audioInput.channelData;
		sampleRate = audioInput.sampleRate;
	}

	if (!channelData || channelData.length === 0) {
		throw new Error("Dữ liệu âm thanh trống hoặc không hợp lệ.");
	}

	// 1. High Resolution FFT (8192 points: ~5.38 Hz/bin at 44.1kHz)
	const frameSize = 8192;
	const fftLength = frameSize / 2; // 4096 bins
	const hzPerBin = sampleRate / 2 / fftLength;

	// 2. High Density Frame Sampling (120 frames across 5% to 95% of audio)
	const numFrames = 120;
	const startOffset = Math.floor(channelData.length * 0.05);
	const endOffset = Math.floor(channelData.length * 0.95);
	const usableRange = Math.max(0, endOffset - startOffset - frameSize);
	const step =
		numFrames > 1 && usableRange > 0
			? Math.floor(usableRange / (numFrames - 1))
			: Math.max(1, frameSize);

	// Precomputed Blackman window (side lobes suppressed to -58dB)
	const window = new Float32Array(frameSize);
	for (let i = 0; i < frameSize; i++) {
		window[i] =
			0.42 -
			0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1)) +
			0.08 * Math.cos((4 * Math.PI * i) / (frameSize - 1));
	}

	// Reusable scratch buffers for zero-allocation FFT
	const real = new Float32Array(frameSize);
	const imag = new Float32Array(frameSize);
	const tempMag = new Float32Array(fftLength);

	// Dual-track spectrum accumulators: Peak-Hold & Average
	const peakSpectrum = new Float32Array(fftLength);
	const avgSpectrum = new Float32Array(fftLength);

	// 2D Spectrogram storage (256 downsampled frequency bins per frame)
	const spectroBinsCount = 256;
	const spectroStep = Math.max(1, Math.floor(fftLength / spectroBinsCount));
	const spectrogramFrames: { timeSec: number; bins: Float32Array }[] = [];

	let framesAnalyzed = 0;
	for (let f = 0; f < numFrames; f++) {
		const offset = startOffset + f * step;
		if (offset + frameSize > channelData.length) break;

		let frameEnergy = 0;
		for (let i = 0; i < frameSize; i++) {
			const s = channelData[offset + i] * window[i];
			real[i] = s;
			imag[i] = 0;
			frameEnergy += s * s;
		}

		// Skip silent frames
		if (frameEnergy < 0.05) continue;

		// Run in-place Radix-2 FFT
		computeInPlaceFFT(real, imag, tempMag);

		// Peak-hold & Average accumulation
		for (let i = 0; i < fftLength; i++) {
			if (tempMag[i] > peakSpectrum[i]) {
				peakSpectrum[i] = tempMag[i];
			}
			avgSpectrum[i] += tempMag[i];
		}

		// Downsample frame into 256 dB bins for 2D Spectrogram
		const frameBins = new Float32Array(spectroBinsCount);
		for (let b = 0; b < spectroBinsCount; b++) {
			const binIdx = Math.min(fftLength - 1, b * spectroStep);
			const mag = tempMag[binIdx];
			frameBins[b] = mag > 1e-8 ? Math.max(-100, 20 * Math.log10(mag)) : -100;
		}

		spectrogramFrames.push({
			timeSec: offset / sampleRate,
			bins: frameBins,
		});

		framesAnalyzed++;

		if (onProgress && f % 10 === 0) {
			onProgress(Math.round(((f + 1) / numFrames) * 75));
		}
	}

	if (framesAnalyzed > 0) {
		for (let i = 0; i < fftLength; i++) {
			avgSpectrum[i] /= framesAnalyzed;
		}
	}

	// Normalize Average Spectrum to 0 dB max
	const avgDbSpectrum = new Float32Array(fftLength);
	let maxAvgDB = -200;
	for (let i = 0; i < fftLength; i++) {
		const db = avgSpectrum[i] > 1e-8 ? 20 * Math.log10(avgSpectrum[i]) : -160;
		avgDbSpectrum[i] = db;
		if (db > maxAvgDB) maxAvgDB = db;
	}
	for (let i = 0; i < fftLength; i++) {
		avgDbSpectrum[i] -= maxAvgDB;
	}

	// Normalize Peak-Hold Spectrum to 0 dB max
	const peakDbSpectrum = new Float32Array(fftLength);
	let maxPeakDB = -200;
	for (let i = 0; i < fftLength; i++) {
		const db = peakSpectrum[i] > 1e-8 ? 20 * Math.log10(peakSpectrum[i]) : -160;
		peakDbSpectrum[i] = db;
		if (db > maxPeakDB) maxPeakDB = db;
	}
	for (let i = 0; i < fftLength; i++) {
		peakDbSpectrum[i] -= maxPeakDB;
	}

	// 4. Adaptive Threshold based on Noise Floor + Scale with Sample Rate
	const noiseFloor = estimateNoiseFloor(peakDbSpectrum);
	// Set threshold 6 dB above noise floor, with minimum -50 dB floor to stay safely above 16-bit quantization noise (-75 to -96 dB)
	const thresholdDB = Math.max(-50, Math.min(-36, noiseFloor + 6));

	// Compute smoothed envelope over ~150 Hz window to bridge harmonic valleys
	const smoothRadius = Math.max(2, Math.round(150 / hzPerBin));
	const smoothed = new Float32Array(fftLength);
	for (let i = 0; i < fftLength; i++) {
		const start = Math.max(0, i - smoothRadius);
		const end = Math.min(fftLength - 1, i + smoothRadius);
		let sum = 0;
		for (let k = start; k <= end; k++) {
			sum += peakDbSpectrum[k];
		}
		smoothed[i] = sum / (end - start + 1);
	}

	// Scan downwards from Nyquist for highest musical peak/content above threshold
	// Blackman window main lobe width is ~4 bins (~21.5 Hz), so genuine tones occupy >= 3 bins
	const requiredConsecutive = 3;
	let cutoffBin = 0;
	let consecutiveActive = 0;
	for (let i = fftLength - 10; i >= 0; i--) {
		if (peakDbSpectrum[i] >= thresholdDB) {
			consecutiveActive++;
			if (consecutiveActive >= requiredConsecutive) {
				cutoffBin = i + consecutiveActive;
				break;
			}
		} else {
			consecutiveActive = 0;
		}
	}
	const cutoffFrequency = Math.round(cutoffBin * hzPerBin);

	// Mid (1–10 kHz) and High (16.5–20 kHz) energy bands
	let midSum = 0;
	let midCount = 0;
	let highSum = 0;
	let highCount = 0;
	for (let i = 0; i < fftLength; i++) {
		const freq = i * hzPerBin;
		if (freq >= 1000 && freq <= 10000) {
			midSum += avgDbSpectrum[i];
			midCount++;
		} else if (freq >= 16500 && freq <= 20000) {
			highSum += avgDbSpectrum[i];
			highCount++;
		}
	}
	const avgPowerMid = midCount > 0 ? midSum / midCount : -100;
	const avgPowerHigh = highCount > 0 ? highSum / highCount : -100;
	const powerLoss = avgPowerMid - avgPowerHigh;

	// 5. Detect Effective Bit-Depth and Upscaling
	const bitDepthInfo = detectEffectiveBitDepth(channelData, claimedBitDepth);

	// 6. Compute High Frequency Texture
	const highFreqTexture = computeHighFreqTexture(peakDbSpectrum, hzPerBin);

	// 7. Multi-Factor Scoring
	// Factor 1: Cutoff Frequency Score (35%)
	let cutoffScore = 0;
	if (cutoffFrequency >= 20500) {
		cutoffScore = 100;
	} else if (cutoffFrequency >= 20000) {
		cutoffScore = 90 + Math.round(((cutoffFrequency - 20000) / 500) * 10);
	} else if (cutoffFrequency >= 18500) {
		cutoffScore = 65 + Math.round(((cutoffFrequency - 18500) / 1500) * 24);
	} else if (cutoffFrequency >= 15500) {
		cutoffScore = 30 + Math.round(((cutoffFrequency - 15500) / 3000) * 34);
	} else {
		cutoffScore = Math.max(5, Math.round((cutoffFrequency / 15500) * 29));
	}

	// Factor 2: High Frequency Texture Score (25%)
	let textureScore = 0;
	if (cutoffFrequency < 16000) {
		textureScore = 15;
	} else {
		// Natural acoustic texture stddev is ~8-18 dB -> maps to 70-100
		textureScore = Math.min(
			100,
			Math.max(15, Math.round(highFreqTexture * 7.5)),
		);
	}

	// Factor 3: Effective Bit-Depth Score (20%)
	let bitDepthScore = 100;
	if (bitDepthInfo.isUpscaled) {
		bitDepthScore = 20; // Heavy penalty for fake upscaled hi-res
	} else if (bitDepthInfo.effectiveBitDepth >= 24) {
		bitDepthScore = 100;
	} else {
		bitDepthScore = 95;
	}

	// Factor 4: Power Loss Score (15%)
	let powerLossScore = 0;
	if (powerLoss <= 25) {
		powerLossScore = 100;
	} else if (powerLoss <= 42) {
		powerLossScore = Math.round(100 - (powerLoss - 25) * 2.5);
	} else if (powerLoss <= 60) {
		powerLossScore = Math.max(20, Math.round(57 - (powerLoss - 42) * 2));
	} else {
		powerLossScore = 10;
	}

	// Factor 5: Sample Rate Bonus (5%)
	let sampleRateBonus = 80;
	if (sampleRate >= 88200) {
		sampleRateBonus = 100;
	} else if (sampleRate >= 44100) {
		sampleRateBonus = 85;
	} else {
		sampleRateBonus = 20;
	}

	// Weighted Overall Score (0 - 100)
	let score = Math.round(
		cutoffScore * 0.35 +
			textureScore * 0.25 +
			bitDepthScore * 0.2 +
			powerLossScore * 0.15 +
			sampleRateBonus * 0.05,
	);
	score = Math.max(5, Math.min(100, score));

	// Lossless verification verdict
	const isRealLossless =
		!bitDepthInfo.isUpscaled &&
		cutoffFrequency >= 19800 &&
		powerLoss < 44 &&
		score >= 75 &&
		sampleRate >= 40000;

	// Downsample Average & Peak Spectrum to ~120 points for 1D chart rendering
	const stepPoints = Math.max(1, Math.floor(fftLength / 120));
	const spectrumData: { frequency: number; power: number }[] = [];
	const peakSpectrumData: { frequency: number; power: number }[] = [];

	for (let i = 0; i < fftLength; i += stepPoints) {
		const f = Math.round(i * hzPerBin);
		if (f > 22050) break;
		spectrumData.push({
			frequency: f,
			power: Math.max(-100, Math.round(avgDbSpectrum[i])),
		});
		peakSpectrumData.push({
			frequency: f,
			power: Math.max(-100, Math.round(peakDbSpectrum[i])),
		});
	}

	if (onProgress) {
		onProgress(100);
	}

	return {
		isRealLossless,
		score,
		cutoffFrequency,
		avgPowerHigh: Math.round(avgPowerHigh),
		avgPowerMid: Math.round(avgPowerMid),
		spectrumData,
		peakSpectrumData,
		effectiveBitDepth: bitDepthInfo.effectiveBitDepth,
		highFreqTexture: Math.round(highFreqTexture * 10) / 10,
		isUpscaled: bitDepthInfo.isUpscaled,
		detectedSampleRate: sampleRate,
		scoreBreakdown: {
			cutoffScore,
			textureScore,
			bitDepthScore,
			powerLossScore,
			sampleRateBonus,
		},
		spectrogramFrames,
	};
}

/** In-place Radix-2 Cooley-Tukey FFT with zero heap allocation per call. */
function computeInPlaceFFT(
	real: Float32Array,
	imag: Float32Array,
	outMag: Float32Array,
): void {
	const n = real.length;
	const fftLength = n / 2;

	// Bit-reversal permutation
	let j = 0;
	for (let i = 0; i < n; i++) {
		if (i < j) {
			const tr = real[i];
			real[i] = real[j];
			real[j] = tr;
			const ti = imag[i];
			imag[i] = imag[j];
			imag[j] = ti;
		}
		let m = n >> 1;
		while (m >= 2 && j >= m) {
			j -= m;
			m >>= 1;
		}
		j += m;
	}

	// Butterfly computation
	for (let size = 2; size <= n; size <<= 1) {
		const halfSize = size >> 1;
		const stepAngle = (-2 * Math.PI) / size;
		for (let i = 0; i < n; i += size) {
			for (let k = 0; k < halfSize; k++) {
				const angle = stepAngle * k;
				const wR = Math.cos(angle);
				const wI = Math.sin(angle);
				const targetIdx = i + k + halfSize;
				const baseIdx = i + k;
				const tR = real[targetIdx] * wR - imag[targetIdx] * wI;
				const tI = real[targetIdx] * wI + imag[targetIdx] * wR;
				real[targetIdx] = real[baseIdx] - tR;
				imag[targetIdx] = imag[baseIdx] - tI;
				real[baseIdx] += tR;
				imag[baseIdx] += tI;
			}
		}
	}

	for (let i = 0; i < fftLength; i++) {
		outMag[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
	}
}
