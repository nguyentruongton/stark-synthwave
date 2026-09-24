import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { AudioFormatInfo, QualityResult } from "../../types";
import {
	analyzeLosslessQuality,
	safeDecodeAudioData,
} from "../../utils/audioAnalysis";
import { detectAudioFormat } from "../../utils/audioFormats";

export function useLosslessAnalysis() {
	const { language } = useLanguage();
	const [file, setFile] = useState<File | null>(null);
	const [detectedFormat, setDetectedFormat] = useState<AudioFormatInfo | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [result, setResult] = useState<QualityResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackTime, setPlaybackTime] = useState(0);
	const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

	const playbackCtxRef = useRef<AudioContext | null>(null);
	const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const playbackStartCtxTimeRef = useRef<number>(0);
	const playbackStartOffsetRef = useRef<number>(0);
	const rafRef = useRef<number | null>(null);

	const getPlaybackContext = useCallback(() => {
		if (!playbackCtxRef.current) {
			const AudioCtx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!AudioCtx) {
				throw new Error("Web Audio API is not supported in this browser.");
			}
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
	}, []);

	const stopPlayback = useCallback(() => {
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
			} catch {
				// Ignore node teardown errors
			}
			playbackSourceRef.current = null;
		}
	}, []);

	const togglePlayback = useCallback(async () => {
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
	}, [
		decodedBuffer,
		getPlaybackContext,
		isPlaying,
		playbackTime,
		stopPlayback,
	]);

	useEffect(() => {
		return () => {
			stopPlayback();
			if (analyserRef.current) {
				try {
					analyserRef.current.disconnect();
				} catch {
					// Ignore node disconnect error
				}
				analyserRef.current = null;
			}
			if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
				playbackCtxRef.current.close().catch(() => {});
			}
		};
	}, [stopPlayback]);

	const resetAll = useCallback(() => {
		stopPlayback();
		setFile(null);
		setResult(null);
		setDecodedBuffer(null);
		setDetectedFormat(null);
		setError(null);
		setPlaybackTime(0);
	}, [stopPlayback]);

	const analyzeFile = useCallback(
		async (selectedFile: File) => {
			stopPlayback();
			setIsLoading(true);
			setAnalysisProgress(5);
			setResult(null);
			setDecodedBuffer(null);
			setError(null);
			setFile(selectedFile);

			let audioContext: AudioContext | null = null;
			let worker: Worker | null = null;

			try {
				const AudioCtx =
					window.AudioContext ||
					(window as unknown as { webkitAudioContext?: typeof AudioContext })
						.webkitAudioContext;
				if (!AudioCtx) {
					throw new Error(
						language === "vi"
							? "Trình duyệt không hỗ trợ Web Audio API"
							: "Web Audio API is not supported in this browser",
					);
				}
				audioContext = new AudioCtx();
				const arrayBuffer = await selectedFile.arrayBuffer();
				const fmt = detectAudioFormat(arrayBuffer, selectedFile.name);
				setDetectedFormat(fmt);

				setAnalysisProgress(15);
				const audioBuffer = await safeDecodeAudioData(
					audioContext,
					arrayBuffer,
					selectedFile.name,
				);
				setDecodedBuffer(audioBuffer);
				setAnalysisProgress(25);

				// Extract mono channel data
				const channelData = audioBuffer.getChannelData(0);

				// Attempt processing in Web Worker with Transferable ArrayBuffer (zero-copy)
				try {
					worker = new Worker(
						new URL("../../workers/losslessWorker.ts", import.meta.url),
						{ type: "module" },
					);
				} catch (workerInitErr) {
					console.warn(
						"Could not spawn Web Worker, executing analysis in main thread:",
						workerInitErr,
					);
				}

				if (worker) {
					// Clone Float32Array to transfer its buffer without detaching audioBuffer's playback memory
					const channelDataCopy = new Float32Array(channelData);

					const qualityResult = await new Promise<QualityResult>(
						(resolve, reject) => {
							worker!.onmessage = (e: MessageEvent) => {
								if (e.data.type === "progress") {
									setAnalysisProgress(Math.max(25, e.data.percent));
								} else if (e.data.type === "done") {
									resolve(e.data.result);
								} else if (e.data.type === "error") {
									reject(new Error(e.data.error));
								}
							};
							worker!.onerror = (err) => {
								reject(err);
							};

							// Transfer channelDataCopy.buffer with zero-copy
							worker!.postMessage(
								{
									channelData: channelDataCopy,
									sampleRate: audioBuffer.sampleRate,
									duration: audioBuffer.duration,
									claimedBitDepth: fmt.bitDepth,
								},
								[channelDataCopy.buffer],
							);
						},
					);
					setResult(qualityResult);
				} else {
					// Fallback to synchronous in-thread execution
					const qualityResult = analyzeLosslessQuality(
						audioBuffer,
						fmt.bitDepth,
						(p) => setAnalysisProgress(Math.max(25, p)),
					);
					setResult(qualityResult);
				}
				setAnalysisProgress(100);
			} catch (err: unknown) {
				console.error("Lỗi phân tích chất lượng nhạc:", err);
				const errorMessage =
					err instanceof Error
						? err.message
						: typeof err === "string"
							? err
							: null;
				setError(
					errorMessage ||
						(language === "vi"
							? "Không thể phân tích tệp âm thanh này. Hãy chắc chắn rằng đây là tệp nhạc hợp lệ."
							: "Unable to analyze audio file. Please check that it is a valid audio file."),
				);
				setFile(null);
				setDetectedFormat(null);
			} finally {
				if (worker) {
					worker.terminate();
				}
				if (audioContext && audioContext.state !== "closed") {
					audioContext.close().catch(() => {});
				}
				setIsLoading(false);
			}
		},
		[language, stopPlayback],
	);

	return {
		file,
		detectedFormat,
		isLoading,
		analysisProgress,
		result,
		error,
		decodedBuffer,
		isPlaying,
		playbackTime,
		analyserNode,
		analyzeFile,
		togglePlayback,
		stopPlayback,
		setPlaybackTime,
		resetAll,
		setError,
	};
}
