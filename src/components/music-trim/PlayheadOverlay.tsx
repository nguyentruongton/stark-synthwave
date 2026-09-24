interface PlayheadOverlayProps {
	playbackTime: number;
	duration: number;
	width: number;
	height?: number;
}

export function PlayheadOverlay({
	playbackTime,
	duration,
	width,
	height = 132,
}: PlayheadOverlayProps) {
	if (duration <= 0 || width <= 0) return null;

	const playX = Math.max(0, Math.min(width, (playbackTime / duration) * width));

	return (
		<div
			className="absolute inset-0 pointer-events-none overflow-hidden"
			style={{ width, height }}
		>
			<div
				className="absolute top-0 bottom-0 will-change-transform z-10 flex flex-col items-center"
				style={{
					left: 0,
					transform: `translate3d(${playX}px, 0, 0)`,
				}}
			>
				{/* Top triangle needle */}
				<div
					className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-red-500 -ml-1.25 shrink-0 drop-shadow-xs"
					style={{ borderTopColor: "var(--md-sys-color-error, #EF4444)" }}
				/>
				{/* Vertical playhead line */}
				<div
					className="w-0.5 flex-1 bg-red-500 shadow-sm"
					style={{ backgroundColor: "var(--md-sys-color-error, #EF4444)" }}
				/>
				{/* Bottom triangle needle */}
				<div
					className="w-0 h-0 border-x-[5px] border-x-transparent border-b-[7px] border-b-red-500 -ml-1.25 shrink-0 drop-shadow-xs"
					style={{ borderBottomColor: "var(--md-sys-color-error, #EF4444)" }}
				/>
			</div>
		</div>
	);
}
