import {
	Button,
	Card,
	Icon,
	IconButton,
	LoadingIndicator,
	ShapeIcon,
	Text,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
	AUDIO_ACCEPT_STRING,
	GLOBAL_AUDIO_FORMATS,
} from "../../utils/audioFormats";
import { LosslessResultCard } from "./LosslessResultCard";
import { SpectrogramSection } from "./SpectrogramSection";
import { useLosslessAnalysis } from "./useLosslessAnalysis";

export function LosslessChecker() {
	const { t, language } = useLanguage();
	const [showInfo, setShowInfo] = useState(false);

	const {
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
	} = useLosslessAnalysis();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		if (!selected) return;
		await analyzeFile(selected);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const dropped = e.dataTransfer.files?.[0];
		if (!dropped) return;
		await analyzeFile(dropped);
	};

	return (
		<div className="flex flex-col gap-6 overflow-hidden" id="lossless-tab">
			<Card
				variant="filled"
				className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest"
			>
				{/* Header Bar */}
				<div className="flex items-start justify-between gap-2 min-w-0">
					<div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
						<ShapeIcon
							className="bg-m3-primary"
							shape="circle"
							morphTo="clamshell"
							aria-label="Shield check"
						>
							<Icon name="verified_user" className="text-m3-on-primary" />
						</ShapeIcon>
						<div>
							<Text
								variant="title-md"
								className="font-semibold text-m3-on-surface"
							>
								{t("lossless_title")}
							</Text>
							<Text variant="body-sm" className="text-m3-on-surface-variant">
								{t("lossless_desc")}
							</Text>
						</div>
					</div>

					<IconButton
						colorStyle={showInfo ? "filled" : "standard"}
						variant="toggle"
						selected={showInfo}
						aria-label="Help"
						onClick={() => setShowInfo(!showInfo)}
					>
						<Icon name="help" />
					</IconButton>
				</div>

				{/* Informative Help Card */}
				{showInfo && (
					<Card
						variant="filled"
						className="bg-m3-primary-container/30 p-4 rounded-xl flex flex-col gap-2"
					>
						<Text
							variant="body-md"
							className="font-semibold text-m3-on-primary-container"
						>
							{t("lossless_help_title")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("lossless_help_p1")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("lossless_help_p2")}
						</Text>
					</Card>
				)}

				{/* Error Notification */}
				{error && (
					<Card
						variant="filled"
						className="flex items-center justify-between p-4 bg-m3-error-container text-m3-on-error-container border border-m3-error/30 rounded-xl animate-in fade-in duration-200"
					>
						<div className="flex items-center gap-2.5">
							<Icon name="error" className="text-m3-error shrink-0" />
							<Text
								variant="body-sm"
								className="text-m3-on-error-container font-medium"
							>
								{error}
							</Text>
						</div>
						<IconButton
							colorStyle="standard"
							onClick={() => setError(null)}
							aria-label="Close error"
						>
							<Icon
								name="close"
								size={18}
								className="text-m3-on-error-container"
							/>
						</IconButton>
					</Card>
				)}

				{/* Upload Dropzone */}
				{!file ? (
					// biome-ignore lint/a11y/useSemanticElements: dropzone contains format badges and buttons
					<div
						role="button"
						tabIndex={0}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						className="border-2 border-dashed border-m3-outline-variant/60 rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-m3-surface-container-low transition-colors text-center bg-m3-surface-container-lowest/40"
						onClick={() => document.getElementById("lossless-upload")?.click()}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								document.getElementById("lossless-upload")?.click();
							}
						}}
					>
						<div className="w-16 h-16 rounded-full bg-m3-primary-container/40 flex items-center justify-center text-m3-primary">
							<Icon name="find_in_page" size={36} />
						</div>
						<div className="flex flex-col gap-1 max-w-lg">
							<Text
								variant="title-md"
								className="font-semibold text-m3-on-surface"
							>
								{t("lossless_drop_title")}
							</Text>
							<Text variant="body-sm" className="text-m3-on-surface-variant">
								{t("lossless_drop_desc")}
							</Text>
						</div>

						{/* Global format badges */}
						<div className="flex flex-wrap gap-1.5 justify-center max-w-xl mt-1">
							{GLOBAL_AUDIO_FORMATS.map((fmt) => (
								<span
									key={fmt.extension}
									className={`text-xs px-2.5 py-1 rounded-full font-mono border transition-all ${
										fmt.isLossless
											? "bg-m3-primary-container/50 text-m3-primary border-m3-primary/30 font-semibold"
											: "bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/40"
									}`}
									title={`${fmt.name}: ${fmt.description}`}
								>
									.{fmt.extension.toUpperCase()}
									{fmt.isLossless && " ★"}
								</span>
							))}
						</div>

						<Button
							colorStyle="tonal"
							icon={<Icon name="upload_file" size={18} />}
							className="mt-2"
							onClick={(e) => {
								e.stopPropagation();
								document.getElementById("lossless-upload")?.click();
							}}
						>
							{language === "vi" ? "Chọn tệp âm thanh" : "Select Audio File"}
						</Button>

						<input
							id="lossless-upload"
							type="file"
							accept={AUDIO_ACCEPT_STRING}
							className="hidden"
							onChange={handleFileChange}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{/* File info bar with format badge */}
						<Card
							variant="filled"
							className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-m3-surface-container-low rounded-xl min-w-0 border border-m3-outline-variant/40"
						>
							<div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
								<div className="w-10 h-10 rounded-xl bg-m3-primary-container flex items-center justify-center text-m3-on-primary-container shrink-0">
									<Icon name="analytics" />
								</div>
								<div className="overflow-hidden min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<Text
											variant="body-md"
											className="font-semibold text-m3-on-surface truncate"
										>
											{file.name}
										</Text>
										{detectedFormat && (
											<span
												className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium shrink-0 border ${
													(detectedFormat.isLossless ??
													(detectedFormat.category === "lossless" ||
														detectedFormat.category === "hi-res"))
														? "bg-m3-primary-container/50 text-m3-primary border-m3-primary/30"
														: "bg-m3-secondary-container/50 text-m3-secondary border-m3-secondary/30"
												}`}
											>
												{detectedFormat.name}
											</span>
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
								className="shrink-0"
								icon={<Icon name="refresh" size={16} />}
								onClick={resetAll}
								disabled={isLoading}
							>
								{t("lossless_check_another")}
							</Button>
						</Card>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<Card
						variant="outlined"
						className="flex flex-col items-center justify-center gap-3.5 p-8 sm:p-10 bg-m3-surface-container-low/40 rounded-2xl border-m3-outline-variant/30 text-center animate-in fade-in"
					>
						<LoadingIndicator
							aria-label="Analyzing spectral cutoff"
							size={48}
						/>
						<Text variant="title-sm" className="text-m3-primary font-semibold">
							{t("lossless_analyzing")}
						</Text>
						<div className="w-full max-w-xs bg-m3-surface-container-highest rounded-full h-2 overflow-hidden border border-m3-outline-variant/30 mt-1">
							<div
								className="bg-m3-primary h-full transition-all duration-300 rounded-full"
								style={{ width: `${Math.max(5, analysisProgress)}%` }}
							/>
						</div>
						<Text
							variant="body-sm"
							className="text-m3-on-surface-variant font-mono text-xs"
						>
							{analysisProgress}% •{" "}
							{language === "vi"
								? "Web Worker đang quét 120 khung phổ FFT 8192 điểm..."
								: "Web Worker scanning 120 FFT 8192 spectral frames..."}
						</Text>
					</Card>
				)}

				{/* Analysis Results & Visualizers */}
				{result && (
					<div className="flex flex-col gap-5">
						<LosslessResultCard result={result} />
						<SpectrogramSection
							result={result}
							decodedBuffer={decodedBuffer}
							isPlaying={isPlaying}
							playbackTime={playbackTime}
							analyserNode={analyserNode}
							togglePlayback={togglePlayback}
							stopPlayback={stopPlayback}
							setPlaybackTime={setPlaybackTime}
						/>
					</div>
				)}
			</Card>
		</div>
	);
}
