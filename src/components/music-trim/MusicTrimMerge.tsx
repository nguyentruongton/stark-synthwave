import {
	Button,
	ButtonGroup,
	Card,
	Icon,
	IconButton,
	LoadingIndicator,
	Text,
	useSnackbar,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { AudioTrack, ExportFormatId } from "../../types";
import { safeDecodeAudioData } from "../../utils/audioAnalysis";
import { exportAudioBuffer } from "../../utils/audioEncoder";
import {
	AUDIO_ACCEPT_STRING,
	detectAudioFormat,
	GLOBAL_AUDIO_FORMATS,
} from "../../utils/audioFormats";
import { FrequencyVisualizer } from "../FrequencyVisualizer";
import { AudioExportSelector } from "./AudioExportSelector";
import { MergeQueueCard } from "./MergeQueueCard";
import { PlayheadOverlay } from "./PlayheadOverlay";
import { TrimControls } from "./TrimControls";
import { WaveformView } from "./WaveformView";

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 100);
	return `${mins}:${secs.toString().padStart(2, "0")}.${ms
		.toString()
		.padStart(2, "0")}`;
}

export function MusicTrimMerge() {
	const { showSnackbar } = useSnackbar();
	const { t, language } = useLanguage();
	const [track, setTrack] = useState<AudioTrack | null>(null);
	const [mergeQueue, setMergeQueue] = useState<AudioTrack[]>([]);
	const [exportFormat, setExportFormat] = useState<ExportFormatId>("wav-16");
	const [isLoading, setIsLoading] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackTime, setPlaybackTime] = useState(0);
	const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
	const [isMerging, setIsMerging] = useState(false);
	const [visualizerView, setVisualizerView] = useState<
		"both" | "waveform" | "spectrum"
	>("both");
	const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
	const [zoomLevel, setZoomLevel] = useState<number>(1);
	const [containerWidth, setContainerWidth] = useState<number>(640);
	const [cursorStyle, setCursorStyle] = useState<string>("pointer");

	const isPlayingRef = useRef<boolean>(false);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserNodeRef = useRef<AnalyserNode | null>(null);
	const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
	const startTimeRef = useRef<number>(0);
	const startOffsetRef = useRef<number>(0);
	const rafRef = useRef<number | null>(null);
	const waveformContainerRef = useRef<HTMLDivElement | null>(null);
	const isDraggingHandleRef = useRef<"start" | "end" | null>(null);
	const zoomLevelRef = useRef<number>(1);
	zoomLevelRef.current = zoomLevel;

	const currentWaveformWidth = Math.max(
		300,
		Math.round(containerWidth * zoomLevel),
	);

	const genId = () => Math.random().toString(36).substr(2, 9);

	const getAudioContext = () => {
		if (!audioContextRef.current) {
			const AudioCtx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!AudioCtx) return null;
			const ctx = new AudioCtx();
			audioContextRef.current = ctx;

			const analyser = ctx.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8;
			analyser.connect(ctx.destination);
			analyserNodeRef.current = analyser;
			setAnalyserNode(analyser);
		}
		return audioContextRef.current;
	};

	const getAnalyserNode = () => {
		getAudioContext();
		return analyserNodeRef.current;
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
		stopPlayback();
		try {
			const ctx = getAudioContext();
			const arrayBuffer = await file.arrayBuffer();
			const formatInfo = detectAudioFormat(arrayBuffer, file.name);
			const audioBuffer = await safeDecodeAudioData(
				ctx,
				arrayBuffer,
				file.name,
			);

			const newTrack: AudioTrack = {
				id: genId(),
				name: file.name,
				size: file.size,
				duration: audioBuffer.duration,
				sampleRate: audioBuffer.sampleRate,
				numberOfChannels: audioBuffer.numberOfChannels,
				audioBuffer,
				trimStart: 0,
				trimEnd: audioBuffer.duration,
				formatInfo,
			};

			setTrack(newTrack);
			setTrimRange([0, 100]);
			setPlaybackTime(0);
			startOffsetRef.current = 0;
			setZoomLevel(1);
			showSnackbar({
				message:
					language === "vi" ? `Đã tải: ${file.name}` : `Loaded: ${file.name}`,
			});
		} catch (err) {
			console.error("Audio decode error:", err);
			showSnackbar({
				message:
					language === "vi"
						? "Không thể giải mã tệp âm thanh này."
						: "Could not decode this audio file.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Resize observer for container width
	useEffect(() => {
		const container = waveformContainerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) {
					setContainerWidth(Math.floor(entry.contentRect.width));
				}
			}
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// Auto-scroll waveform viewport during playback when zoomed
	useEffect(() => {
		if (!isPlaying || zoomLevel <= 1 || !track || !waveformContainerRef.current)
			return;
		const container = waveformContainerRef.current;
		const playX = (playbackTime / track.duration) * currentWaveformWidth;
		const viewLeft = container.scrollLeft;
		const viewRight = viewLeft + container.clientWidth;

		if (playX > viewRight - 60 || playX < viewLeft) {
			container.scrollTo({
				left: Math.max(0, playX - container.clientWidth * 0.25),
				behavior: "smooth",
			});
		}
	}, [playbackTime, isPlaying, zoomLevel, track, currentWaveformWidth]);

	const stopPlayback = () => {
		isPlayingRef.current = false;
		setIsPlaying(false);
		if (sourceNodeRef.current) {
			try {
				sourceNodeRef.current.stop();
				sourceNodeRef.current.disconnect();
			} catch {}
			sourceNodeRef.current = null;
		}
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	};

	const startPlaybackFrom = (offsetSec: number) => {
		if (!track?.audioBuffer) return;
		stopPlayback();

		const ctx = getAudioContext();
		if (!ctx) return;
		if (ctx.state === "suspended") {
			ctx.resume();
		}

		const duration = track.duration;
		const startSec = (trimRange[0] / 100) * duration;
		const endSec = (trimRange[1] / 100) * duration;

		let startAt = offsetSec;
		if (startAt < startSec || startAt >= endSec - 0.05) {
			startAt = startSec;
		}

		const timeRemaining = endSec - startAt;
		if (timeRemaining <= 0.02) {
			startOffsetRef.current = startSec;
			setPlaybackTime(startSec);
			return;
		}

		const analyser = getAnalyserNode();
		const source = ctx.createBufferSource();
		source.buffer = track.audioBuffer;
		if (analyser) {
			source.connect(analyser);
		} else {
			source.connect(ctx.destination);
		}

		source.start(0, startAt, timeRemaining);
		sourceNodeRef.current = source;

		const startedCtxTime = ctx.currentTime;
		startTimeRef.current = startedCtxTime;
		startOffsetRef.current = startAt;
		isPlayingRef.current = true;
		setIsPlaying(true);
		setPlaybackTime(startAt);

		source.onended = () => {
			if (sourceNodeRef.current === source && isPlayingRef.current) {
				isPlayingRef.current = false;
				setIsPlaying(false);
				startOffsetRef.current = startSec;
				setPlaybackTime(startSec);
				if (rafRef.current) {
					cancelAnimationFrame(rafRef.current);
					rafRef.current = null;
				}
			}
		};

		const updatePlayhead = () => {
			if (!isPlayingRef.current || sourceNodeRef.current !== source) return;
			const elapsed = ctx.currentTime - startedCtxTime;
			const currentPos = startAt + elapsed;

			if (currentPos < endSec) {
				startOffsetRef.current = currentPos;
				setPlaybackTime(currentPos);
				rafRef.current = requestAnimationFrame(updatePlayhead);
			} else {
				isPlayingRef.current = false;
				setIsPlaying(false);
				startOffsetRef.current = startSec;
				setPlaybackTime(startSec);
				if (rafRef.current) {
					cancelAnimationFrame(rafRef.current);
					rafRef.current = null;
				}
			}
		};
		rafRef.current = requestAnimationFrame(updatePlayhead);
	};

	const togglePlayback = () => {
		if (isPlayingRef.current) {
			stopPlayback();
		} else {
			startPlaybackFrom(startOffsetRef.current);
		}
	};

	const seekTo = (targetSec: number, resumePlay = false) => {
		if (!track) return;
		const duration = track.duration;
		const startSec = (trimRange[0] / 100) * duration;
		const endSec = (trimRange[1] / 100) * duration;
		const clampedSec = Math.max(startSec, Math.min(endSec, targetSec));

		startOffsetRef.current = clampedSec;
		setPlaybackTime(clampedSec);

		if (resumePlay) {
			startPlaybackFrom(clampedSec);
		} else if (isPlayingRef.current) {
			stopPlayback();
		}
	};

	const resetTrim = () => {
		stopPlayback();
		setTrimRange([0, 100]);
		setPlaybackTime(0);
		startOffsetRef.current = 0;
	};

	const handleZoomIn = () => {
		setZoomLevel((z) => Math.min(8, Number((z * 1.5).toFixed(2))));
	};

	const handleZoomOut = () => {
		setZoomLevel((z) => Math.max(1, Number((z / 1.5).toFixed(2))));
	};

	const handleZoomReset = () => {
		setZoomLevel(1);
	};

	const handleZoomToSelection = () => {
		if (!track) return;
		const duration = track.duration;
		const selDuration = Math.max(
			0.01,
			((trimRange[1] - trimRange[0]) / 100) * duration,
		);
		const targetZoom = Math.max(
			1,
			Math.min(8, Number((duration / selDuration).toFixed(2))),
		);
		setZoomLevel(targetZoom);
	};

	const handleWaveformMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!track) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const leftBound = (trimRange[0] / 100) * currentWaveformWidth;
		const rightBound = (trimRange[1] / 100) * currentWaveformWidth;

		const hitThreshold = 14;
		if (Math.abs(clickX - leftBound) <= hitThreshold) {
			isDraggingHandleRef.current = "start";
			return;
		}
		if (Math.abs(clickX - rightBound) <= hitThreshold) {
			isDraggingHandleRef.current = "end";
			return;
		}

		// Direct seek
		const ratio = Math.max(0, Math.min(1, clickX / currentWaveformWidth));
		seekTo(ratio * track.duration, isPlayingRef.current);
	};

	const handleWaveformMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!track) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const curX = e.clientX - rect.left;
		const leftBound = (trimRange[0] / 100) * currentWaveformWidth;
		const rightBound = (trimRange[1] / 100) * currentWaveformWidth;

		if (isDraggingHandleRef.current === "start") {
			const newStartPct = Math.max(
				0,
				Math.min(trimRange[1] - 0.05, (curX / currentWaveformWidth) * 100),
			);
			setTrimRange([newStartPct, trimRange[1]]);
			const newSec = (newStartPct / 100) * track.duration;
			startOffsetRef.current = newSec;
			setPlaybackTime(newSec);
			return;
		}

		if (isDraggingHandleRef.current === "end") {
			const newEndPct = Math.min(
				100,
				Math.max(trimRange[0] + 0.05, (curX / currentWaveformWidth) * 100),
			);
			setTrimRange([trimRange[0], newEndPct]);
			return;
		}

		const hitThreshold = 12;
		if (
			Math.abs(curX - leftBound) <= hitThreshold ||
			Math.abs(curX - rightBound) <= hitThreshold
		) {
			setCursorStyle("col-resize");
		} else {
			setCursorStyle("pointer");
		}
	};

	const handleWaveformMouseUp = () => {
		isDraggingHandleRef.current = null;
	};

	const adjustTrimStart = (deltaSec: number) => {
		if (!track) return;
		const duration = track.duration;
		const currentStartSec = (trimRange[0] / 100) * duration;
		const currentEndSec = (trimRange[1] / 100) * duration;
		const newStartSec = Math.max(
			0,
			Math.min(currentEndSec - 0.02, currentStartSec + deltaSec),
		);
		const newStartPct = (newStartSec / duration) * 100;
		setTrimRange([newStartPct, trimRange[1]]);
		startOffsetRef.current = newStartSec;
		setPlaybackTime(newStartSec);
	};

	const adjustTrimEnd = (deltaSec: number) => {
		if (!track) return;
		const duration = track.duration;
		const currentStartSec = (trimRange[0] / 100) * duration;
		const currentEndSec = (trimRange[1] / 100) * duration;
		const newEndSec = Math.min(
			duration,
			Math.max(currentStartSec + 0.02, currentEndSec + deltaSec),
		);
		const newEndPct = (newEndSec / duration) * 100;
		setTrimRange([trimRange[0], newEndPct]);
	};

	const setStartToCurrentPlayback = () => {
		if (!track) return;
		const duration = track.duration;
		const currentEndSec = (trimRange[1] / 100) * duration;
		const newStartSec = Math.max(
			0,
			Math.min(currentEndSec - 0.02, playbackTime),
		);
		setTrimRange([(newStartSec / duration) * 100, trimRange[1]]);
		startOffsetRef.current = newStartSec;
	};

	const setEndToCurrentPlayback = () => {
		if (!track) return;
		const duration = track.duration;
		const currentStartSec = (trimRange[0] / 100) * duration;
		const newEndSec = Math.min(
			duration,
			Math.max(currentStartSec + 0.02, playbackTime),
		);
		setTrimRange([trimRange[0], (newEndSec / duration) * 100]);
	};

	const handleQuickExportCurrent = async () => {
		if (!track?.audioBuffer) return;
		setIsMerging(true);
		try {
			const buffer = track.audioBuffer;
			const sampleRate = buffer.sampleRate;
			const numChannels = buffer.numberOfChannels;
			const duration = track.duration;

			const startSec = (trimRange[0] / 100) * duration;
			const endSec = (trimRange[1] / 100) * duration;
			const startSample = Math.floor(startSec * sampleRate);
			const endSample = Math.min(
				buffer.length,
				Math.floor(endSec * sampleRate),
			);
			const length = Math.max(1, endSample - startSample);

			const ctx = getAudioContext();
			if (!ctx) throw new Error("AudioContext unavailable");

			const trimmedBuffer = ctx.createBuffer(numChannels, length, sampleRate);
			for (let c = 0; c < numChannels; c++) {
				const src = buffer.getChannelData(c);
				const dst = trimmedBuffer.getChannelData(c);
				dst.set(src.subarray(startSample, endSample));
			}

			const exportRes = await exportAudioBuffer(trimmedBuffer, exportFormat);
			const url = URL.createObjectURL(exportRes.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `stark_trim_${Date.now()}.${exportRes.extension}`;
			a.click();
			URL.revokeObjectURL(url);

			showSnackbar({
				message:
					language === "vi"
						? "Xuất đoạn nhạc thành công!"
						: "Exported selection successfully!",
			});
		} catch (err) {
			console.error("Quick export error:", err);
			showSnackbar({
				message: language === "vi" ? "Lỗi khi xuất file." : "Failed to export.",
			});
		} finally {
			setIsMerging(false);
		}
	};

	const addToMergeQueue = () => {
		if (!track?.audioBuffer) return;
		const buffer = track.audioBuffer;
		const sampleRate = buffer.sampleRate;
		const numChannels = buffer.numberOfChannels;
		const duration = track.duration;

		const startSec = (trimRange[0] / 100) * duration;
		const endSec = (trimRange[1] / 100) * duration;
		const startSample = Math.floor(startSec * sampleRate);
		const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
		const length = Math.max(1, endSample - startSample);

		const ctx = getAudioContext();
		if (!ctx) return;

		const trimmedBuffer = ctx.createBuffer(numChannels, length, sampleRate);
		for (let c = 0; c < numChannels; c++) {
			const src = buffer.getChannelData(c);
			const dst = trimmedBuffer.getChannelData(c);
			dst.set(src.subarray(startSample, endSample));
		}

		const queueItem: AudioTrack = {
			id: genId(),
			name: `${track.name.replace(/\.[^/.]+$/, "")} [${formatTime(startSec)}-${formatTime(endSec)}]`,
			size: Math.round(
				track.size * ((endSec - startSec) / (track.duration || 1)),
			),
			duration: trimmedBuffer.duration,
			sampleRate: trimmedBuffer.sampleRate,
			numberOfChannels: trimmedBuffer.numberOfChannels,
			audioBuffer: trimmedBuffer,
			trimStart: 0,
			trimEnd: trimmedBuffer.duration,
			formatInfo: track.formatInfo,
		};

		setMergeQueue((q) => [...q, queueItem]);
		showSnackbar({
			message:
				language === "vi"
					? "Đã thêm đoạn vào danh sách ghép."
					: "Added segment to merge queue.",
		});
	};

	const handleMergeQueue = async () => {
		if (mergeQueue.length < 2) return;
		setIsMerging(true);
		try {
			const sampleRate = mergeQueue[0].sampleRate;
			const numChannels = Math.max(
				...mergeQueue.map((t) => t.numberOfChannels),
			);
			const totalLength = mergeQueue.reduce(
				(sum, t) => sum + (t.audioBuffer?.length || 0),
				0,
			);

			const ctx = getAudioContext();
			if (!ctx) throw new Error("AudioContext unavailable");

			const mergedBuffer = ctx.createBuffer(
				numChannels,
				totalLength,
				sampleRate,
			);

			let offset = 0;
			for (const item of mergeQueue) {
				if (!item.audioBuffer) continue;
				const itemBuffer = item.audioBuffer;
				for (let c = 0; c < numChannels; c++) {
					const dst = mergedBuffer.getChannelData(c);
					const src =
						c < itemBuffer.numberOfChannels
							? itemBuffer.getChannelData(c)
							: itemBuffer.getChannelData(0);
					dst.set(src, offset);
				}
				offset += itemBuffer.length;
			}

			const exportRes = await exportAudioBuffer(mergedBuffer, exportFormat);
			const url = URL.createObjectURL(exportRes.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `stark_merged_${Date.now()}.${exportRes.extension}`;
			a.click();
			URL.revokeObjectURL(url);

			showSnackbar({
				message:
					language === "vi"
						? "Nối nhạc thành công!"
						: "Merged tracks successfully!",
			});
		} catch (err) {
			console.error("Merge error:", err);
			showSnackbar({
				message:
					language === "vi" ? "Lỗi khi nối file." : "Failed to merge tracks.",
			});
		} finally {
			setIsMerging(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
			{/* Header */}
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2.5">
					<div className="p-2 rounded-m3-large bg-m3-primary/10 text-m3-primary">
						<Icon name="content_cut" size={24} />
					</div>
					<Text variant="headline-sm" className="font-bold text-m3-on-surface">
						{t("trim_title")}
					</Text>
				</div>
				<Text
					variant="body-md"
					className="text-m3-on-surface-variant max-w-2xl"
				>
					{t("trim_desc")}
				</Text>
			</div>

			{/* Main Workspace Card */}
			<Card
				variant="elevated"
				className="p-5 flex flex-col gap-5 bg-m3-surface-container-low rounded-2xl border border-m3-outline-variant/40"
			>
				{/* File Drop / Selection */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop dropzone container */}
				<div
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className="border-2 border-dashed border-m3-outline-variant/60 hover:border-m3-primary/70 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 bg-m3-surface-container-lowest/50 transition-colors"
				>
					<Icon name="cloud_upload" size={32} className="text-m3-primary" />
					<div>
						<Text variant="body-md" className="font-medium text-m3-on-surface">
							{t("trim_drop_title")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("trim_drop_desc")}
						</Text>
						<Text
							variant="label-sm"
							className="text-m3-primary font-medium mt-1"
						>
							{language === "vi"
								? `Hỗ trợ: ${GLOBAL_AUDIO_FORMATS.map((f) => f.name).join(", ")}`
								: `Supported: ${GLOBAL_AUDIO_FORMATS.map((f) => f.name).join(", ")}`}
						</Text>
					</div>
					<input
						type="file"
						accept={AUDIO_ACCEPT_STRING}
						className="hidden"
						id="audio-upload"
						onChange={handleFileChange}
					/>
					<label htmlFor="audio-upload">
						<Button
							colorStyle="tonal"
							size="sm"
							icon={<Icon name="folder_open" />}
							className="pointer-events-none"
						>
							{t("trim_select_new")}
						</Button>
					</label>
				</div>

				{/* Active Track Workspace */}
				{track && (
					<div className="flex flex-col gap-4">
						{/* Track info bar */}
						<div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-m3-surface-container rounded-xl">
							<div className="flex items-center gap-3 overflow-hidden">
								<div className="w-10 h-10 rounded-lg bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shrink-0">
									<Icon name="music_note" size={20} />
								</div>
								<div className="overflow-hidden">
									<Text
										variant="title-sm"
										className="font-semibold text-m3-on-surface truncate block"
									>
										{track.name}
									</Text>
									<div className="flex items-center gap-2 text-xs text-m3-on-surface-variant font-mono">
										{track.formatInfo && <span>{track.formatInfo.name}</span>}
										<span>•</span>
										<span>{(track.size / (1024 * 1024)).toFixed(2)} MB</span>
										<span>•</span>
										<span>{Math.round(track.sampleRate / 1000)} kHz</span>
										<span>•</span>
										<span>{formatTime(track.duration)}</span>
									</div>
								</div>
							</div>

							{/* Visualizer selector */}
							<ButtonGroup variant="connected" size="xs">
								<Button
									colorStyle={visualizerView === "both" ? "filled" : "outlined"}
									onClick={() => setVisualizerView("both")}
								>
									{language === "vi" ? "Cả hai" : "Both"}
								</Button>
								<Button
									colorStyle={
										visualizerView === "waveform" ? "filled" : "outlined"
									}
									onClick={() => setVisualizerView("waveform")}
								>
									{language === "vi" ? "Sóng âm" : "Wave"}
								</Button>
								<Button
									colorStyle={
										visualizerView === "spectrum" ? "filled" : "outlined"
									}
									onClick={() => setVisualizerView("spectrum")}
								>
									{language === "vi" ? "Phổ tần" : "Spectrum"}
								</Button>
							</ButtonGroup>
						</div>

						{/* Waveform Viewport */}
						{(visualizerView === "waveform" || visualizerView === "both") && (
							<div className="flex flex-col gap-2">
								{/* Zoom Toolbar */}
								<div className="flex flex-wrap items-center justify-between gap-2 px-1">
									<div className="flex items-center gap-1.5">
										<Text
											variant="label-sm"
											className="font-medium text-m3-on-surface-variant text-xs"
										>
											{t("trim_zoom_label")}
										</Text>
										<div className="flex items-center gap-1">
											<IconButton
												size="xs"
												onClick={handleZoomOut}
												disabled={zoomLevel <= 1}
												title={t("trim_zoom_out")}
												aria-label={t("trim_zoom_out")}
											>
												<Icon name="zoom_out" size={14} />
											</IconButton>
											<Button
												colorStyle="outlined"
												size="xs"
												onClick={handleZoomReset}
												disabled={zoomLevel === 1}
											>
												{zoomLevel.toFixed(1)}x
											</Button>
											<IconButton
												size="xs"
												onClick={handleZoomIn}
												disabled={zoomLevel >= 8}
												title={t("trim_zoom_in")}
												aria-label={t("trim_zoom_in")}
											>
												<Icon name="zoom_in" size={14} />
											</IconButton>
										</div>
									</div>

									<Button
										size="xs"
										colorStyle="tonal"
										onClick={handleZoomToSelection}
										icon={<Icon name="fit_screen" size={14} />}
									>
										{language === "vi"
											? "Phóng to vùng chọn"
											: "Fit to Selection"}
									</Button>
								</div>

								{/* Dual-layer Waveform with Isolated Playhead Overlay */}
								<Card
									variant="outlined"
									className="relative overflow-hidden bg-m3-surface border-m3-outline-variant rounded-xl p-0"
								>
									<div
										ref={waveformContainerRef}
										className="w-full overflow-x-auto relative select-none scrollbar-thin"
										style={{ height: "132px" }}
									>
										{/* Layer 1: Base waveform (rendered only on track/zoom/trim change) */}
										<WaveformView
											track={track}
											trimRange={trimRange}
											currentWaveformWidth={currentWaveformWidth}
											cursorStyle={cursorStyle}
											onMouseDown={handleWaveformMouseDown}
											onMouseMove={handleWaveformMouseMove}
											onMouseUp={handleWaveformMouseUp}
											onMouseLeave={handleWaveformMouseUp}
										/>

										{/* Layer 2: Decoupled 60fps Playhead Overlay */}
										<PlayheadOverlay
											playbackTime={playbackTime}
											duration={track.duration}
											width={currentWaveformWidth}
											height={132}
										/>
									</div>

									{/* Bottom stats and position indicator */}
									<div className="absolute top-2 right-2 pointer-events-none">
										<Card
											variant="filled"
											className="bg-m3-surface-container-high/90 backdrop-blur-sm text-m3-on-surface text-xs px-2 py-0.5 rounded font-mono border border-m3-outline-variant/30"
										>
											<Text
												variant="label-sm"
												className="font-mono text-m3-primary font-bold"
											>
												{formatTime(playbackTime)}
											</Text>
										</Card>
									</div>

									<div className="absolute bottom-2 left-3 flex items-center gap-2 pointer-events-none">
										<Card
											variant="filled"
											className="bg-m3-surface-container-high/90 backdrop-blur-sm text-m3-on-surface text-xs px-2.5 py-0.5 rounded-md font-mono border border-m3-outline-variant/40"
										>
											<Text
												variant="label-sm"
												className="font-mono text-m3-on-surface"
											>
												{formatTime(playbackTime)} /{" "}
												{formatTime(track.duration)}
											</Text>
										</Card>
									</div>
								</Card>
							</div>
						)}

						{/* Real-time Frequency Visualizer */}
						{(visualizerView === "spectrum" || visualizerView === "both") && (
							<FrequencyVisualizer
								analyserNode={analyserNode}
								isPlaying={isPlaying}
								height={120}
							/>
						)}

						{/* Trim Controls with Steppers & Actions */}
						<TrimControls
							track={track}
							playbackTime={playbackTime}
							isPlaying={isPlaying}
							trimRange={trimRange}
							isMerging={isMerging}
							onTogglePlayback={togglePlayback}
							onSeekFromStart={() =>
								seekTo((trimRange[0] / 100) * track.duration, true)
							}
							onResetTrim={resetTrim}
							onQuickExport={handleQuickExportCurrent}
							onAddToQueue={addToMergeQueue}
							onTrimRangeChange={(val) => {
								stopPlayback();
								setTrimRange(val);
								const currentSec = (val[0] / 100) * track.duration;
								startOffsetRef.current = currentSec;
								setPlaybackTime(currentSec);
							}}
							onAdjustStart={adjustTrimStart}
							onAdjustEnd={adjustTrimEnd}
							onSetStartToCurrent={setStartToCurrentPlayback}
							onSetEndToCurrent={setEndToCurrentPlayback}
						/>
					</div>
				)}

				{isLoading && (
					<div className="flex flex-col items-center gap-3 p-4">
						<LoadingIndicator aria-label="Loading audio" size={40} />
						<Text variant="body-sm" className="text-m3-primary">
							{language === "vi"
								? "Đang tải và giải mã tệp âm thanh..."
								: "Loading and decoding audio file..."}
						</Text>
					</div>
				)}
			</Card>

			{/* Global Export Format Selector */}
			<AudioExportSelector
				exportFormat={exportFormat}
				onFormatChange={setExportFormat}
			/>

			{/* Merge Queue / Splicing Manager */}
			<MergeQueueCard
				mergeQueue={mergeQueue}
				isMerging={isMerging}
				onClearQueue={() => setMergeQueue([])}
				onRemoveFromQueue={(id) =>
					setMergeQueue((q) => q.filter((t) => t.id !== id))
				}
				onMerge={handleMergeQueue}
			/>
		</div>
	);
}
