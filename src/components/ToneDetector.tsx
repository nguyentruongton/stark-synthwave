import {
	Button,
	Card,
	Chip,
	Divider,
	Icon,
	IconButton,
	LoadingIndicator,
	Text,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { AudioFormatInfo, KeyResult } from "../types";
import { detectKey, safeDecodeAudioData } from "../utils/audioAnalysis";
import {
	AUDIO_ACCEPT_STRING,
	detectAudioFormat,
	GLOBAL_AUDIO_FORMATS,
} from "../utils/audioFormats";

const NOTE_LABELS = [
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

export function ToneDetector() {
	const { t, language } = useLanguage();
	const [file, setFile] = useState<File | null>(null);
	const [detectedFormat, setDetectedFormat] = useState<AudioFormatInfo | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<KeyResult | null>(null);
	const [showInfo, setShowInfo] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		await processAndDetectKey(file);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files?.[0];
		if (!droppedFile) return;
		await processAndDetectKey(droppedFile);
	};

	const processAndDetectKey = async (selectedFile: File) => {
		setIsLoading(true);
		setResult(null);
		setError(null);
		setFile(selectedFile);

		let audioContext: AudioContext | null = null;
		let worker: Worker | null = null;
		try {
			const AudioCtx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!AudioCtx) throw new Error("Web Audio API is not supported");
			audioContext = new AudioCtx();
			const arrayBuffer = await selectedFile.arrayBuffer();
			const fmt = detectAudioFormat(arrayBuffer, selectedFile.name);
			setDetectedFormat(fmt);

			const audioBuffer = await safeDecodeAudioData(
				audioContext,
				arrayBuffer,
				selectedFile.name,
			);
			const channelData = audioBuffer.getChannelData(0);

			// Offload to Web Worker with zero-copy ArrayBuffer transfer
			try {
				worker = new Worker(
					new URL("../workers/audioAnalysisWorker.ts", import.meta.url),
					{ type: "module" },
				);
			} catch (workerErr) {
				console.warn(
					"Could not spawn audioAnalysisWorker, running on main thread:",
					workerErr,
				);
			}

			if (worker) {
				const keyResult = await new Promise<KeyResult>((resolve, reject) => {
					worker!.onmessage = (e: MessageEvent) => {
						if (e.data.type === "done") resolve(e.data.result);
						else reject(new Error(e.data.error));
					};
					worker!.onerror = (err) => reject(err);
					worker!.postMessage(
						{
							type: "key",
							channelData,
							sampleRate: audioBuffer.sampleRate,
						},
						[channelData.buffer],
					);
				});
				setResult(keyResult);
			} else {
				const keyResult = detectKey(audioBuffer);
				setResult(keyResult);
			}
		} catch (err: unknown) {
			console.error("Lỗi xác định tone bài hát:", err);
			const errorMessage =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: null;
			setError(
				errorMessage ||
					(language === "vi"
						? "Đã xảy ra lỗi khi phân tích tone bài hát. Hãy chắc chắn rằng tệp âm thanh hợp lệ."
						: "Failed to analyze key/tone for this audio file."),
			);
			setFile(null);
			setDetectedFormat(null);
		} finally {
			if (worker) worker.terminate();
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
			relation:
				language === "vi"
					? "Chuyển Đổi Trưởng/Thứ (Parallel)"
					: "Relative Major/Minor (Parallel)",
		});

		// 2. Neighbor keys (+1 and -1 step on wheel)
		const prevNum = matchNum === 1 ? 12 : matchNum - 1;
		matches.push({
			key: `${prevNum}${matchLetter}`,
			relation:
				language === "vi"
					? "Hạ tông (Subdominant)"
					: "1 Step Counterclockwise (Subdominant)",
		});

		const nextNum = matchNum === 12 ? 1 : matchNum + 1;
		matches.push({
			key: `${nextNum}${matchLetter}`,
			relation:
				language === "vi"
					? "Tăng tông (Dominant)"
					: "1 Step Clockwise (Dominant)",
		});

		return matches;
	};

	return (
		<div className="flex flex-col gap-6 overflow-hidden" id="tone-tab">
			<Card
				variant="outlined"
				className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
			>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
					<div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
						<IconButton
							colorStyle="tonal"
							aria-label="Key"
							className="shrink-0"
						>
							<Icon name="vpn_key" className="text-m3-primary" />
						</IconButton>
						<div className="min-w-0 flex-1">
							<Text
								variant="title-md"
								className="font-semibold text-m3-on-surface wrap-break-word whitespace-normal"
							>
								{t("tone_title")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant wrap-break-word whitespace-normal"
							>
								{t("tone_desc")}
							</Text>
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
					<Card
						variant="filled"
						className="bg-m3-primary-container/25 border border-m3-primary/30 p-4 rounded-xl flex flex-col gap-2"
					>
						<Text
							variant="body-md"
							className="font-semibold text-m3-on-primary-container wrap-break-word whitespace-normal"
						>
							{t("tone_help_title")}
						</Text>
						<Text
							variant="body-sm"
							className="text-m3-on-surface-variant wrap-break-word whitespace-normal"
						>
							{t("tone_help_p1")}
						</Text>
						<Text
							variant="body-sm"
							className="text-m3-on-surface-variant wrap-break-word whitespace-normal"
						>
							{t("tone_help_p2")}
						</Text>
					</Card>
				)}

				{error && (
					<Card
						variant="filled"
						className="flex items-center justify-between p-4 bg-m3-error-container text-m3-on-error-container border border-m3-error/30 rounded-xl animate-in fade-in duration-200 min-w-0 gap-2"
					>
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<Icon name="error" className="text-m3-error shrink-0" />
							<Text
								variant="body-sm"
								className="text-m3-on-error-container font-medium wrap-break-word whitespace-normal min-w-0 flex-1"
							>
								{error}
							</Text>
						</div>
						<IconButton
							colorStyle="standard"
							onClick={() => setError(null)}
							aria-label="Close error"
							className="shrink-0"
						>
							<Icon
								name="close"
								size={18}
								className="text-m3-on-error-container"
							/>
						</IconButton>
					</Card>
				)}

				{!file ? (
					<Card
						variant="outlined"
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						className="border-2 border-dashed border-m3-outline-variant/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 hover:bg-m3-surface-container-low transition-colors text-center bg-m3-surface-container-lowest/40"
					>
						{/* biome-ignore lint/a11y/useSemanticElements: dropzone icon and title trigger file picker */}
						<div
							role="button"
							tabIndex={0}
							className="flex flex-col items-center gap-3 cursor-pointer select-none group"
							onClick={() => document.getElementById("tone-upload")?.click()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									document.getElementById("tone-upload")?.click();
								}
							}}
						>
							<div className="w-16 h-16 rounded-full bg-m3-primary-container/40 flex items-center justify-center text-m3-primary group-hover:scale-105 transition-transform">
								<Icon name="music_note" size={36} />
							</div>
							<div className="min-w-0">
								<Text
									variant="title-md"
									className="font-semibold text-m3-on-surface wrap-break-word whitespace-normal"
								>
									{t("tone_drop_title")}
								</Text>
								<Text
									variant="body-sm"
									className="text-m3-on-surface-variant wrap-break-word whitespace-normal mt-1"
								>
									{t("tone_drop_desc")}
								</Text>
							</div>
						</div>

						{/* Global format chips */}
						<div className="flex flex-wrap gap-2 justify-center max-w-xl mt-1">
							{GLOBAL_AUDIO_FORMATS.map((fmt) => (
								<Chip
									key={fmt.extension}
									variant="suggestion"
									elevated={fmt.isLossless}
									label={`.${fmt.extension.toUpperCase()}${fmt.isLossless ? " ★" : ""}`}
									title={`${fmt.name}: ${fmt.description}`}
									className="text-xs font-mono"
									onClick={() =>
										document.getElementById("tone-upload")?.click()
									}
								/>
							))}
						</div>

						<Button
							colorStyle="tonal"
							icon={<Icon name="upload_file" size={18} />}
							className="mt-2"
							onClick={() => document.getElementById("tone-upload")?.click()}
						>
							{language === "vi" ? "Chọn tệp âm thanh" : "Select Audio File"}
						</Button>

						<input
							id="tone-upload"
							type="file"
							accept={AUDIO_ACCEPT_STRING}
							className="hidden"
							onChange={handleFileChange}
						/>
					</Card>
				) : (
					<div className="flex flex-col gap-4">
						{/* File info bar with format badge */}
						<Card
							variant="filled"
							className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-m3-surface-container-low rounded-xl gap-3 border border-m3-outline-variant/40"
						>
							<div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
								<div className="w-10 h-10 rounded-xl bg-m3-primary-container flex items-center justify-center text-m3-on-primary-container shrink-0">
									<Icon
										name="album"
										className={isLoading ? "animate-spin" : ""}
									/>
								</div>
								<div className="overflow-hidden min-w-0 flex-1">
									<div className="flex items-center gap-2 flex-wrap">
										<Text
											variant="body-md"
											className="font-semibold text-m3-on-surface truncate block"
										>
											{file.name}
										</Text>
										{detectedFormat && (
											<Chip
												variant="assist"
												leadingIcon={
													<Icon
														name={
															detectedFormat.isLossless
																? "verified"
																: "audiotrack"
														}
														size={14}
													/>
												}
												label={detectedFormat.name}
												className="text-xs font-mono h-7"
											/>
										)}
									</div>
									<Text
										variant="body-sm"
										className="text-m3-on-surface-variant"
									>
										{t("common_file_size")}:{" "}
										{(file.size / (1024 * 1024)).toFixed(2)} MB
									</Text>
								</div>
							</div>
							<Button
								colorStyle="outlined"
								size="sm"
								icon={<Icon name="refresh" size={16} />}
								onClick={() => {
									setFile(null);
									setResult(null);
									setDetectedFormat(null);
								}}
								disabled={isLoading}
								className="shrink-0 w-full sm:w-auto"
							>
								{t("tone_check_another")}
							</Button>
						</Card>
					</div>
				)}

				{isLoading && (
					<Card
						variant="outlined"
						className="flex flex-col items-center justify-center gap-3.5 p-8 sm:p-10 bg-m3-surface-container-low/40 rounded-2xl border-m3-outline-variant/30 text-center"
					>
						<LoadingIndicator
							aria-label="Analyzing song key"
							size={48}
							className="shrink-0"
						/>
						<Text variant="title-sm" className="text-m3-primary font-semibold">
							{t("tone_analyzing")}
						</Text>
						<Text
							variant="body-sm"
							className="text-m3-on-surface-variant max-w-md"
						>
							{language === "vi"
								? "Đang phân tích cấu trúc phổ hòa âm và tần số các nốt nhạc..."
								: "Analyzing harmonic energy spectrum and chroma note frequencies..."}
						</Text>
					</Card>
				)}

				{result && (
					<div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
						{/* Split Key Result Layout */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Core Key Panel */}
							<Card
								variant="filled"
								className="p-4 sm:p-6 bg-m3-primary-container/25 border border-m3-primary/30 rounded-2xl flex flex-col items-center justify-center text-center gap-2"
							>
								<Text
									variant="body-sm"
									className="text-m3-on-surface-variant uppercase tracking-wider font-semibold text-xs"
								>
									{t("tone_result_label")}
								</Text>
								<Text
									variant="display-md"
									className="font-extrabold text-m3-primary mt-1 text-3xl sm:text-5xl md:text-6xl font-mono"
								>
									{result.keyName}
								</Text>
								<div className="flex flex-wrap items-center justify-center gap-2 mt-2">
									<Chip
										variant="filter"
										selected
										leadingIcon={<Icon name="stars" size={16} />}
										label={`${t("tone_camelot")}: ${result.camelot}`}
										className="font-bold text-xs"
									/>
									<Chip
										variant="assist"
										elevated
										leadingIcon={
											<Icon
												name={result.confidence > 75 ? "verified" : "speed"}
												size={16}
											/>
										}
										label={`${language === "vi" ? "Độ tin cậy" : "Confidence"}: ${result.confidence}%`}
										className="font-semibold text-xs"
									/>
								</div>
							</Card>

							{/* Harmonic Compatible Suggestions */}
							<Card
								variant="filled"
								className="p-4 sm:p-5 bg-m3-surface-container-high rounded-2xl flex flex-col gap-3 border border-m3-outline-variant/30"
							>
								<Text
									variant="title-sm"
									className="font-semibold text-m3-on-surface"
								>
									{t("tone_harmonic_title")}
								</Text>
								<div className="flex flex-col gap-2">
									{getHarmonicMatches(result.camelot).map((match) => (
										<Card
											key={match.key}
											variant="outlined"
											className="flex items-center justify-between p-2.5 sm:p-3 bg-m3-surface-container-lowest/80 border-m3-outline-variant/40 rounded-xl gap-2"
										>
											<div className="flex items-center gap-2 min-w-0 flex-1">
												<Icon
													name="arrow_forward"
													className="text-m3-secondary shrink-0"
													size={16}
												/>
												<Text
													variant="body-md"
													className="text-m3-on-surface-variant text-xs font-medium wrap-break-word whitespace-normal leading-tight"
												>
													{match.relation}
												</Text>
											</div>
											<Chip
												variant="assist"
												label={match.key}
												className="font-mono font-bold text-xs h-7 shrink-0"
											/>
										</Card>
									))}
								</div>
							</Card>
						</div>

						<Divider shape="wavy" />

						{/* Chroma Profiler Graph */}
						<div className="flex flex-col gap-3">
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("tone_chroma_title")}
							</Text>

							<div className="w-full">
								<div className="grid grid-cols-12 gap-1 sm:gap-2 w-full">
									{result.chroma.map((energy, idx) => {
										const isDetectedNote = result.keyName.startsWith(
											NOTE_LABELS[idx],
										);
										return (
											<Card
												key={NOTE_LABELS[idx]}
												variant={isDetectedNote ? "filled" : "outlined"}
												className={`min-w-0 px-0.5 py-1.5 sm:p-2 rounded-lg sm:rounded-xl flex flex-col items-center gap-1 sm:gap-2 justify-end min-h-20 sm:min-h-22.5 transition-all ${
													isDetectedNote
														? "bg-m3-primary-container/40 border-2 border-m3-primary text-m3-primary shadow-sm"
														: "bg-m3-surface-container-low border-m3-outline-variant/40 text-m3-on-surface-variant"
												}`}
											>
												{/* Height-based energy bar */}
												<div className="w-full bg-m3-surface-container-highest rounded-md h-7.5 sm:h-10 flex items-end overflow-hidden">
													<div
														className={`w-full rounded-t-sm transition-all duration-500 ${
															isDetectedNote
																? "bg-m3-primary"
																: "bg-m3-outline-variant"
														}`}
														style={{ height: `${Math.max(6, energy * 100)}%` }}
													/>
												</div>
												<div className="text-center min-w-0">
													<Text
														variant="label-md"
														className={`font-bold text-[10px] sm:text-xs leading-none ${
															isDetectedNote
																? "text-m3-primary"
																: "text-m3-on-surface"
														}`}
													>
														{NOTE_LABELS[idx]}
													</Text>
													<Text
														variant="label-sm"
														className={`text-[8px] sm:text-[9px] block font-mono mt-0.5 ${
															isDetectedNote
																? "text-m3-primary font-bold"
																: "text-m3-on-surface-variant"
														}`}
													>
														{(energy * 10).toFixed(1)}
													</Text>
												</div>
											</Card>
										);
									})}
								</div>
							</div>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant text-center mt-1 wrap-break-word whitespace-normal"
							>
								{language === "vi"
									? "Các nốt có mức năng lượng cao nhất quyết định cấu trúc giọng và thang âm của toàn bài hát."
									: "Notes with the highest harmonic energy determine the song's root key and tonality."}
							</Text>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
