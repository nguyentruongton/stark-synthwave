import {
	Button,
	Card,
	Divider,
	Icon,
	IconButton,
	Text,
} from "@bug-on/m3-expressive";
import { useLanguage } from "../../i18n/LanguageContext";
import type { AudioTrack } from "../../types";
import { AdaptiveScrollArea } from "../AdaptiveScrollArea";

interface MergeQueueCardProps {
	mergeQueue: AudioTrack[];
	isMerging: boolean;
	onClearQueue: () => void;
	onRemoveFromQueue: (id: string) => void;
	onMerge: () => void;
}

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MergeQueueCard({
	mergeQueue,
	isMerging,
	onClearQueue,
	onRemoveFromQueue,
	onMerge,
}: MergeQueueCardProps) {
	const { t, language } = useLanguage();

	return (
		<Card
			variant="outlined"
			className="p-5 flex flex-col gap-4 overflow-hidden border border-m3-outline-variant/30 rounded-2xl bg-m3-surface-container-lowest/30"
		>
			<div className="flex items-start justify-between gap-2 min-w-0">
				<div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
					<IconButton colorStyle="tonal" aria-label="Merge queue">
						<Icon name="call_merge" className="text-m3-secondary" />
					</IconButton>
					<div className="overflow-hidden min-w-0">
						<Text
							variant="title-md"
							className="font-semibold text-m3-on-surface"
						>
							{t("trim_queue_title")} ({mergeQueue.length})
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{language === "vi"
								? "Các đoạn nhạc sẽ được nối tiếp nhau theo thứ tự dưới đây."
								: "Segments will be concatenated in sequential order below."}
						</Text>
					</div>
				</div>

				{mergeQueue.length > 0 && (
					<Button colorStyle="text" className="shrink-0" onClick={onClearQueue}>
						{language === "vi" ? "Xóa tất cả" : "Clear all"}
					</Button>
				)}
			</div>

			<Divider shape="wavy" />

			{mergeQueue.length === 0 ? (
				<div className="p-8 text-center text-m3-on-surface-variant/60 flex flex-col items-center justify-center gap-2">
					<Icon
						name="content_cut"
						size={40}
						className="text-m3-on-surface-variant/40"
					/>
					<Text variant="body-md">{t("trim_queue_empty")}</Text>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{/* List segments */}
					<AdaptiveScrollArea className="max-h-55 pr-1" orientation="vertical">
						<div className="flex flex-col gap-2">
							{mergeQueue.map((item, idx) => (
								<Card
									key={item.id}
									variant="outlined"
									className="flex items-center justify-between p-3 bg-m3-surface-container-high border-m3-outline-variant/50 rounded-xl"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<span className="w-6 h-6 rounded-full bg-m3-secondary-container text-m3-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
											{idx + 1}
										</span>
										<div className="overflow-hidden">
											<Text
												variant="body-md"
												className="font-medium text-m3-on-surface truncate block"
											>
												{item.name}
											</Text>
											<Text
												variant="body-sm"
												className="text-m3-on-surface-variant"
											>
												{t("trim_duration")}: {formatDuration(item.duration)}
											</Text>
										</div>
									</div>
									<IconButton
										aria-label="Delete segment"
										onClick={() => onRemoveFromQueue(item.id)}
									>
										<Icon name="delete" />
									</IconButton>
								</Card>
							))}
						</div>
					</AdaptiveScrollArea>

					<Button
						colorStyle="filled"
						onClick={onMerge}
						disabled={mergeQueue.length < 2 || isMerging}
						icon={<Icon name="call_merge" />}
						className="mt-2"
					>
						{isMerging ? t("trim_exporting") : t("trim_export_btn")}
					</Button>
				</div>
			)}
		</Card>
	);
}
