import {
	Icon,
	ProgressIndicator,
	Text,
	useSnackbar,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useCallback, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
	type AudioFileItem,
	type AudioMetadataTags,
	type BatchFieldsState,
	type CoverArtData,
	readAudioMetadataItem,
	triggerDownload,
	writeSingleMetadata,
} from "../utils/metadataService";
import { MetadataBatchDialog } from "./metadata/MetadataBatchDialog";
import { MetadataDropZone } from "./metadata/MetadataDropZone";
import { MetadataFileList } from "./metadata/MetadataFileList";
import { MetadataSingleDialog } from "./metadata/MetadataSingleDialog";

export function MetadataEditor() {
	const { t } = useLanguage();
	const { showSnackbar } = useSnackbar();

	const [files, setFiles] = useState<AudioFileItem[]>([]);
	const [isReading, setIsReading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	// Single edit state
	const [editingItem, setEditingItem] = useState<AudioFileItem | null>(null);
	const [editForm, setEditForm] = useState<AudioMetadataTags>({
		title: "",
		artist: "",
		album: "",
		year: "",
		track: "",
		genre: "",
		comment: "",
	});
	const [editCoverUrl, setEditCoverUrl] = useState<string | null>(null);
	const [editCoverData, setEditCoverData] = useState<
		CoverArtData | null | "keep"
	>("keep");
	const [isSavingSingle, setIsSavingSingle] = useState(false);

	// Batch edit state
	const [isBatchOpen, setIsBatchOpen] = useState(false);
	const [batchProgress, setBatchProgress] = useState<number | null>(null);
	const [isBatchProcessing, setIsBatchProcessing] = useState(false);
	const [batchFields, setBatchFields] = useState<BatchFieldsState>({
		title: { enabled: false, value: "" },
		artist: { enabled: false, value: "" },
		album: { enabled: false, value: "" },
		year: { enabled: false, value: "" },
		track: { enabled: false, value: "" },
		genre: { enabled: false, value: "" },
		comment: { enabled: false, value: "" },
		cover: { enabled: false, action: "keep" },
	});

	// Process uploaded files with microtask yielding
	const processUploadedFiles = useCallback(async (uploadedFiles: File[]) => {
		if (uploadedFiles.length === 0) return;
		setIsReading(true);

		const newItems: AudioFileItem[] = [];
		for (const file of uploadedFiles) {
			const item = await readAudioMetadataItem(file);
			newItems.push(item);
			// Cooperative scheduling to keep UI 60fps
			await new Promise((r) => setTimeout(r, 0));
		}

		setFiles((prev) => [...prev, ...newItems]);
		setIsReading(false);
	}, []);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			await processUploadedFiles(Array.from(e.dataTransfer.files));
		}
	};

	const toggleSelect = (id: string) => {
		setFiles((prev) =>
			prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)),
		);
	};

	const toggleSelectAll = () => {
		const allSelected = files.every((f) => f.selected);
		setFiles((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
	};

	const removeFile = (id: string) => {
		setFiles((prev) => {
			const target = prev.find((f) => f.id === id);
			if (target?.coverUrl) {
				URL.revokeObjectURL(target.coverUrl);
			}
			return prev.filter((f) => f.id !== id);
		});
	};

	const clearAll = () => {
		for (const f of files) {
			if (f.coverUrl) URL.revokeObjectURL(f.coverUrl);
		}
		setFiles([]);
	};

	// Open single edit dialog
	const openSingleEdit = (item: AudioFileItem) => {
		setEditingItem(item);
		setEditForm({ ...item.tags });
		setEditCoverUrl(item.coverUrl || null);
		setEditCoverData("keep");
	};

	const handleSingleCoverUpload = async (file: File) => {
		try {
			const buffer = await file.arrayBuffer();
			const u8 = new Uint8Array(buffer);
			const mime = file.type || "image/jpeg";
			const preview = URL.createObjectURL(new Blob([u8], { type: mime }));
			setEditCoverUrl(preview);
			setEditCoverData({ format: mime, data: Array.from(u8) });
		} catch (err) {
			console.error("Cover upload error:", err);
			showSnackbar({ message: t("metadata_read_error") });
		}
	};

	const handleSaveSingle = async () => {
		if (!editingItem) return;
		setIsSavingSingle(true);

		try {
			const { updatedBuffer, newCoverUrl, newCoverData } =
				await writeSingleMetadata(
					editingItem,
					editForm,
					editCoverData,
					editCoverUrl,
				);

			triggerDownload(
				updatedBuffer,
				editingItem.file.name,
				editingItem.file.type,
			);

			setFiles((prev) =>
				prev.map((item) =>
					item.id === editingItem.id
						? {
								...item,
								tags: { ...editForm },
								hasTags: true,
								coverUrl: newCoverUrl,
								coverData: newCoverData,
								rawBuffer: updatedBuffer,
								status: "ready",
							}
						: item,
				),
			);

			showSnackbar({ message: t("metadata_save_success") });
			setEditingItem(null);
		} catch (err) {
			console.error("Single save error:", err);
			showSnackbar({ message: t("metadata_save_error") });
		} finally {
			setIsSavingSingle(false);
		}
	};

	const handleDownloadSingleDirect = (item: AudioFileItem) => {
		if (item.rawBuffer) {
			triggerDownload(item.rawBuffer, item.file.name, item.file.type);
		} else {
			item.file.arrayBuffer().then((buf) => {
				triggerDownload(buf, item.file.name, item.file.type);
			});
		}
	};

	const handleBatchDownloadAllSelected = () => {
		const selectedItems = files.filter((f) => f.selected);
		for (const item of selectedItems) {
			handleDownloadSingleDirect(item);
		}
	};

	const handleBatchCoverUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		if (e.target.files && e.target.files.length > 0) {
			const imgFile = e.target.files[0];
			try {
				const buffer = await imgFile.arrayBuffer();
				const u8 = new Uint8Array(buffer);
				const mime = imgFile.type || "image/jpeg";
				const preview = URL.createObjectURL(new Blob([u8], { type: mime }));
				setBatchFields((prev) => ({
					...prev,
					cover: {
						enabled: true,
						action: "set",
						data: { format: mime, data: Array.from(u8) },
						previewUrl: preview,
					},
				}));
			} catch (err) {
				console.error("Batch cover read error:", err);
				showSnackbar({ message: t("metadata_read_error") });
			}
			e.target.value = "";
		}
	};

	const handleApplyBatch = async () => {
		const selectedItems = files.filter((f) => f.selected);
		if (selectedItems.length === 0) return;

		setIsBatchProcessing(true);
		setBatchProgress(0);

		try {
			const updatedList: AudioFileItem[] = [...files];

			for (let i = 0; i < selectedItems.length; i++) {
				const currentItem = selectedItems[i];
				const targetTags: AudioMetadataTags = { ...currentItem.tags };

				if (batchFields.title.enabled)
					targetTags.title = batchFields.title.value.trim();
				if (batchFields.artist.enabled)
					targetTags.artist = batchFields.artist.value.trim();
				if (batchFields.album.enabled)
					targetTags.album = batchFields.album.value.trim();
				if (batchFields.year.enabled)
					targetTags.year = batchFields.year.value.trim();
				if (batchFields.track.enabled)
					targetTags.track = batchFields.track.value.trim();
				if (batchFields.genre.enabled)
					targetTags.genre = batchFields.genre.value.trim();
				if (batchFields.comment.enabled)
					targetTags.comment = batchFields.comment.value.trim();

				let coverDataToApply: CoverArtData | null | "keep" = "keep";
				let previewUrlToApply: string | null = currentItem.coverUrl || null;

				if (batchFields.cover.enabled) {
					if (batchFields.cover.action === "remove") {
						coverDataToApply = null;
						previewUrlToApply = null;
					} else if (
						batchFields.cover.action === "set" &&
						batchFields.cover.data
					) {
						coverDataToApply = batchFields.cover.data;
						previewUrlToApply = batchFields.cover.previewUrl || null;
					}
				}

				const { updatedBuffer, newCoverUrl, newCoverData } =
					await writeSingleMetadata(
						currentItem,
						targetTags,
						coverDataToApply,
						previewUrlToApply,
					);

				triggerDownload(
					updatedBuffer,
					currentItem.file.name,
					currentItem.file.type,
				);

				const idx = updatedList.findIndex((item) => item.id === currentItem.id);
				if (idx !== -1) {
					updatedList[idx] = {
						...currentItem,
						tags: targetTags,
						hasTags: true,
						coverUrl: newCoverUrl,
						coverData: newCoverData,
						rawBuffer: updatedBuffer,
						status: "ready",
					};
				}

				setBatchProgress(Math.round(((i + 1) / selectedItems.length) * 100));
				// Microtask yield
				await new Promise((r) => setTimeout(r, 20));
			}

			setFiles(updatedList);
			showSnackbar({ message: t("metadata_batch_success") });
			setIsBatchOpen(false);
		} catch (err) {
			console.error("Batch apply error:", err);
			showSnackbar({ message: t("metadata_save_error") });
		} finally {
			setIsBatchProcessing(false);
			setBatchProgress(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
			{/* Header */}
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2.5">
					<div className="p-2 rounded-m3-large bg-m3-primary/10 text-m3-primary">
						<Icon name="sell" size={24} />
					</div>
					<Text variant="headline-sm" className="font-bold text-m3-on-surface">
						{t("metadata_title")}
					</Text>
				</div>
				<Text
					variant="body-md"
					className="text-m3-on-surface-variant max-w-2xl"
				>
					{t("metadata_subtitle")}
				</Text>
			</div>

			{/* Drop Zone */}
			<MetadataDropZone
				isDragging={isDragging}
				onFilesSelected={processUploadedFiles}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			/>

			{/* Reading Progress Indicator */}
			{isReading && (
				<div className="flex flex-col gap-2 items-center justify-center p-4 bg-m3-surface-container rounded-m3-large">
					<ProgressIndicator
						variant="linear"
						aria-label={t("metadata_reading_tags")}
					/>
					<Text variant="body-sm" className="text-m3-on-surface-variant">
						{t("metadata_reading_tags")}
					</Text>
				</div>
			)}

			{/* File List */}
			{files.length > 0 && (
				<MetadataFileList
					files={files}
					onToggleSelect={toggleSelect}
					onToggleSelectAll={toggleSelectAll}
					onClearAll={clearAll}
					onOpenBatchEdit={() => setIsBatchOpen(true)}
					onBatchDownload={handleBatchDownloadAllSelected}
					onOpenSingleEdit={openSingleEdit}
					onDownloadSingle={handleDownloadSingleDirect}
					onRemoveFile={removeFile}
				/>
			)}

			{/* Empty State */}
			{files.length === 0 && !isReading && (
				<div className="flex flex-col items-center justify-center p-12 text-center border border-m3-outline-variant/30 rounded-m3-extra-large bg-m3-surface-container-low/50">
					<div className="w-16 h-16 rounded-m3-extra-large bg-m3-surface-container flex items-center justify-center text-m3-on-surface-variant mb-4">
						<Icon name="queue_music" size={36} />
					</div>
					<Text
						variant="title-md"
						className="font-semibold text-m3-on-surface mb-1"
					>
						{t("metadata_empty_title")}
					</Text>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant max-w-sm mb-5"
					>
						{t("metadata_empty_desc")}
					</Text>
				</div>
			)}

			{/* Single Edit Dialog */}
			<MetadataSingleDialog
				editingItem={editingItem}
				editForm={editForm}
				editCoverUrl={editCoverUrl}
				isSaving={isSavingSingle}
				onClose={() => setEditingItem(null)}
				onFormChange={setEditForm}
				onCoverSelected={handleSingleCoverUpload}
				onRemoveCover={() => {
					setEditCoverUrl(null);
					setEditCoverData(null);
				}}
				onSave={handleSaveSingle}
			/>

			{/* Batch Edit Dialog */}
			<MetadataBatchDialog
				isOpen={isBatchOpen}
				isProcessing={isBatchProcessing}
				progress={batchProgress}
				selectedCount={files.filter((f) => f.selected).length}
				batchFields={batchFields}
				onClose={() => setIsBatchOpen(false)}
				onBatchFieldsChange={setBatchFields}
				onCoverUpload={handleBatchCoverUpload}
				onApplyBatch={handleApplyBatch}
			/>
		</div>
	);
}
