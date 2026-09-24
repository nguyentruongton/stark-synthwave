import {
	Button,
	Card,
	Checkbox,
	Chip,
	Icon,
	IconButton,
	List,
	ListItem,
	Text,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { AudioFileItem } from "../../utils/metadataService";

interface MetadataFileListProps {
	files: AudioFileItem[];
	onToggleSelect: (id: string) => void;
	onToggleSelectAll: () => void;
	onClearAll: () => void;
	onOpenBatchEdit: () => void;
	onBatchDownload: () => void;
	onOpenSingleEdit: (item: AudioFileItem) => void;
	onDownloadSingle: (item: AudioFileItem) => void;
	onRemoveFile: (id: string) => void;
}

export function MetadataFileList({
	files,
	onToggleSelect,
	onToggleSelectAll,
	onClearAll,
	onOpenBatchEdit,
	onBatchDownload,
	onOpenSingleEdit,
	onDownloadSingle,
	onRemoveFile,
}: MetadataFileListProps) {
	const { t } = useLanguage();
	const selectedCount = files.filter((f) => f.selected).length;
	const isAllSelected = files.length > 0 && selectedCount === files.length;

	return (
		<div className="flex flex-col gap-3">
			{/* Action Toolbar */}
			<Card
				variant="filled"
				className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-m3-surface-container rounded-m3-large border border-m3-outline-variant/40"
			>
				<div className="flex items-center gap-3">
					<Checkbox
						checked={isAllSelected}
						indeterminate={selectedCount > 0 && !isAllSelected}
						onCheckedChange={onToggleSelectAll}
						aria-label={
							isAllSelected
								? t("metadata_deselect_all")
								: t("metadata_select_all")
						}
					/>
					<div className="flex items-center gap-2">
						<Text variant="title-sm" className="font-medium text-m3-on-surface">
							{files.length} {t("metadata_files_count")}
						</Text>
						{selectedCount > 0 && (
							<Chip
								label={`${selectedCount} ${t("metadata_selected_count")}`}
								selected={true}
							/>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<AnimatePresence>
						{selectedCount > 0 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className="flex items-center gap-2"
							>
								<Button
									colorStyle="filled"
									size="sm"
									type="button"
									icon={<Icon name="edit_note" size={18} />}
									onClick={onOpenBatchEdit}
								>
									{t("metadata_batch_edit")}
								</Button>
								<Button
									colorStyle="tonal"
									size="sm"
									type="button"
									icon={<Icon name="download" size={18} />}
									onClick={onBatchDownload}
								>
									{t("metadata_batch_download")}
								</Button>
							</motion.div>
						)}
					</AnimatePresence>

					<IconButton
						aria-label={t("metadata_clear_all")}
						title={t("metadata_clear_all")}
						colorStyle="standard"
						size="sm"
						type="button"
						onClick={onClearAll}
					>
						<Icon name="delete_sweep" size={20} />
					</IconButton>
				</div>
			</Card>

			{/* File List */}
			<Card
				variant="outlined"
				className="bg-m3-surface overflow-hidden border-m3-outline-variant p-0"
			>
				<List className="divide-y divide-m3-outline-variant/30">
					{files.map((item) => {
						const displayTitle = item.tags.title || item.file.name;
						const displayArtist = item.tags.artist || "—";
						const displayAlbum = item.tags.album || "—";

						return (
							<ListItem
								key={item.id}
								value={item.id}
								selected={item.selected}
								interactive
								alignItems="center"
								onClick={(e) => {
									if (
										(e.target as HTMLElement | null)?.closest("input, button")
									) {
										return;
									}
									onToggleSelect(item.id);
								}}
								leadingType="custom"
								leadingContent={
									<div className="flex items-center gap-3">
										<Checkbox
											checked={item.selected}
											onCheckedChange={() => onToggleSelect(item.id)}
											aria-label={`Select ${item.file.name}`}
										/>
										<div className="w-11 h-11 rounded-m3-medium bg-m3-surface-container-high overflow-hidden shrink-0 flex items-center justify-center border border-m3-outline-variant/50">
											{item.coverUrl ? (
												<img
													src={item.coverUrl}
													alt={displayTitle}
													className="w-full h-full object-cover"
												/>
											) : (
												<Icon
													name="music_note"
													size={22}
													className="text-m3-on-surface-variant/70"
												/>
											)}
										</div>
									</div>
								}
								headline={
									<div className="flex items-center gap-2 max-w-full">
										<span className="font-semibold truncate text-m3-on-surface text-sm sm:text-base">
											{displayTitle}
										</span>
									</div>
								}
								supportingText={
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-m3-on-surface-variant mt-0.5">
										<span className="truncate max-w-30 sm:max-w-50">
											{displayArtist}
										</span>
										<span>•</span>
										<span className="truncate max-w-30 sm:max-w-50">
											{displayAlbum}
										</span>
										<span>•</span>
										<span>{item.sizeFormatted}</span>
									</div>
								}
								overline={
									<div className="flex items-center gap-1.5 mb-1">
										<span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-m3-extra-small bg-m3-secondary-container text-m3-on-secondary-container">
											{item.format}
										</span>
										<span
											className={`text-[10px] font-medium px-1.5 py-0.5 rounded-m3-extra-small ${
												item.hasTags
													? "bg-m3-primary/15 text-m3-primary"
													: "bg-m3-surface-variant text-m3-on-surface-variant"
											}`}
										>
											{item.hasTags
												? t("metadata_has_tags")
												: t("metadata_no_tags")}
										</span>
									</div>
								}
								trailingType="custom"
								trailingContent={
									<div className="flex items-center gap-1">
										<IconButton
											aria-label={t("metadata_edit_single")}
											title={t("metadata_edit_single")}
											size="sm"
											colorStyle="tonal"
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onOpenSingleEdit(item);
											}}
										>
											<Icon name="edit" size={18} />
										</IconButton>
										<IconButton
											aria-label={t("metadata_download_single")}
											title={t("metadata_download_single")}
											size="sm"
											colorStyle="standard"
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onDownloadSingle(item);
											}}
										>
											<Icon name="download" size={18} />
										</IconButton>
										<IconButton
											aria-label={t("metadata_remove_file")}
											title={t("metadata_remove_file")}
											size="sm"
											colorStyle="standard"
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onRemoveFile(item.id);
											}}
										>
											<Icon
												name="close"
												size={18}
												className="text-m3-on-surface-variant"
											/>
										</IconButton>
									</div>
								}
							/>
						);
					})}
				</List>
			</Card>
		</div>
	);
}
