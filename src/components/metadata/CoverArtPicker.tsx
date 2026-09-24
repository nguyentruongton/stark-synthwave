import { Button, Icon, Text } from "@bug-on/m3-expressive";
import type React from "react";
import { useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

interface CoverArtPickerProps {
	coverUrl: string | null | undefined;
	onCoverSelected: (file: File) => void;
	onRemoveCover: () => void;
	className?: string;
}

export function CoverArtPicker({
	coverUrl,
	onCoverSelected,
	onRemoveCover,
	className = "",
}: CoverArtPickerProps) {
	const { t } = useLanguage();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onCoverSelected(e.target.files[0]);
			e.target.value = "";
		}
	};

	return (
		<div
			className={`flex flex-col sm:flex-row items-center gap-5 p-4 rounded-m3-large bg-m3-surface-container ${className}`}
		>
			<div className="relative w-28 h-28 rounded-m3-medium bg-m3-surface-container-highest shrink-0 overflow-hidden border border-m3-outline-variant flex items-center justify-center shadow-xs">
				{coverUrl ? (
					<img
						src={coverUrl}
						alt="Cover preview"
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="flex flex-col items-center gap-1 text-m3-on-surface-variant/60">
						<Icon name="album" size={36} />
						<span className="text-[10px]">{t("metadata_no_cover")}</span>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-2.5 text-center sm:text-left flex-1 min-w-0">
				<Text variant="title-sm" className="font-semibold text-m3-on-surface">
					{t("metadata_cover_art")}
				</Text>
				<Text variant="body-sm" className="text-m3-on-surface-variant">
					JPG, PNG, WEBP (Max 5MB)
				</Text>
				<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
					<input
						ref={inputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>
					<Button
						colorStyle="tonal"
						size="sm"
						type="button"
						icon={<Icon name="image" size={18} />}
						onClick={() => inputRef.current?.click()}
					>
						{t("metadata_change_cover")}
					</Button>
					{coverUrl && (
						<Button
							colorStyle="outlined"
							size="sm"
							type="button"
							icon={<Icon name="delete" size={18} />}
							onClick={onRemoveCover}
						>
							{t("metadata_remove_cover")}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
