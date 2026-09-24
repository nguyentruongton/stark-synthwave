import { Card, Icon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { SpectrogramFrame } from "../types";

interface SpectrogramCanvasProps {
	frames: SpectrogramFrame[];
	cutoffFrequency: number;
	sampleRate: number;
	duration: number;
	isRealLossless: boolean;
	className?: string;
}

/** Precomputed 256-step RGB colormap (Synthwave Cosmic Spectrum: Dark Violet -> Indigo -> Magenta -> Neon Pink -> Gold -> White) */
const COLORMAP_RGB: [number, number, number][] = (() => {
	const stops = [
		{ db: -100, r: 13, g: 4, b: 28 }, // #0D041C (Deep cosmic void)
		{ db: -80, r: 35, g: 16, b: 82 }, // #231052 (Deep indigo)
		{ db: -60, r: 90, g: 24, b: 154 }, // #5A189A (Royal violet)
		{ db: -40, r: 179, g: 66, b: 255 }, // #B342FF (Electric magenta)
		{ db: -20, r: 255, g: 66, b: 127 }, // #FF427F (Neon pink)
		{ db: -8, r: 255, g: 209, b: 90 }, // #FFD15A (Sunset gold)
		{ db: 0, r: 255, g: 255, b: 255 }, // #FFFFFF (Peak white)
	];

	const table: [number, number, number][] = [];
	for (let i = 0; i <= 255; i++) {
		const db = -100 + (i / 255) * 100;
		// Find matching range in stops
		let sIdx = 0;
		while (sIdx < stops.length - 1 && stops[sIdx + 1].db < db) {
			sIdx++;
		}
		const s1 = stops[sIdx];
		const s2 = stops[Math.min(stops.length - 1, sIdx + 1)];
		const range = s2.db - s1.db || 1;
		const t = Math.max(0, Math.min(1, (db - s1.db) / range));

		const r = Math.round(s1.r + t * (s2.r - s1.r));
		const g = Math.round(s1.g + t * (s2.g - s1.g));
		const b = Math.round(s1.b + t * (s2.b - s1.b));
		table.push([r, g, b]);
	}
	return table;
})();

function dbToRgb(db: number): [number, number, number] {
	const clamped = Math.max(-100, Math.min(0, db));
	const idx = Math.round(((clamped + 100) / 100) * 255);
	return COLORMAP_RGB[Math.max(0, Math.min(255, idx))];
}

export function SpectrogramCanvas({
	frames,
	cutoffFrequency,
	sampleRate,
	duration,
	isRealLossless,
	className = "",
}: SpectrogramCanvasProps) {
	const { language } = useLanguage();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [hoverInfo, setHoverInfo] = useState<{
		timeSec: number;
		freqHz: number;
		powerDb: number;
		x: number;
		y: number;
	} | null>(null);

	// Nyquist frequency capped at 24kHz for display
	const maxDisplayFreq = Math.min(sampleRate / 2, 24000);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !frames || frames.length === 0) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		const numCols = frames.length;
		const numBins = frames[0].bins.length; // 256 bins

		// Create an OffscreenCanvas or imageData for raw pixel rendering
		const imgData = ctx.createImageData(width, height);
		const data = imgData.data;

		// Precompute frequency bin index for each Y coordinate (cuts 120k computations to 200)
		const binIndices = new Int32Array(height);
		for (let y = 0; y < height; y++) {
			const freqRatio = 1 - y / height;
			binIndices[y] = Math.min(
				numBins - 1,
				Math.max(0, Math.floor(freqRatio * numBins)),
			);
		}

		// Precompute frame index for each X coordinate
		const frameIndices = new Int32Array(width);
		for (let x = 0; x < width; x++) {
			frameIndices[x] = Math.min(
				numCols - 1,
				Math.floor((x / width) * numCols),
			);
		}

		// Sequential row-major iteration for optimal CPU cache utilization
		let pixelIdx = 0;
		for (let y = 0; y < height; y++) {
			const binIdx = binIndices[y];
			for (let x = 0; x < width; x++) {
				const frameIdx = frameIndices[x];
				const db = frames[frameIdx].bins[binIdx] ?? -100;
				const [r, g, b] = dbToRgb(db);

				data[pixelIdx] = r;
				data[pixelIdx + 1] = g;
				data[pixelIdx + 2] = b;
				data[pixelIdx + 3] = 255;
				pixelIdx += 4;
			}
		}

		ctx.putImageData(imgData, 0, 0);

		// Overlay Cutoff Frequency Line
		if (cutoffFrequency > 0 && cutoffFrequency <= maxDisplayFreq) {
			const cutoffY = Math.round(
				(1 - cutoffFrequency / maxDisplayFreq) * height,
			);

			ctx.save();
			ctx.strokeStyle = isRealLossless ? "#00F5FF" : "#FF427F";
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 4]);
			ctx.beginPath();
			ctx.moveTo(0, cutoffY);
			ctx.lineTo(width, cutoffY);
			ctx.stroke();
			ctx.restore();

			// Shelf badge label on the canvas
			ctx.save();
			const shelfText = `${language === "vi" ? "Đường giới hạn" : "Cut-off"}: ${(cutoffFrequency / 1000).toFixed(1)} kHz`;
			ctx.font = "bold 10px monospace";
			const textWidth = ctx.measureText(shelfText).width;
			const badgeX = Math.max(10, width - textWidth - 20);
			const badgeY = Math.max(14, cutoffY - 6);

			ctx.fillStyle = "rgba(18, 6, 44, 0.85)";
			ctx.strokeStyle = isRealLossless ? "#00F5FF" : "#FF427F";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(badgeX - 4, badgeY - 11, textWidth + 8, 16, 4);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = isRealLossless ? "#00F5FF" : "#FF427F";
			ctx.fillText(shelfText, badgeX, badgeY);
			ctx.restore();
		}

		// Frequency grid lines (4k, 8k, 12k, 16k, 20k)
		const gridFreqs = [4000, 8000, 12000, 16000, 20000];
		ctx.save();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
		ctx.setLineDash([2, 4]);
		ctx.lineWidth = 1;
		ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		ctx.font = "9px monospace";

		for (const freq of gridFreqs) {
			if (freq < maxDisplayFreq) {
				const y = Math.round((1 - freq / maxDisplayFreq) * height);
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
				ctx.fillText(`${freq / 1000}k`, 6, y - 2);
			}
		}
		ctx.restore();
	}, [frames, cutoffFrequency, maxDisplayFreq, isRealLossless, language]);

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas || !frames || frames.length === 0) return;

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;

		const canvasX = clientX * scaleX;
		const canvasY = clientY * scaleY;

		const timeRatio = Math.max(0, Math.min(1, canvasX / canvas.width));
		const freqRatio = Math.max(0, Math.min(1, 1 - canvasY / canvas.height));

		const timeSec = timeRatio * (duration || 1);
		const freqHz = freqRatio * maxDisplayFreq;

		const frameIdx = Math.min(
			frames.length - 1,
			Math.floor(timeRatio * frames.length),
		);
		const binIdx = Math.min(
			frames[0].bins.length - 1,
			Math.floor(freqRatio * frames[0].bins.length),
		);
		const powerDb = frames[frameIdx]?.bins[binIdx] ?? -100;

		setHoverInfo({
			timeSec,
			freqHz,
			powerDb: Math.round(powerDb),
			x: clientX,
			y: clientY,
		});
	};

	const formatTime = (sec: number) => {
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		const ms = Math.floor((sec % 1) * 10);
		return `${m}:${s < 10 ? "0" : ""}${s}.${ms}`;
	};

	return (
		<div className={`flex flex-col gap-2 ${className}`}>
			<div className="flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-2">
					<Icon name="grid_view" className="text-m3-primary" size={20} />
					<Text variant="title-sm" className="font-semibold text-m3-on-surface">
						{language === "vi"
							? "Bản đồ phổ 2D theo thời gian (Time × Frequency Spectrogram)"
							: "2D Time-Frequency Spectrogram Heatmap"}
					</Text>
				</div>
				<div className="flex items-center gap-3 text-xs text-m3-on-surface-variant font-mono">
					<div className="flex items-center gap-1.5">
						<span
							className="w-2.5 h-2.5 rounded-full inline-block"
							style={{
								backgroundColor: isRealLossless ? "#00F5FF" : "#FF427F",
							}}
						/>
						<span>
							{isRealLossless
								? language === "vi"
									? "Phổ đầy đủ liên tục"
									: "Continuous Spectrum"
								: language === "vi"
									? "Vùng cắt cụt phát hiện"
									: "Dead HF Zone"}
						</span>
					</div>
				</div>
			</div>

			<Card
				variant="outlined"
				className="relative bg-[#0A0B0D] rounded-2xl p-2.5 border border-m3-outline-variant/60 overflow-hidden select-none"
			>
				{/* Canvas */}
				<canvas
					ref={canvasRef}
					width={720}
					height={220}
					className="w-full h-52 block cursor-crosshair rounded-xl"
					onMouseMove={handleMouseMove}
					onMouseLeave={() => setHoverInfo(null)}
				/>

				{/* Floating tooltip on hover */}
				{hoverInfo && (
					<div
						className="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-lg bg-m3-surface-container-highest/95 backdrop-blur-md border border-m3-outline/40 shadow-lg text-[11px] font-mono text-m3-on-surface flex flex-col gap-0.5"
						style={{
							left: Math.min(hoverInfo.x + 12, 500),
							top: Math.max(10, hoverInfo.y - 45),
						}}
					>
						<span className="text-m3-primary font-semibold">
							⏱ {formatTime(hoverInfo.timeSec)}
						</span>
						<span>⚡ {(hoverInfo.freqHz / 1000).toFixed(2)} kHz</span>
						<span
							className={
								hoverInfo.powerDb > -40
									? "text-m3-primary font-bold"
									: hoverInfo.powerDb > -65
										? "text-m3-tertiary"
										: "text-m3-outline"
							}
						>
							📊 {hoverInfo.powerDb} dB
						</span>
					</div>
				)}

				{/* Axis labels & Heatmap Legend */}
				<div className="flex flex-wrap items-center justify-between text-[11px] text-m3-on-surface-variant font-mono mt-2 px-1">
					<span>0:00 (Start)</span>

					{/* Colormap visual gradient bar */}
					<div className="flex items-center gap-1.5">
						<span className="text-[10px] text-m3-outline">-100dB</span>
						<div
							className="w-28 h-2 rounded-full border border-white/20"
							style={{
								background:
									"linear-gradient(to right, #0D041C, #231052, #5A189A, #B342FF, #FF427F, #FFD15A, #FFFFFF)",
							}}
						/>
						<span className="text-[10px] text-m3-primary">0dB</span>
					</div>

					<span>{formatTime(duration)} (End)</span>
				</div>
			</Card>
		</div>
	);
}
