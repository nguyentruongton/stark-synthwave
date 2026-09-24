import {
	Button,
	ButtonGroup,
	Card,
	Icon,
	ShapeIcon,
	Text,
	TextField,
	useTheme,
} from "@bug-on/m3-expressive";
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { AppLogo } from "./AppLogo";

export interface ColorPreset {
	id: string;
	nameVi: string;
	nameEn: string;
	hex: string;
	descriptionVi: string;
	descriptionEn: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
	{
		id: "synthwave",
		nameVi: "Synthwave Tím",
		nameEn: "Synthwave Violet",
		hex: "#795290",
		descriptionVi: "Tím Synthwave hoài niệm & huyền bí",
		descriptionEn: "Classic retro synthwave violet",
	},
	{
		id: "cyan",
		nameVi: "Cyber Neon Cyan",
		nameEn: "Cyber Neon Cyan",
		hex: "#00838F",
		descriptionVi: "Xanh ngọc Neon tương lai nổi bật",
		descriptionEn: "High-contrast futuristic neon cyan",
	},
	{
		id: "magenta",
		nameVi: "Hoàng Hôn Magenta",
		nameEn: "Sunset Magenta",
		hex: "#C2185B",
		descriptionVi: "Sắc hồng cam rực rỡ thập niên 80",
		descriptionEn: "80s outrun vibrant sunset magenta",
	},
	{
		id: "emerald",
		nameVi: "Ma Trận Emerald",
		nameEn: "Emerald Matrix",
		hex: "#00796B",
		descriptionVi: "Xanh ngọc bích đậm chất công nghệ",
		descriptionEn: "Deep cyber emerald tech green",
	},
	{
		id: "amber",
		nameVi: "Hổ Phách Cyber",
		nameEn: "Amber Voltage",
		hex: "#B78103",
		descriptionVi: "Vàng cam năng lượng ấm áp",
		descriptionEn: "Warm energetic amber voltage",
	},
	{
		id: "blue",
		nameVi: "Đại Dương Electric",
		nameEn: "Electric Blue",
		hex: "#1565C0",
		descriptionVi: "Xanh biển sâu sắc nét & tĩnh lặng",
		descriptionEn: "Deep energetic ocean blue",
	},
	{
		id: "m3-classic",
		nameVi: "Material Classic",
		nameEn: "M3 Classic Indigo",
		hex: "#6750A4",
		descriptionVi: "Tím chàm Google Material 3 tiêu chuẩn",
		descriptionEn: "Standard Google Material 3 indigo",
	},
	{
		id: "crimson",
		nameVi: "Laser Crimson",
		nameEn: "Laser Crimson",
		hex: "#B71C1C",
		descriptionVi: "Đỏ Laser mạnh mẽ & đam mê",
		descriptionEn: "Bold high-energy laser crimson",
	},
];

