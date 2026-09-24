import {
	Button,
	ButtonGroup,
	Card,
	Icon,
	RangeSlider,
	Text,
} from "@bug-on/m3-expressive";
import { useLanguage } from "../../i18n/LanguageContext";
import type { AudioTrack } from "../../types";

interface TrimControlsProps {
	track: AudioTrack;
	playbackTime: number;
	isPlaying: boolean;
	trimRange: [number, number];
	isMerging: boolean;
	onTogglePlayback: () => void;
	onSeekFromStart: () => void;
	onResetTrim: () => void;
	onQuickExport: () => void;
	onAddToQueue: () => void;
	onTrimRangeChange: (val: [number, number]) => void;
	onAdjustStart: (deltaSec: number) => void;
	onAdjustEnd: (deltaSec: number) => void;
	onSetStartToCurrent: () => void;
	onSetEndToCurrent: () => void;
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 100);
	return `${mins}:${secs.toString().padStart(2, "0")}.${ms
		.toString()
		.padStart(2, "0")}`;
}

export function TrimControls({
	track,
	playbackTime,
	isPlaying,
	trimRange,
	isMerging,
	onTogglePlayback,
	onSeekFromStart,
	onResetTrim,
	onQuickExport,
	onAddToQueue,
	onTrimRangeChange,
	onAdjustStart,
	onAdjustEnd,
	onSetStartToCurrent,
	onSetEndToCurrent,
}: TrimControlsProps) {
	const { t, language } = useLanguage();

	const trimmedStart = (trimRange[0] / 100) * track.duration;
	const trimmedEnd = (trimRange[1] / 100) * track.duration;
	const trimmedLength = Math.max(0, trimmedEnd - trimmedStart);

	return (
		<div className="flex flex-col gap-3">
			{/* Current Listening Position & Quick Marker Placement Tools */}
			<Card
				variant="filled"
				className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40"
			>
				<div className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-lg bg-m3-primary-container flex items-center justify-center text-m3-primary shrink-0">
						<Icon
							name={isPlaying ? "graphic_eq" : "headphones"}
							size={18}
							className={`${isPlaying ? "animate-pulse" : ""} text-m3-on-primary-container`}
						/>
					</div>
					<div>
						<Text
							variant="label-sm"
							className="text-m3-on-surface-variant font-medium leading-none block"
						>
							{language === "vi"
								? "Vị trí con trỏ nghe thử"
								: "Current Playhead"}
						</Text>
						<Text
							variant="label-lg"
							className="font-mono font-bold text-m3-primary mt-0.5 block"
						>
							{formatTime(playbackTime)}
						</Text>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						size="xs"
						colorStyle="tonal"
						onClick={onSetStartToCurrent}
						icon={<Icon name="first_page" size={16} />}
						title={
							language === "vi"
								? "Lấy thời điểm nghe hiện tại làm mốc Bắt đầu cắt"
								: "Set current listening position as Trim Start"
						}
					>
						{language === "vi" ? "Đặt làm Điểm Bắt Đầu" : "Set as Start"}
					</Button>

					<Button
						size="xs"
						colorStyle="tonal"
						onClick={onSetEndToCurrent}
						icon={<Icon name="last_page" size={16} />}
						title={
							language === "vi"
								? "Lấy thời điểm nghe hiện tại làm mốc Kết thúc cắt"
								: "Set current listening position as Trim End"
						}
					>
						{language === "vi" ? "Đặt làm Điểm Kết Thúc" : "Set as End"}
					</Button>
				</div>
			</Card>

			{/* Slider Range Trimming */}
			<div className="px-2 py-1 flex flex-col gap-1">
				<div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-xs text-m3-on-surface-variant font-mono">
					<Text
						variant="label-sm"
						className="font-mono text-m3-on-surface-variant"
					>
						{t("trim_start_time")}: {formatTime(trimmedStart)}
					</Text>
					<Text
						variant="label-sm"
						className="font-mono font-semibold text-m3-primary"
					>
						{t("trim_duration")}: {formatTime(trimmedLength)}
					</Text>
					<Text
						variant="label-sm"
						className="font-mono text-m3-on-surface-variant"
					>
						{t("trim_end_time")}: {formatTime(trimmedEnd)}
					</Text>
				</div>

				<RangeSlider
					value={trimRange}
					onValueChange={onTrimRangeChange}
					min={0}
					max={100}
					className="my-3"
					size="xs"
				/>

				{/* Fine-tuning steppers for Start & End */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
					<Card
						variant="outlined"
						className="flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-container-high/50 border border-m3-outline-variant/30 text-xs"
					>
						<div className="flex flex-col">
							<Text
								variant="label-sm"
								className="text-m3-on-surface-variant font-sans font-medium"
							>
								{t("trim_start_time")}
							</Text>
							<Text
								variant="label-md"
								className="font-bold text-m3-on-surface font-mono"
							>
								{formatTime(trimmedStart)}
							</Text>
						</div>
						<ButtonGroup variant="connected" size="xs">
							<Button colorStyle="outlined" onClick={() => onAdjustStart(-1)}>
								-1s
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustStart(-0.1)}>
								-0.1s
							</Button>
							<Button
								colorStyle="outlined"
								onClick={() => onAdjustStart(-0.01)}
							>
								-10ms
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustStart(0.01)}>
								+10ms
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustStart(0.1)}>
								+0.1s
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustStart(1)}>
								+1s
							</Button>
						</ButtonGroup>
					</Card>

					<Card
						variant="outlined"
						className="flex items-center justify-between p-2.5 rounded-xl bg-m3-surface-container-high/50 border border-m3-outline-variant/30 text-xs"
					>
						<div className="flex flex-col">
							<Text
								variant="label-sm"
								className="text-m3-on-surface-variant font-sans font-medium"
							>
								{t("trim_end_time")}
							</Text>
							<Text
								variant="label-md"
								className="font-bold text-m3-on-surface font-mono"
							>
								{formatTime(trimmedEnd)}
							</Text>
						</div>
						<ButtonGroup variant="connected" size="xs">
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(-1)}>
								-1s
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(-0.1)}>
								-0.1s
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(-0.01)}>
								-10ms
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(0.01)}>
								+10ms
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(0.1)}>
								+0.1s
							</Button>
							<Button colorStyle="outlined" onClick={() => onAdjustEnd(1)}>
								+1s
							</Button>
						</ButtonGroup>
					</Card>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex flex-wrap gap-2 justify-center pt-1">
				<Button
					colorStyle="tonal"
					onClick={onTogglePlayback}
					icon={isPlaying ? <Icon name="pause" /> : <Icon name="play_arrow" />}
				>
					{isPlaying ? t("trim_pause") : t("trim_play")}
				</Button>

				<Button
					colorStyle="outlined"
					onClick={onSeekFromStart}
					icon={<Icon name="replay" />}
					title={
						language === "vi"
							? "Nghe lại từ đầu đoạn cắt"
							: "Preview from trim start"
					}
				>
					{language === "vi" ? "Nghe từ điểm đầu" : "From Start"}
				</Button>

				<Button
					colorStyle="outlined"
					onClick={onResetTrim}
					icon={<Icon name="restart_alt" />}
					disabled={trimRange[0] === 0 && trimRange[1] === 100}
				>
					{t("trim_reset")}
				</Button>

				<Button
					colorStyle="outlined"
					onClick={onQuickExport}
					icon={<Icon name="file_download" />}
					disabled={isMerging}
				>
					{language === "vi" ? "Xuất nhanh đoạn này" : "Quick Export Selection"}
				</Button>

				<Button
					colorStyle="filled"
					onClick={onAddToQueue}
					icon={<Icon name="add" />}
				>
					{t("trim_add_queue")}
				</Button>
			</div>
		</div>
	);
}
