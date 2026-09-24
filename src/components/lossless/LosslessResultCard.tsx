import { Card, Divider, Icon, IconButton, Text } from "@bug-on/m3-expressive";
import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { QualityResult } from "../../types";

interface LosslessResultCardProps {
	result: QualityResult;
}

export function LosslessResultCard({ result }: LosslessResultCardProps) {
	const { t, language } = useLanguage();
	const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

	return (
		<div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
			{/* Verification Result Banner */}
			<Card
				variant="filled"
				className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors ${
					result.isUpscaled
						? "bg-m3-error-container/40 border-m3-error/40 text-m3-on-error-container"
						: result.isRealLossless
							? "bg-m3-primary-container/30 border-m3-primary/30 text-m3-on-surface"
							: result.score > 60
								? "bg-m3-tertiary-container/30 border-m3-tertiary/30 text-m3-on-surface"
								: "bg-m3-error-container/40 border-m3-error/30 text-m3-on-error-container"
				}`}
			>
				<div className="flex gap-4 items-start sm:items-center">
					<div
						className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
							result.isUpscaled
								? "bg-m3-error text-m3-on-error"
								: result.isRealLossless
									? "bg-m3-primary text-m3-on-primary"
									: result.score > 60
										? "bg-m3-tertiary text-m3-on-tertiary"
										: "bg-m3-error text-m3-on-error"
						}`}
					>
						{result.isUpscaled ? (
							<Icon name="gpp_bad" size={28} />
						) : result.isRealLossless ? (
							<Icon name="verified_user" size={28} />
						) : result.score > 60 ? (
							<Icon name="warning" size={28} />
						) : (
							<Icon name="gpp_bad" size={28} />
						)}
					</div>

					<div>
						<div className="flex items-center gap-2.5 flex-wrap">
							<Text variant="title-lg" className="font-bold text-m3-on-surface">
								{result.isUpscaled
									? language === "vi"
										? "Giả Lập Hi-Res (Upscaled từ 16-bit)"
										: "Fake Hi-Res (Upscaled 16-bit)"
									: result.isRealLossless
										? t("lossless_result_true")
										: result.score > 60
											? language === "vi"
												? "Chất Lượng Cao (Giới Hạn)"
												: "High Quality (Transcoded)"
											: t("lossless_result_fake")}
							</Text>
							<span
								className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
									result.isUpscaled
										? "bg-m3-error-container text-m3-error border-m3-error/40"
										: result.isRealLossless
											? "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/40"
											: result.score > 60
												? "bg-m3-tertiary-container text-m3-tertiary border-m3-tertiary/40"
												: "bg-m3-error-container text-m3-error border-m3-error/40"
								}`}
							>
								{language === "vi" ? "Độ tin cậy" : "Confidence"}:{" "}
								{result.score}%
							</span>
							{result.isUpscaled && (
								<span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border bg-m3-error-container text-m3-error border-m3-error/40 flex items-center gap-1">
									<Icon name="warning" size={14} />
									{t("lossless_upscaled_badge")}
								</span>
							)}
						</div>
						<Text
							variant="body-md"
							className="text-m3-on-surface-variant mt-1.5 leading-relaxed"
						>
							{result.isUpscaled
								? language === "vi"
									? "Tệp âm thanh khai báo định dạng 24-bit hoặc Hi-Res nhưng phân tích lưới lượng tử hóa thực tế cho thấy dữ liệu âm thanh chỉ khớp trên lưới 16-bit PCM (bị phóng đại/upscaled giả mạo)."
									: "Audio claims 24-bit / Hi-Res status, but quantization grid analysis confirms it matches a 16-bit PCM grid (artificially upscaled)."
								: result.isRealLossless
									? language === "vi"
										? "Phổ âm thanh trải rộng liên tục lên trên 20 kHz. Tệp này nguyên gốc phòng thu đạt chuẩn CD/Hi-Res chất lượng tốt."
										: "Full spectral energy seamlessly extends past 20 kHz. Authentic CD/studio master quality."
									: result.score > 60
										? language === "vi"
											? "Dải cao bị suy hao hoặc có hiện tượng chặn nhẹ ở 18-19 kHz. Đây có thể là nhạc 320kbps upscaled lên."
											: "High band rolls off near 18-19 kHz. Likely high-bitrate MP3/AAC transcode."
										: language === "vi"
											? "Tần số cao bị cắt phăng đột ngột ở ngưỡng dưới 16 kHz. Đây chắc chắn là tệp MP3 chất lượng thấp bị giả mạo FLAC/WAV."
											: "High frequencies abruptly cut off below 16 kHz. Low-bitrate MP3 disguised as FLAC/WAV."}
						</Text>
					</div>
				</div>
			</Card>

			{/* Scientific details cards (6 metrics) */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{t("lossless_cutoff_label")}
					</Text>
					<Text
						variant="title-md"
						className="font-bold text-m3-primary mt-1 font-mono"
					>
						{(result.cutoffFrequency / 1000).toFixed(2)} kHz
					</Text>
				</Card>

				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{t("lossless_bit_depth_label")}
					</Text>
					<div className="flex items-center gap-1 mt-1">
						<Text
							variant="title-md"
							className={`font-bold font-mono ${result.isUpscaled ? "text-m3-error" : "text-m3-primary"}`}
						>
							{result.effectiveBitDepth}-bit
						</Text>
						{result.isUpscaled && (
							<span className="text-[10px] text-m3-error font-semibold">
								(Fake)
							</span>
						)}
					</div>
				</Card>

				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{t("lossless_texture_label")}
					</Text>
					<Text
						variant="title-md"
						className="font-bold text-m3-tertiary mt-1 font-mono"
					>
						{result.highFreqTexture} dB
					</Text>
				</Card>

				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{t("lossless_high_power")}
					</Text>
					<Text
						variant="title-md"
						className="font-bold text-m3-secondary mt-1 font-mono"
					>
						{result.avgPowerHigh} dB
					</Text>
				</Card>

				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{t("lossless_mid_power")}
					</Text>
					<Text
						variant="title-md"
						className="font-bold text-m3-secondary mt-1 font-mono"
					>
						{result.avgPowerMid} dB
					</Text>
				</Card>

				<Card
					variant="filled"
					className="p-3.5 bg-m3-surface-container-low rounded-xl border border-m3-outline-variant/30 flex flex-col items-center justify-center"
				>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant font-medium line-clamp-1 text-xs"
					>
						{language === "vi" ? "Độ suy hao dải cao" : "High Band Delta"}
					</Text>
					<Text
						variant="title-md"
						className="font-bold text-m3-tertiary mt-1 font-mono"
					>
						{Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB
					</Text>
				</Card>
			</div>

			{/* Multi-Factor Score Breakdown */}
			<Card
				variant="outlined"
				className="p-4 bg-m3-surface-container-low/40 rounded-2xl border-m3-outline-variant/40 flex flex-col gap-3"
			>
				{/* biome-ignore lint/a11y/useSemanticElements: interactive card header containing toggle button */}
				<div
					role="button"
					tabIndex={0}
					className="flex items-center justify-between cursor-pointer select-none"
					onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setShowScoreBreakdown(!showScoreBreakdown);
						}
					}}
				>
					<div className="flex items-center gap-2">
						<Icon name="tune" className="text-m3-primary" size={20} />
						<Text
							variant="title-sm"
							className="font-semibold text-m3-on-surface"
						>
							{t("lossless_score_breakdown")}
						</Text>
						<span className="text-xs px-2 py-0.5 rounded-full font-mono bg-m3-primary-container text-m3-on-primary-container font-semibold">
							{result.score}/100
						</span>
					</div>
					<IconButton
						colorStyle="standard"
						size="sm"
						aria-label="Toggle breakdown"
						onClick={(e) => {
							e.stopPropagation();
							setShowScoreBreakdown(!showScoreBreakdown);
						}}
					>
						<Icon
							name={showScoreBreakdown ? "expand_less" : "expand_more"}
							size={20}
						/>
					</IconButton>
				</div>

				{showScoreBreakdown && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-m3-outline-variant/20">
						<div className="flex flex-col gap-1 p-2.5 rounded-xl bg-m3-surface-container-lowest/60 border border-m3-outline-variant/20">
							<div className="flex justify-between text-xs">
								<span className="text-m3-on-surface-variant">
									Tần số cắt (35%)
								</span>
								<span className="font-mono font-semibold text-m3-primary">
									{result.scoreBreakdown.cutoffScore}/100
								</span>
							</div>
							<div className="w-full bg-m3-surface-container-highest rounded-full h-1.5 overflow-hidden">
								<div
									className="bg-m3-primary h-full rounded-full"
									style={{
										width: `${result.scoreBreakdown.cutoffScore}%`,
									}}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1 p-2.5 rounded-xl bg-m3-surface-container-lowest/60 border border-m3-outline-variant/20">
							<div className="flex justify-between text-xs">
								<span className="text-m3-on-surface-variant">
									Độ gợn HF (25%)
								</span>
								<span className="font-mono font-semibold text-m3-tertiary">
									{result.scoreBreakdown.textureScore}/100
								</span>
							</div>
							<div className="w-full bg-m3-surface-container-highest rounded-full h-1.5 overflow-hidden">
								<div
									className="bg-m3-tertiary h-full rounded-full"
									style={{
										width: `${result.scoreBreakdown.textureScore}%`,
									}}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1 p-2.5 rounded-xl bg-m3-surface-container-lowest/60 border border-m3-outline-variant/20">
							<div className="flex justify-between text-xs">
								<span className="text-m3-on-surface-variant">
									Độ sâu bit (20%)
								</span>
								<span className="font-mono font-semibold text-m3-secondary">
									{result.scoreBreakdown.bitDepthScore}/100
								</span>
							</div>
							<div className="w-full bg-m3-surface-container-highest rounded-full h-1.5 overflow-hidden">
								<div
									className="bg-m3-secondary h-full rounded-full"
									style={{
										width: `${result.scoreBreakdown.bitDepthScore}%`,
									}}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1 p-2.5 rounded-xl bg-m3-surface-container-lowest/60 border border-m3-outline-variant/20">
							<div className="flex justify-between text-xs">
								<span className="text-m3-on-surface-variant">
									Suy hao dải cao (15%)
								</span>
								<span className="font-mono font-semibold text-m3-primary">
									{result.scoreBreakdown.powerLossScore}/100
								</span>
							</div>
							<div className="w-full bg-m3-surface-container-highest rounded-full h-1.5 overflow-hidden">
								<div
									className="bg-m3-primary h-full rounded-full"
									style={{
										width: `${result.scoreBreakdown.powerLossScore}%`,
									}}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1 p-2.5 rounded-xl bg-m3-surface-container-lowest/60 border border-m3-outline-variant/20">
							<div className="flex justify-between text-xs">
								<span className="text-m3-on-surface-variant">
									Tần số mẫu (5%)
								</span>
								<span className="font-mono font-semibold text-m3-secondary">
									{result.scoreBreakdown.sampleRateBonus}/100
								</span>
							</div>
							<div className="w-full bg-m3-surface-container-highest rounded-full h-1.5 overflow-hidden">
								<div
									className="bg-m3-secondary h-full rounded-full"
									style={{
										width: `${result.scoreBreakdown.sampleRateBonus}%`,
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</Card>

			<Divider shape="wavy" />

			{/* Detailed scientific explanation card */}
			<Card
				variant="filled"
				className="flex items-start gap-3.5 bg-m3-surface-container-high/50 p-4.5 rounded-xl border border-m3-outline-variant/30"
			>
				<div className="w-8 h-8 rounded-lg bg-m3-primary-container flex items-center justify-center text-m3-on-primary-container shrink-0 mt-0.5">
					<Icon name="auto_awesome" size={20} />
				</div>
				<div>
					<Text variant="title-sm" className="font-semibold text-m3-on-surface">
						{language === "vi" ? "Nhận định chuyên gia" : "Acoustic Diagnosis"}
					</Text>
					<Text
						variant="body-sm"
						className="text-m3-on-surface-variant mt-1 leading-relaxed"
					>
						{language === "vi"
							? `Đoạn âm thanh thử nghiệm cho thấy biên độ dải cao (${result.avgPowerHigh} dB) lệch so với dải trung (${result.avgPowerMid} dB) là ${Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB. Tần số cắt xác định tại ${(result.cutoffFrequency / 1000).toFixed(2)} kHz, độ sâu bit lượng tử đạt ${result.effectiveBitDepth}-bit.`
							: `Analysis shows high frequency band power (${result.avgPowerHigh} dB) deviates from mid-range (${result.avgPowerMid} dB) by ${Math.abs(result.avgPowerMid - result.avgPowerHigh)} dB. Cutoff frequency identified at ${(result.cutoffFrequency / 1000).toFixed(2)} kHz with ${result.effectiveBitDepth}-bit effective PCM quantization.`}
						{result.isUpscaled
							? language === "vi"
								? " Tệp vi phạm chuẩn chất lượng do upscaled từ nguồn 16-bit nhằm giả tạo bản ghi Hi-Res."
								: " Track violates quality integrity by upscaling 16-bit audio into a fake Hi-Res package."
							: result.isRealLossless
								? language === "vi"
									? " Mức chênh lệch này hoàn toàn nằm trong tiêu chuẩn tuyến tính tự nhiên của tệp nén không hao hụt (Lossless gốc)."
									: " This delta falls squarely within the natural logarithmic spectral decay of genuine uncompressed studio audio."
								: language === "vi"
									? " Sự suy hao đột ngột ở ngưỡng tần số này chỉ ra rằng tệp đã đi qua bộ nén khử dữ liệu (lossy encoder) trước khi được đóng gói lại."
									: " The steep shelf cutoff indicates the track underwent lossy perceptual encoding before being up-converted."}
					</Text>
				</div>
			</Card>
		</div>
	);
}