export function SettingsPage() {
	const { language, setLanguage, t } = useLanguage();
	const { mode, setMode, sourceColor, setSourceColor } = useTheme();
	const [customHexInput, setCustomHexInput] = useState(sourceColor);
	const [hexError, setHexError] = useState<string | null>(null);

	const handleSelectColor = (hex: string) => {
		setSourceColor(hex);
		setCustomHexInput(hex);
		setHexError(null);
	};

	const handleCustomHexChange = (val: string) => {
		setCustomHexInput(val);
		if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
			setSourceColor(val);
			setHexError(null);
		} else if (val.length >= 7) {
			setHexError(
				language === "vi"
					? "Mã màu Hex phải có dạng #RRGGBB (ví dụ #795290)"
					: "Hex color must be in #RRGGBB format (e.g. #795290)",
			);
		} else {
			setHexError(null);
		}
	};

	const handleApplyCustomHex = () => {
		if (/^#[0-9A-Fa-f]{6}$/.test(customHexInput)) {
			handleSelectColor(customHexInput);
		} else {
			setHexError(
				language === "vi"
					? "Vui lòng nhập đúng định dạng mã màu #RRGGBB"
					: "Please enter a valid #RRGGBB hex color",
			);
		}
	};

	const isCurrentColor = (hex: string) => {
		return sourceColor.toLowerCase() === hex.toLowerCase();
	};

	return (
		<div
			className="flex flex-col gap-4 pb-12 w-full overflow-hidden"
			id="settings-page"
		>
			{/* Header Card */}
			<Card
				variant="filled"
				className="p-4 sm:p-5 bg-m3-surface-container-lowest"
			>
				<div className="flex items-center gap-3.5 min-w-0">
					<ShapeIcon
						shape="circle"
						morphTo="bun"
						aria-label="Settings icon"
						className="shrink-0 bg-m3-surface-container"
					>
						<Icon name="settings" className="text-m3-on-surface" size={24} />
					</ShapeIcon>
					<div>
						<Text
							variant="headline-sm"
							className="font-bold text-m3-on-surface"
						>
							{t("settings_title")}
						</Text>
						<Text
							variant="body-sm"
							className="text-m3-on-surface-variant mt-0.5"
						>
							{t("settings_subtitle")}
						</Text>
					</div>
				</div>
			</Card>

			{/* SECTION 1: LANGUAGE (i18n) */}
			<Card
				variant="filled"
				className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest"
			>
				<div className="flex items-center gap-2.5">
					<Icon name="translate" className="text-m3-primary" size={24} />
					<div>
						<Text
							variant="title-md"
							className="font-semibold text-m3-on-surface"
						>
							{t("settings_language_title")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("settings_language_desc")}
						</Text>
					</div>
				</div>

				<ButtonGroup size="sm" variant="connected" fullWidth>
					<Button
						size="sm"
						onClick={() => setLanguage("vi")}
						variant="toggle"
						selected={language === "vi"}
					>
						{t("settings_lang_vi")}
					</Button>
					<Button
						size="sm"
						onClick={() => setLanguage("en")}
						variant="toggle"
						selected={language === "en"}
					>
						{t("settings_lang_en")}
					</Button>
				</ButtonGroup>
			</Card>

			{/* SECTION 2: THEME MODE (Dark / Light / System) */}
			<Card
				variant="filled"
				className="p-4 sm:p-6 flex flex-col gap-5 bg-m3-surface-container-lowest"
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<Icon
							name="brightness_medium"
							className="text-m3-primary"
							size={24}
						/>
						<div>
							<Text
								variant="title-md"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_theme_title")}
							</Text>
							<Text variant="body-sm" className="text-m3-on-surface-variant">
								{t("settings_theme_desc")}
							</Text>
						</div>
					</div>
				</div>

				<ButtonGroup size="sm" variant="connected" fullWidth>
					<Button
						size="sm"
						variant="toggle"
						selected={mode === "light"}
						onClick={() => setMode("light")}
						className="w-full"
					>
						<Icon
							name="light_mode"
							size={20}
							animateFill
							fill={mode === "light" ? 1 : 0}
						/>
						{t("settings_theme_light")}
					</Button>

					<Button
						size="sm"
						variant="toggle"
						selected={mode === "dark"}
						onClick={() => setMode("dark")}
						className="w-full"
					>
						<Icon
							name="dark_mode"
							size={20}
							animateFill
							fill={mode === "dark" ? 1 : 0}
						/>
						{t("settings_theme_dark")}
					</Button>

					<Button
						size="sm"
						variant="toggle"
						selected={mode === "system"}
						onClick={() => setMode("system")}
						className="w-full"
					>
						<Icon
							name="contrast"
							size={20}
							animateFill
							fill={mode === "system" ? 1 : 0}
						/>
						{t("settings_theme_system")}
					</Button>
				</ButtonGroup>
			</Card>

			{/* SECTION 3: COLOR PALETTE */}
			<Card
				variant="filled"
				className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest"
			>
				<div className="flex items-center gap-2.5">
					<Icon name="palette" className="text-m3-primary" size={24} />
					<div>
						<Text
							variant="title-md"
							className="font-semibold text-m3-on-surface"
						>
							{t("settings_palette_title")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("settings_palette_desc")}
						</Text>
					</div>
				</div>

				{/* Presets Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{COLOR_PRESETS.map((preset) => {
						const isSelected = isCurrentColor(preset.hex);
						return (
							<Card
								key={preset.id}
								variant={isSelected ? "filled" : "outlined"}
								interactive
								morphRadius={{ rest: 12, hover: 16, pressed: 16 }}
								disableElevation
								onClick={() => handleSelectColor(preset.hex)}
								className={`flex items-center gap-3 p-3.5 text-left cursor-pointer ${
									isSelected
										? "bg-m3-primary-container/30"
										: "bg-m3-transparent"
								}`}
							>
								{/* Color Swatch */}
								<div
									className="size-10 rounded-full shrink-0 flex items-center justify-center"
									style={{ backgroundColor: preset.hex }}
								>
									{isSelected && (
										<Icon name="check" size={18} className="text-white" />
									)}
								</div>

								<div className="min-w-0 flex-1">
									<Text
										variant="label-lg"
										className="font-semibold text-m3-on-surface truncate block"
									>
										{language === "vi" ? preset.nameVi : preset.nameEn}
									</Text>
									<Text
										variant="label-sm"
										className="text-m3-on-surface-variant font-mono text-[11px] block mt-0.5"
									>
										{preset.hex.toUpperCase()}
									</Text>
								</div>
							</Card>
						);
					})}
				</div>

				{/* Custom Color Input Card */}
				<Card
					variant="filled"
					className="p-4 sm:p-5 rounded-xl bg-m3-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4"
				>
					<div className="flex items-center gap-3.5 min-w-0">
						<div className="relative w-11 h-11 rounded-xl overflow-hidden border border-m3-outline-variant/60 shadow-xs shrink-0 bg-m3-surface flex items-center justify-center">
							<input
								type="color"
								value={sourceColor}
								onChange={(e) => handleSelectColor(e.target.value)}
								className="w-16 h-16 -m-2.5 cursor-pointer border-0 p-0 bg-transparent"
								title="Pick custom color"
							/>
						</div>
						<div>
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_palette_custom")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant text-xs mt-0.5"
							>
								{t("settings_palette_custom_desc")}
							</Text>
						</div>
					</div>

					<div className="flex items-center gap-2.5 shrink-0">
						<div className="w-36">
							<TextField
								dense
								variant="outlined"
								label="HEX"
								value={customHexInput}
								onChange={handleCustomHexChange}
								placeholder="#795290"
								error={!!hexError}
								errorText={hexError || undefined}
								className="font-mono uppercase text-sm"
							/>
						</div>
						<Button
							colorStyle="tonal"
							onClick={handleApplyCustomHex}
							icon={<Icon name="check" size={16} />}
							className="text-xs shrink-0"
						>
							OK
						</Button>
					</div>
				</Card>
			</Card>

			{/* SECTION 4: ABOUT APP & ARCHITECTURE */}
			<Card
				variant="filled"
				className="p-4 sm:p-6 flex flex-col gap-5 bg-m3-surface-container-lowest"
			>
				<div className="flex items-center gap-3.5">
					<AppLogo size={40} interactive />
					<div>
						<Text
							variant="title-md"
							className="font-semibold text-m3-on-surface"
						>
							{t("settings_about_title")}
						</Text>
						<Text variant="body-sm" className="text-m3-on-surface-variant">
							{t("settings_about_desc")}
						</Text>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
					<Card
						variant="outlined"
						className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
					>
						<Icon
							name="high_quality"
							className="text-m3-primary shrink-0 mt-0.5"
							size={22}
						/>
						<div className="flex flex-col gap-1">
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_about_feature1_title")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant leading-relaxed"
							>
								{t("settings_about_feature1_desc")}
							</Text>
						</div>
					</Card>

					<Card
						variant="outlined"
						className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
					>
						<Icon
							name="audio_file"
							className="text-m3-primary shrink-0 mt-0.5"
							size={22}
						/>
						<div className="flex flex-col gap-1">
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_about_feature2_title")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant leading-relaxed"
							>
								{t("settings_about_feature2_desc")}
							</Text>
						</div>
					</Card>

					<Card
						variant="outlined"
						className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
					>
						<Icon
							name="tune"
							className="text-m3-primary shrink-0 mt-0.5"
							size={22}
						/>
						<div className="flex flex-col gap-1">
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_about_feature3_title")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant leading-relaxed"
							>
								{t("settings_about_feature3_desc")}
							</Text>
						</div>
					</Card>

					<Card
						variant="outlined"
						className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
					>
						<Icon
							name="security"
							className="text-m3-primary shrink-0 mt-0.5"
							size={22}
						/>
						<div className="flex flex-col gap-1">
							<Text
								variant="title-sm"
								className="font-semibold text-m3-on-surface"
							>
								{t("settings_about_feature4_title")}
							</Text>
							<Text
								variant="body-sm"
								className="text-m3-on-surface-variant leading-relaxed"
							>
								{t("settings_about_feature4_desc")}
							</Text>
						</div>
					</Card>
				</div>
			</Card>
		</div>
	);
}
