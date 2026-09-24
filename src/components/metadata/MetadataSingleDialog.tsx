import {
	Button,
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Divider,
	Icon,
	TextField,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type {
	AudioFileItem,
	AudioMetadataTags,
} from "../../utils/metadataService";
import { CoverArtPicker } from "./CoverArtPicker";

interface MetadataSingleDialogProps {
	editingItem: AudioFileItem | null;
	editForm: AudioMetadataTags;
	editCoverUrl: string | null;
	isSaving: boolean;
	onClose: () => void;
	onFormChange: React.Dispatch<React.SetStateAction<AudioMetadataTags>>;
	onCoverSelected: (file: File) => void;
	onRemoveCover: () => void;
	onSave: () => void;
}

export function MetadataSingleDialog({
	editingItem,
	editForm,
	editCoverUrl,
	isSaving,
	onClose,
	onFormChange,
	onCoverSelected,
	onRemoveCover,
	onSave,
}: MetadataSingleDialogProps) {
	const { t } = useLanguage();

	if (!editingItem) return null;

	return (
		<Dialog
			open={Boolean(editingItem)}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent
				className="max-w-2xl w-full p-0 overflow-hidden bg-m3-surface border-m3-outline-variant"
				closeButtonProps={{
					"aria-label": t("common_close"),
				}}
			>
				<DialogHeader className="p-6 pb-4">
					<DialogTitle className="flex items-center gap-2 text-xl font-bold">
						<Icon name="edit" className="text-m3-primary" />
						{t("metadata_single_dialog_title")}
					</DialogTitle>
					<span className="text-xs text-m3-on-surface-variant font-mono truncate max-w-full block mt-1">
						{editingItem.file.name}
					</span>
				</DialogHeader>

				<Divider />

				<DialogBody className="p-6 max-h-[70vh] overflow-y-auto flex flex-col gap-5">
					{/* Cover Art Section */}
					<CoverArtPicker
						coverUrl={editCoverUrl}
						onCoverSelected={onCoverSelected}
						onRemoveCover={onRemoveCover}
					/>

					{/* Tag Input Fields */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<TextField
							label={t("metadata_title_field")}
							value={editForm.title}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, title: val }))
							}
							leadingIcon={<Icon name="title" />}
							variant="outlined"
						/>
						<TextField
							label={t("metadata_artist_field")}
							value={editForm.artist}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, artist: val }))
							}
							leadingIcon={<Icon name="person" />}
							variant="outlined"
						/>
						<TextField
							label={t("metadata_album_field")}
							value={editForm.album}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, album: val }))
							}
							leadingIcon={<Icon name="album" />}
							variant="outlined"
						/>
						<TextField
							label={t("metadata_year_field")}
							value={editForm.year}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, year: val }))
							}
							leadingIcon={<Icon name="calendar_today" />}
							variant="outlined"
						/>
						<TextField
							label={t("metadata_track_field")}
							value={editForm.track}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, track: val }))
							}
							leadingIcon={<Icon name="format_list_numbered" />}
							variant="outlined"
						/>
						<TextField
							label={t("metadata_genre_field")}
							value={editForm.genre}
							onChange={(val) =>
								onFormChange((prev) => ({ ...prev, genre: val }))
							}
							leadingIcon={<Icon name="category" />}
							variant="outlined"
						/>
					</div>

					<TextField
						label={t("metadata_comment_field")}
						value={editForm.comment}
						onChange={(val) =>
							onFormChange((prev) => ({ ...prev, comment: val }))
						}
						type="textarea"
						autoResize
						variant="outlined"
					/>
				</DialogBody>

				<Divider />

				<DialogFooter className="px-6 py-4 flex items-center justify-end gap-3 bg-m3-surface-container-low">
					<Button colorStyle="outlined" disabled={isSaving} onClick={onClose}>
						{t("common_close")}
					</Button>
					<Button
						colorStyle="filled"
						disabled={isSaving}
						icon={isSaving ? undefined : <Icon name="file_download" />}
						onClick={onSave}
					>
						{isSaving ? t("metadata_saving") : t("metadata_save_and_download")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
