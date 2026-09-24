import { Button, Card, Icon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

interface MetadataDropZoneProps {
	isDragging: boolean;
	onFilesSelected: (files: File[]) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
}

export function MetadataDropZone({
	isDragging,
	onFilesSelected,
	onDragOver,
	onDragLeave,
	onDrop,
}: MetadataDropZoneProps) {
	const { t } = useLanguage();
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onFilesSelected(Array.from(e.target.files));
			e.target.value = "";
		}
	};

	return (
		<Card
			variant={isDragging ? "elevated" : "outlined"}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className={`relative border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden ${
				isDragging
					? "border-m3-primary bg-m3-primary/10 shadow-lg scale-[1.01]"
					: "border-m3-outline-variant/60 hover:border-m3-primary/70 bg-m3-surface-container-low/40 hover:bg-m3-surface-container-low/80"
			}`}
			onClick={() => fileInputRef.current?.click()}
		>
			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept="audio/*,.mp3,.m4a,.mp4,.aac,.aiff,.aif"
				className="hidden"
				onChange={handleFileInputChange}
			/>

			<div
				className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 ${
					isDragging
						? "bg-m3-primary text-m3-on-primary scale-110"
						: "bg-m3-primary-container text-m3-on-primary-container"
				}`}
			>
				<Icon name="sell" size={32} />
			</div>

			<div className="flex flex-col gap-1 items-center max-w-md">
				<Text variant="title-md" className="font-semibold text-m3-on-surface">
					{t("metadata_drop_title")}
				</Text>
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					{t("metadata_drop_desc")}
				</Text>
			</div>

			<Button
				colorStyle="filled"
				type="button"
				className="mt-2"
				icon={<Icon name="upload_file" size={18} />}
				onClick={(e) => {
					e.stopPropagation();
					fileInputRef.current?.click();
				}}
			>
				{t("metadata_select_files")}
			</Button>
		</Card>
	);
}
