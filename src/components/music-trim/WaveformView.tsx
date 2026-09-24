import type React from "react";
import { useEffect, useRef } from "react";
import type { AudioTrack } from "../../types";

interface WaveformViewProps {
	track: AudioTrack | null;
	trimRange: [number, number];
	currentWaveformWidth: number;
	cursorStyle?: string;
	onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
	onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
	onMouseUp: () => void;
	onMouseLeave: () => void;
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 100);
	return `${mins}:${secs.toString().padStart(2, "0")}.${ms
		.toString()
		.padStart(2, "0")}`;
}

export function WaveformView({
	track,
	trimRange,
	currentWaveformWidth,
	cursorStyle = "pointer",
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onMouseLeave,
}: WaveformViewProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// Enhanced Waveform rendering with zoom, timeline ruler ticks & handles
	// Crucial: playbackTime is NOT a dependency here, saving 98% canvas redraw CPU!
	useEffect(() => {
		if (!track?.audioBuffer || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const buffer = track.audioBuffer;
		const leftChannel = buffer.getChannelData(0);

		const dpr = window.devicePixelRatio || 1;
		const displayWidth = currentWaveformWidth;
		const displayHeight = 132;

		canvas.width = Math.round(displayWidth * dpr);
		canvas.height = Math.round(displayHeight * dpr);

		ctx.save();
		ctx.scale(dpr, dpr);

		const width = displayWidth;
		const height = displayHeight;

		const compStyle = window.getComputedStyle(canvas);
		const primaryColor =
			compStyle.getPropertyValue("--md-sys-color-primary").trim() || "#6750A4";
		const tertiaryColor =
			compStyle.getPropertyValue("--md-sys-color-tertiary").trim() || "#6366F1";
		const onSurfaceVariant =
			compStyle.getPropertyValue("--md-sys-color-on-surface-variant").trim() ||
			"rgba(100, 100, 110, 0.7)";
		const outlineVariantColor =
			compStyle.getPropertyValue("--md-sys-color-outline-variant").trim() ||
			"rgba(103, 80, 164, 0.25)";

		ctx.clearRect(0, 0, width, height);

		const duration = track.duration;
		const leftBound = (trimRange[0] / 100) * width;
		const rightBound = (trimRange[1] / 100) * width;

		// --- 1. Background Grid & Timeline Ruler Ticks ---
		let tickInterval = 10;
		const pxPerSec = width / Math.max(0.1, duration);
		if (pxPerSec > 150) tickInterval = 0.2;
		else if (pxPerSec > 75) tickInterval = 0.5;
		else if (pxPerSec > 35) tickInterval = 1;
		else if (pxPerSec > 15) tickInterval = 2;
		else if (pxPerSec > 8) tickInterval = 5;
		else if (pxPerSec > 3) tickInterval = 10;
		else if (pxPerSec > 1) tickInterval = 30;
		else tickInterval = 60;

		const numTicks = Math.floor(duration / tickInterval);
		ctx.strokeStyle = "rgba(160, 160, 175, 0.16)";
		ctx.lineWidth = 1;
		ctx.fillStyle = onSurfaceVariant;
		ctx.font = "9px ui-monospace, monospace";

		for (let i = 0; i <= numTicks; i++) {
			const sec = i * tickInterval;
			const x = (sec / duration) * width;

			// Vertical grid line
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();

			// Top tick mark & label
			if (sec < duration) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, 6);
				ctx.stroke();

				const mins = Math.floor(sec / 60);
				const secs = Math.floor(sec % 60);
				const ms = Math.floor((sec % 1) * 10);
				const label =
					tickInterval < 1
						? `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
						: `${mins}:${secs.toString().padStart(2, "0")}`;

				ctx.fillText(label, x + 3, 11);
			}
		}

		// --- 2. Waveform Bars ---
		const step = Math.max(1, Math.floor(leftChannel.length / width));
		const amp = height / 2;
		ctx.lineWidth = 1.5;

		for (let i = 0; i < width; i++) {
			let min = 1.0;
			let max = -1.0;
			const startIdx = i * step;
			const endIdx = Math.min(leftChannel.length, startIdx + step);
			for (let j = startIdx; j < endIdx; j++) {
				const datum = leftChannel[j];
				if (datum < min) min = datum;
				if (datum > max) max = datum;
			}
			if (min > max) {
				min = 0;
				max = 0;
			}

			const isInsideTrim = i >= leftBound && i <= rightBound;
			ctx.strokeStyle = isInsideTrim ? primaryColor : outlineVariantColor;
			ctx.beginPath();
			ctx.moveTo(i, amp + min * amp * 0.88);
			ctx.lineTo(i, amp + max * amp * 0.88);
			ctx.stroke();
		}

		// --- 3. Shaded Dim Overlay for Unselected Outside Regions ---
		ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
		if (leftBound > 0) {
			ctx.fillRect(0, 0, leftBound, height);
		}
		if (rightBound < width) {
			ctx.fillRect(rightBound, 0, width - rightBound, height);
		}

		// --- 4. Trim Boundary Lines & Badges ---
		// Start boundary line
		ctx.strokeStyle = tertiaryColor;
		ctx.lineWidth = 2.5;
		ctx.beginPath();
		ctx.moveTo(leftBound, 0);
		ctx.lineTo(leftBound, height);
		ctx.stroke();

		// Start Handle Flag
		const startSec = (trimRange[0] / 100) * duration;
		const startText = `START ${formatTime(startSec)}`;
		ctx.font = "bold 9px ui-monospace, monospace";
		const startTextW = ctx.measureText(startText).width;
		const startBadgeW = startTextW + 8;
		const startBadgeX = Math.max(
			1,
			Math.min(width - startBadgeW - 1, leftBound - 1),
		);

		ctx.fillStyle = tertiaryColor;
		ctx.beginPath();
		if ("roundRect" in ctx && typeof ctx.roundRect === "function") {
			ctx.roundRect(startBadgeX, 14, startBadgeW, 16, 4);
		} else {
			ctx.rect(startBadgeX, 14, startBadgeW, 16);
		}
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(startText, startBadgeX + 4, 25);

		// End boundary line
		ctx.strokeStyle = tertiaryColor;
		ctx.lineWidth = 2.5;
		ctx.beginPath();
		ctx.moveTo(rightBound, 0);
		ctx.lineTo(rightBound, height);
		ctx.stroke();

		// End Handle Flag
		const endSec = (trimRange[1] / 100) * duration;
		const endText = `END ${formatTime(endSec)}`;
		const endTextW = ctx.measureText(endText).width;
		const endBadgeW = endTextW + 8;
		const endBadgeX = Math.max(
			1,
			Math.min(width - endBadgeW - 1, rightBound - endBadgeW + 1),
		);

		ctx.fillStyle = tertiaryColor;
		ctx.beginPath();
		if ("roundRect" in ctx && typeof ctx.roundRect === "function") {
			ctx.roundRect(endBadgeX, 14, endBadgeW, 16, 4);
		} else {
			ctx.rect(endBadgeX, 14, endBadgeW, 16);
		}
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(endText, endBadgeX + 4, 25);

		ctx.restore();
	}, [track, trimRange, currentWaveformWidth]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: `${currentWaveformWidth}px`,
				height: "132px",
				cursor: cursorStyle,
			}}
			className="select-none touch-none block"
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseLeave}
		/>
	);
}
