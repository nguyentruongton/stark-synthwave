import {
	Button,
	Checkbox,
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Divider,
	Icon,
	ProgressIndicator,
	Text,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { BatchFieldsState } from "../../utils/metadataService";

interface MetadataBatchDialogProps {
	isOpen: boolean;
	isProcessing: boolean;
	progress: number | null;
	selectedCount: number;
	batchFields: BatchFieldsState;
	onClose: () => void;
	onBatchFieldsChange: React.Dispatch<React.SetStateAction<BatchFieldsState>>;
	onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onApplyBatch: () => void;
}

export function MetadataBatchDialog({
	isOpen,
	isProcessing,
	progress,
	selectedCount,
	batchFields,
	onClose,
	onBatchFieldsChange,
	onCoverUpload,
	onApplyBatch,
}: MetadataBatchDialogProps) {
	const { t } = useLanguage();
	const coverInputRef = useRef<HTMLInputElement | null>(null);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && !isProcessing && onClose()}
		>
			<DialogContent
				className="max-w-2xl w-full p-0 overflow-hidden bg-m3-surface border-m3-outline-variant"
				closeButtonProps={{
					disabled: isProcessing,
					"aria-label": t("common_close"),
				}}
			>
				<DialogHeader className="px-6 pt-6 pb-2">
					<DialogTitle className="flex items-center gap-2.5 text-m3-on-surface">
						<Icon name="edit_note" className="text-m3-primary" size={24} />
						<span>{t("metadata_batch_dialog_title")}</span>
					</DialogTitle>
					<Text variant="body-sm" className="text-m3-on-surface-variant mt-1">
						{t("metadata_batch_dialog_desc")} ({selectedCount}{" "}
						{t("metadata_files_count")})
					</Text>
				</DialogHeader>

				<Divider />

				<DialogBody className="p-6 max-h-[70vh] overflow-y-auto flex flex-col gap-5">
					{/* Progress if batch applying */}
					{isProcessing && progress !== null && (
						<div className="flex flex-col gap-2 p-4 rounded-m3-large bg-m3-primary-container/30">
							<div className="flex items-center justify-between text-xs font-semibold">
								<span>{t("metadata_saving")}</span>
								<span>{progress}%</span>
							</div>
							<ProgressIndicator
								variant="linear"
								aria-label={t("metadata_saving")}
								value={progress}
							/>
						</div>
					)}

					{/* Batch Fields with Checkbox toggles */}
					<div className="flex flex-col gap-3">
						{/* Artist */}
						<div className="flex items-center gap-3">
							<Checkbox
								checked={batchFields.artist.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										artist: { ...prev.artist, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_artist_field")}`}
							/>
							<div className="flex-1">
								<TextField
									label={t("metadata_artist_field")}
									value={batchFields.artist.value}
									disabled={!batchFields.artist.enabled}
									onChange={(val) =>
										onBatchFieldsChange((prev) => ({
											...prev,
											artist: { ...prev.artist, value: val },
										}))
									}
									variant="outlined"
								/>
							</div>
						</div>

						{/* Album */}
						<div className="flex items-center gap-3">
							<Checkbox
								checked={batchFields.album.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										album: { ...prev.album, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_album_field")}`}
							/>
							<div className="flex-1">
								<TextField
									label={t("metadata_album_field")}
									value={batchFields.album.value}
									disabled={!batchFields.album.enabled}
									onChange={(val) =>
										onBatchFieldsChange((prev) => ({
											...prev,
											album: { ...prev.album, value: val },
										}))
									}
									variant="outlined"
								/>
							</div>
						</div>

						{/* Release Year */}
						<div className="flex items-center gap-3">
							<Checkbox
								checked={batchFields.year.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										year: { ...prev.year, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_year_field")}`}
							/>
							<div className="flex-1">
								<TextField
									label={t("metadata_year_field")}
									value={batchFields.year.value}
									disabled={!batchFields.year.enabled}
									onChange={(val) =>
										onBatchFieldsChange((prev) => ({
											...prev,
											year: { ...prev.year, value: val },
										}))
									}
									variant="outlined"
								/>
							</div>
						</div>

						{/* Genre */}
						<div className="flex items-center gap-3">
							<Checkbox
								checked={batchFields.genre.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										genre: { ...prev.genre, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_genre_field")}`}
							/>
							<div className="flex-1">
								<TextField
									label={t("metadata_genre_field")}
									value={batchFields.genre.value}
									disabled={!batchFields.genre.enabled}
									onChange={(val) =>
										onBatchFieldsChange((prev) => ({
											...prev,
											genre: { ...prev.genre, value: val },
										}))
									}
									variant="outlined"
								/>
							</div>
						</div>

						{/* Comment */}
						<div className="flex items-center gap-3">
							<Checkbox
								checked={batchFields.comment.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										comment: { ...prev.comment, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_comment_field")}`}
							/>
							<div className="flex-1">
								<TextField
									label={t("metadata_comment_field")}
									value={batchFields.comment.value}
									disabled={!batchFields.comment.enabled}
									onChange={(val) =>
										onBatchFieldsChange((prev) => ({
											...prev,
											comment: { ...prev.comment, value: val },
										}))
									}
									variant="outlined"
								/>
							</div>
						</div>

						{/* Cover Art Batch */}
						<div className="flex items-start gap-3 p-3 rounded-m3-large bg-m3-surface-container">
							<Checkbox
								checked={batchFields.cover.enabled}
								onCheckedChange={(checked) =>
									onBatchFieldsChange((prev) => ({
										...prev,
										cover: { ...prev.cover, enabled: checked },
									}))
								}
								aria-label={`Toggle ${t("metadata_cover_art")}`}
							/>
							<div className="flex-1 flex flex-col gap-2">
								<Text
									variant="title-sm"
									className="font-semibold text-m3-on-surface"
								>
									{t("metadata_cover_art")}
								</Text>
								<div className="flex flex-wrap items-center gap-3">
									<input
										ref={coverInputRef}
										type="file"
										accept="image/png,image/jpeg,image/webp"
										className="hidden"
										disabled={!batchFields.cover.enabled}
										onChange={onCoverUpload}
									/>
									<Button
										colorStyle="tonal"
										size="sm"
										type="button"
										disabled={!batchFields.cover.enabled}
										icon={<Icon name="image" size={18} />}
										onClick={() => coverInputRef.current?.click()}
									>
										{t("metadata_change_cover")}
									</Button>
									<Button
										colorStyle="outlined"
										size="sm"
										type="button"
										disabled={!batchFields.cover.enabled}
										icon={<Icon name="delete" size={18} />}
										onClick={() =>
											onBatchFieldsChange((prev) => ({
												...prev,
												cover: {
													enabled: true,
													action: "remove",
													data: undefined,
													previewUrl: undefined,
												},
											}))
										}
									>
										{t("metadata_remove_cover")}
									</Button>
									{batchFields.cover.previewUrl && (
										<div className="w-10 h-10 rounded-m3-small overflow-hidden border border-m3-outline-variant shrink-0">
											<img
												src={batchFields.cover.previewUrl}
												alt="Batch Cover"
												className="w-full h-full object-cover"
											/>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</DialogBody>

				<Divider />

				<DialogFooter className="px-6 py-4 flex items-center justify-end gap-3 bg-m3-surface-container-low">
					<Button
						colorStyle="outlined"
						disabled={isProcessing}
						onClick={onClose}
					>
						{t("common_close")}
					</Button>
					<Button
						colorStyle="filled"
						disabled={isProcessing || selectedCount === 0}
						icon={isProcessing ? undefined : <Icon name="done_all" />}
						onClick={onApplyBatch}
					>
						{isProcessing
							? t("metadata_saving")
							: t("metadata_batch_apply_btn")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
