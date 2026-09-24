import { Button, Card, Icon, Text, useTheme } from "@bug-on/m3-expressive";
import { useEffect, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { QualityResult } from "../../types";
import { FrequencyVisualizer } from "../FrequencyVisualizer";
import { SpectrogramCanvas } from "../SpectrogramCanvas";

function colorWithAlpha(
	color: string,
	alpha: number,
	fallback: string,
): string {
	if (color.startsWith("#")) {
		const cleanHex = color.replace("#", "").trim();
		if (cleanHex.length === 6) {
			const r = parseInt(cleanHex.substring(0, 2), 16);
			const g = parseInt(cleanHex.substring(2, 4), 16);
			const b = parseInt(cleanHex.substring(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		} else if (cleanHex.length === 3) {
			const r = parseInt(cleanHex[0] + cleanHex[0], 16);
			const g = parseInt(cleanHex[1] + cleanHex[1], 16);
			const b = parseInt(cleanHex[2] + cleanHex[2], 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}
	}
	if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
		const parts = color.match(/\d+/g);
		if (parts && parts.length >= 3) {
			return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
		}
	}
	return fallback;
}

interface SpectrogramSectionProps {
	result: QualityResult;
	decodedBuffer: AudioBuffer | null;
	isPlaying: boolean;
	playbackTime: number;
	analyserNode: AnalyserNode | null;
	togglePlayback: () => void;
	stopPlayback: () => void;
	setPlaybackTime: (time: number) => void;
}

export function SpectrogramSection({
	result,
	decodedBuffer,
	isPlaying,
	playbackTime,
	analyserNode,
	togglePlayback,
	stopPlayback,
	setPlaybackTime,
}: SpectrogramSectionProps) {
	const { t, language } = useLanguage();
	const { effectiveMode } = useTheme();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		if (!result || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		// Theme-adaptive canvas colors computed dynamically from active M3 tokens
		const isDark = effectiveMode === "dark";
		const compStyle = window.getComputedStyle(canvas);
		const primaryColor =
			compStyle.getPropertyValue("--md-sys-color-primary").trim() ||
			(isDark ? "#D0BCFF" : "#6750A4");
		const tertiaryColor =
			compStyle.getPropertyValue("--md-sys-color-tertiary").trim() ||
			(isDark ? "#EFB8C8" : "#7D5260");
		const errorColor =
			compStyle.getPropertyValue("--md-sys-color-error").trim() ||
			(isDark ? "#F2B8B5" : "#B3261E");
		const onSurfaceVariant =
			compStyle.getPropertyValue("--md-sys-color-on-surface-variant").trim() ||
			(isDark ? "#CAC4D0" : "#49454F");
		const outlineVariant =
			compStyle.getPropertyValue("--md-sys-color-outline-variant").trim() ||
			(isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)");

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = isDark
			? "rgba(255, 255, 255, 0.015)"
			: "rgba(0, 0, 0, 0.02)";
		ctx.fillRect(0, 0, width, height);

		ctx.strokeStyle = outlineVariant;
		ctx.lineWidth = 1;

		// Vertical grid lines (4k, 8k, 12k, 16k, 20k Hz)
		const gridFreqs = [4000, 8000, 12000, 16000, 20000];
		ctx.fillStyle = onSurfaceVariant;
		ctx.font = "10px monospace";
		ctx.textAlign = "center";

		for (const f of gridFreqs) {
			const x = (f / 22050) * width;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height - 15);
			ctx.stroke();
			ctx.fillText(`${f / 1000}kHz`, x, height - 3);
		}

		const gridDB = [-20, -40, -60, -80];
		ctx.textAlign = "left";
		for (const db of gridDB) {
			const y = (db / -100) * (height - 20);
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
			ctx.fillText(`${db}dB`, 5, y - 2);
		}

		// 1. Peak-Hold Spectrum Curve (Dashed line)
		if (result.peakSpectrumData && result.peakSpectrumData.length > 0) {
			ctx.save();
			ctx.strokeStyle = isDark ? "#00F5FF" : "#0097A7";
			ctx.lineWidth = 1.5;
			ctx.setLineDash([4, 3]);
			ctx.beginPath();
			result.peakSpectrumData.forEach((pt, idx) => {
				const x = (pt.frequency / 22050) * width;
				const y = (pt.power / -100) * (height - 20);
				if (idx === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
			ctx.stroke();
			ctx.restore();
		}

		// 2. Average Spectrum Curve (Solid line with area gradient)
		const points = result.spectrumData;
		const curveColor = result.isRealLossless
			? primaryColor
			: result.score > 60
				? tertiaryColor
				: errorColor;

		ctx.strokeStyle = curveColor;
		ctx.lineWidth = 2.5;
		ctx.beginPath();

		points.forEach((pt, idx) => {
			const x = (pt.frequency / 22050) * width;
			const y = (pt.power / -100) * (height - 20);

			if (idx === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});
		ctx.stroke();

		// Fill area under average spectrum with smooth dynamic M3 alpha gradient
		ctx.lineTo(width, height - 20);
		ctx.lineTo(0, height - 20);
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		const startAlphaColor = colorWithAlpha(
			curveColor,
			0.25,
			isDark ? "rgba(208, 188, 255, 0.25)" : "rgba(103, 80, 164, 0.25)",
		);
		const endAlphaColor = colorWithAlpha(curveColor, 0, "rgba(0, 0, 0, 0)");
		gradient.addColorStop(0, startAlphaColor);
		gradient.addColorStop(1, endAlphaColor);
		ctx.fillStyle = gradient;
		ctx.fill();

		// 3. Cutoff frequency marker
		const cutoffX = (result.cutoffFrequency / 22050) * width;
		ctx.strokeStyle = tertiaryColor;
		ctx.setLineDash([5, 4]);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cutoffX, 0);
		ctx.lineTo(cutoffX, height - 20);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.fillStyle = tertiaryColor;
		ctx.font = "bold 9px sans-serif";
		ctx.textAlign = cutoffX > width * 0.7 ? "right" : "left";
		const textX = cutoffX > width * 0.7 ? cutoffX - 5 : cutoffX + 5;
		ctx.fillText(
			`${language === "vi" ? "Giới hạn tần số" : "Cutoff shelf"}: ${(result.cutoffFrequency / 1000).toFixed(1)}kHz`,
			textX,
			20,
		);
	}, [result, effectiveMode, language]);

	return (
		<div className="flex flex-col gap-5">
			{/* Live Audio Preview & Real-Time Frequency Analysis */}
			{decodedBuffer && (
				<div className="flex flex-col gap-2.5">
					<div className="flex items-center justify-between gap-2 flex-wrap">
						<div className="flex items-center gap-2">
							<Icon name="hearing" className="text-m3-primary" size={20} />
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{language === "vi"
									? "Nghe thử & Kiểm tra phổ tần số trực tiếp"
									: "Live Audio Preview & Frequency Analysis"}
							</Text>
						</div>
						<div className="flex items-center gap-2">
							<Button
								size="xs"
								colorStyle="tonal"
								onClick={togglePlayback}
								icon={
									<Icon name={isPlaying ? "pause" : "play_arrow"} size={16} />
								}
							>
								{isPlaying
									? language === "vi"
										? "Tạm dừng"
										: "Pause"
									: language === "vi"
										? "Nghe thử tệp"
										: "Play Preview"}
							</Button>
							{playbackTime > 0 && (
								<Button
									size="xs"
									colorStyle="text"
									onClick={() => {
										stopPlayback();
										setPlaybackTime(0);
									}}
									icon={<Icon name="replay" size={16} />}
								>
									{language === "vi" ? "Đầu bài" : "Restart"}
								</Button>
							)}
						</div>
					</div>

					<FrequencyVisualizer
						analyserNode={analyserNode}
						isPlaying={isPlaying}
						height={115}
					/>
				</div>
			)}

			{/* 1D Canvas Spectrum Plot (Peak-Hold + Average FFT) */}
			<div className="flex flex-col gap-2.5">
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<Icon name="query_stats" className="text-m3-primary" size={20} />
						<Text
							variant="title-sm"
							className="font-semibold text-m3-on-surface"
						>
							{t("lossless_spectrum_chart")}
						</Text>
					</div>
					<div className="flex items-center gap-4 text-xs font-mono text-m3-on-surface-variant">
						<div className="flex items-center gap-1.5">
							<span className="w-3 h-0.5 border-t border-dashed border-[#00F5FF] inline-block" />
							<span>Peak-Hold</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="w-3 h-0.5 bg-m3-primary inline-block" />
							<span>Average</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="w-3 h-0.5 border-t-2 border-dashed border-m3-tertiary inline-block" />
							<span>Cutoff Shelf</span>
						</div>
					</div>
				</div>
				<Card
					variant="outlined"
					className="bg-m3-surface-container-lowest rounded-2xl p-4 border border-m3-outline-variant overflow-hidden"
				>
					<canvas
						ref={canvasRef}
						width={600}
						height={220}
						className="w-full h-55 block"
					/>
				</Card>
				<div className="flex flex-wrap justify-between items-center text-xs text-m3-on-surface-variant px-1 font-mono gap-y-1">
					<span>0 Hz</span>
					<span>
						{language === "vi" ? "Tần số kiểm tra" : "Tested Spectrum"}
					</span>
					<span>22050 Hz (Nyquist)</span>
				</div>
			</div>

			{/* 2D Spectrogram Heatmap */}
			{result.spectrogramFrames && result.spectrogramFrames.length > 0 && (
				<SpectrogramCanvas
					frames={result.spectrogramFrames}
					cutoffFrequency={result.cutoffFrequency}
					sampleRate={result.detectedSampleRate}
					duration={decodedBuffer?.duration || 0}
					isRealLossless={result.isRealLossless}
				/>
			)}
		</div>
	);
}
