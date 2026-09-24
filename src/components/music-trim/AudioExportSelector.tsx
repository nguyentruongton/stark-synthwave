import { Card, Text } from "@bug-on/m3-expressive";
import { useLanguage } from "../../i18n/LanguageContext";
import type { ExportFormatId } from "../../types";
import { EXPORT_FORMAT_OPTIONS } from "../../utils/audioEncoder";

interface AudioExportSelectorProps {
	exportFormat: ExportFormatId;
	onFormatChange: (format: ExportFormatId) => void;
}

export function AudioExportSelector({
	exportFormat,
	onFormatChange,
}: AudioExportSelectorProps) {
	const { t } = useLanguage();
	const activeOption = EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat);

	return (
		<Card
			variant="filled"
			className="flex flex-col gap-2.5 p-4 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/40"
		>
			<div className="flex items-center justify-between">
				<Text variant="body-md" className="font-semibold text-m3-on-surface">
					{t("trim_export_format")}
				</Text>
				<Text
					variant="label-sm"
					className="text-m3-primary font-mono font-medium"
				>
					{activeOption?.qualityBadge}
				</Text>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
				{EXPORT_FORMAT_OPTIONS.map((opt) => {
					const isSelected = exportFormat === opt.id;
					return (
						<Card
							key={opt.id}
							variant={isSelected ? "filled" : "outlined"}
							interactive
							onClick={() => onFormatChange(opt.id)}
							className={`p-3 text-left transition-all ${
								isSelected
									? "ring-2 ring-m3-primary bg-m3-primary-container/30"
									: "bg-m3-surface-container-high/60 border-m3-outline-variant/40 hover:bg-m3-surface-container-high"
							}`}
						>
							<div className="flex items-center justify-between gap-1">
								<Text
									variant="label-lg"
									className={`font-semibold ${isSelected ? "text-m3-primary" : "text-m3-on-surface"}`}
								>
									{opt.label}
								</Text>
								{opt.isLossless && (
									<span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-m3-primary-container/60 text-m3-primary border border-m3-primary/30">
										Lossless
									</span>
								)}
							</div>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant text-xs line-clamp-1 mt-0.5"
							>
								{opt.description}
							</Text>
						</Card>
					);
				})}
			</div>
		</Card>
	);
}
