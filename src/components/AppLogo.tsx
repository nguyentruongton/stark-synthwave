import { ShapeMedia } from "@bug-on/m3-expressive";
import { useId } from "react";
import { cn } from "../utils/cn";

export type AppLogoVariant = "full" | "adaptive" | "transparent";

export interface AppLogoProps {
	className?: string;
	size?: number;
	variant?: AppLogoVariant;
	/** Custom background color or CSS variable override when in adaptive mode */
	adaptiveBgColor?: string;
	interactive?: boolean;
	onClick?: () => void;
	title?: string;
}

/**
 * Stark Synthwave Brand Logo Component
 *
 * Implements the official Synthwave Lossless Checker iconography:
 * - Retro-futuristic Synthwave Sun & Perspective Grid
 * - Dual neon-beamed musical notes with rainbow gradient
 * - Lossless verified checkmark shield badge
 *
 * Supports 3 MD3 Expressive variants:
 * - "full" (default): Rich cosmic Synthwave squircle background (#12062C -> #231052 -> #09031B)
 * - "adaptive": Dynamic background using Material Design 3 container tokens or custom theme color
 * - "transparent": Pure NoBG mode for seamless overlay on custom UI containers and surfaces
 */
export function AppLogo({
	className,
	size = 36,
	variant = "full",
	adaptiveBgColor,
	interactive = false,
	onClick,
	title = "Stark Synthwave",
}: AppLogoProps) {
	const rawId = useId();
	const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

	const svgContent = (
		<svg
			width={size}
			height={size}
			viewBox="0 0 720 720"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				"w-full h-full drop-shadow-sm transition-transform duration-200",
				interactive && "group-hover:scale-105",
			)}
		>
			<defs>
				{/* Synthwave Signature Cosmic Squircle Background */}
				{/* <linearGradient
					id={`${uid}-bg-synthwave`}
					x1="112"
					y1="88"
					x2="608"
					y2="632"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#12062C" />
					<stop offset="0.52" stopColor="#231052" />
					<stop offset="1" stopColor="#09031B" />
				</linearGradient> */}

				{/* MD3 Expressive Adaptive Gradient */}
				<linearGradient
					id={`${uid}-bg-adaptive`}
					x1="112"
					y1="88"
					x2="608"
					y2="632"
					gradientUnits="userSpaceOnUse"
				>
					<stop
						stopColor="var(--md-sys-color-surface-container-high, #1E1A24)"
						stopOpacity="0.95"
					/>
					<stop
						offset="0.52"
						stopColor="var(--md-sys-color-surface-container, #16121C)"
						stopOpacity="0.9"
					/>
					<stop
						offset="1"
						stopColor="var(--md-sys-color-surface-container-low, #0E0A14)"
						stopOpacity="0.95"
					/>
				</linearGradient>

				{/* Synthwave Sun Radial/Linear Gradient */}
				<linearGradient
					id={`${uid}-sun`}
					x1="485"
					y1="122"
					x2="485"
					y2="292"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#FFD15A" />
					<stop offset="0.45" stopColor="#FF6F91" />
					<stop offset="1" stopColor="#D83BFF" />
				</linearGradient>

				{/* Neon Waveform Beamed Note Gradient */}
				<linearGradient
					id={`${uid}-note-beam`}
					x1="220"
					y1="178"
					x2="544"
					y2="512"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#00F5FF" />
					<stop offset="0.42" stopColor="#6C5CFF" />
					<stop offset="0.73" stopColor="#E43CFF" />
					<stop offset="1" stopColor="#FF427F" />
				</linearGradient>

				{/* Left Note Head Gradient */}
				<linearGradient
					id={`${uid}-head-left`}
					x1="131.905"
					y1="207.791"
					x2="543.259"
					y2="425.323"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#00F5FF" />
					<stop offset="0.42" stopColor="#6C5CFF" />
					<stop offset="0.73" stopColor="#E43CFF" />
					<stop offset="1" stopColor="#FF427F" />
				</linearGradient>

				{/* Right Note Head Gradient */}
				<linearGradient
					id={`${uid}-head-right`}
					x1="155.306"
					y1="265.538"
					x2="566.66"
					y2="483.07"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#00F5FF" />
					<stop offset="0.42" stopColor="#6C5CFF" />
					<stop offset="0.73" stopColor="#E43CFF" />
					<stop offset="1" stopColor="#FF427F" />
				</linearGradient>

				{/* Lossless Verified Shield Ring Gradient */}
				<linearGradient
					id={`${uid}-shield-ring`}
					x1="170"
					y1="390"
					x2="360"
					y2="584"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#00F5FF" />
					<stop offset="0.48" stopColor="#7657FF" />
					<stop offset="1" stopColor="#FF3DA5" />
				</linearGradient>

				{/* Luminance Mask clipping grid and sun into squircle */}
				<mask
					id={`${uid}-squircle-mask`}
					style={{ maskType: "luminance" }}
					maskUnits="userSpaceOnUse"
					x="70"
					y="58"
					width="580"
					height="580"
				>
					<path
						d="M510 58H210C132.68 58 70 120.68 70 198V498C70 575.32 132.68 638 210 638H510C587.32 638 650 575.32 650 498V198C650 120.68 587.32 58 510 58Z"
						fill="white"
					/>
				</mask>
			</defs>

			{/* 1. Base Squircle Container (Full or Adaptive) */}
			{variant === "full" && (
				<path
					d="M510 58H210C132.68 58 70 120.68 70 198V498C70 575.32 132.68 638 210 638H510C587.32 638 650 575.32 650 498V198C650 120.68 587.32 58 510 58Z"
					fill={`url(#${uid}-bg-synthwave)`}
				/>
			)}
			{variant === "adaptive" && (
				<path
					d="M510 58H210C132.68 58 70 120.68 70 198V498C70 575.32 132.68 638 210 638H510C587.32 638 650 575.32 650 498V198C650 120.68 587.32 58 510 58Z"
					fill={adaptiveBgColor || `url(#${uid}-bg-adaptive)`}
				/>
			)}

			{/* 2. Synthwave Sun & Perspective Horizon Grid (Masked) */}
			<g mask={`url(#${uid}-squircle-mask)`}>
				<g opacity="0.42">
					{/* Rising Sun */}
					<path
						d="M500 284C550.81 284 592 242.81 592 192C592 141.19 550.81 100 500 100C449.19 100 408 141.19 408 192C408 242.81 449.19 284 500 284Z"
						fill={`url(#${uid}-sun)`}
					/>
					{/* Horizontal grid lines */}
					<path
						d="M82 495H638M96 530H624M116 564H604M144 596H576"
						stroke="#B342FF"
						strokeWidth="4"
					/>
					{/* Perspective vanishing grid lines */}
					<path
						d="M526 638L357 444L222 638M357 444L280 638M357 444L334 638M357 444L392 638M357 444L454 638"
						stroke="#2FE8FF"
						strokeWidth="3"
					/>
				</g>
			</g>

			{/* 3. Luminous Dual-Note Waveform Core */}
			{/* Beamed cross-bridge */}
			<path
				d="M321 230L515 182V410"
				stroke={`url(#${uid}-note-beam)`}
				strokeWidth="54"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Left stem */}
			<path
				d="M321 230V455"
				stroke={`url(#${uid}-note-beam)`}
				strokeWidth="54"
				strokeLinecap="round"
			/>
			{/* Left note head */}
			<path
				d="M289.159 529.966C330.129 516.654 354.764 479.462 344.182 446.897C333.601 414.331 291.811 398.723 250.841 412.034C209.871 425.346 185.236 462.538 195.818 495.103C206.399 527.669 248.189 543.277 289.159 529.966Z"
				fill={`url(#${uid}-head-left)`}
			/>
			{/* Right note head */}
			<path
				d="M483.159 484.966C524.129 471.654 548.764 434.462 538.182 401.897C527.601 369.331 485.811 353.723 444.841 367.034C403.871 380.346 379.236 417.538 389.818 450.103C400.399 482.669 442.189 498.277 483.159 484.966Z"
				fill={`url(#${uid}-head-right)`}
			/>
			{/* Note bridge cyan neon core sheen */}
			<path
				d="M322 230L514 183"
				stroke="#B8FBFF"
				strokeOpacity="0.72"
				strokeWidth="12"
				strokeLinecap="round"
			/>

			{/* 4. Lossless Quality Verified Checkmark Badge */}
			{/* Outer glowing ring */}
			<path
				d="M236 589C292.885 589 339 542.885 339 486C339 429.115 292.885 383 236 383C179.115 383 133 429.115 133 486C133 542.885 179.115 589 236 589Z"
				fill={`url(#${uid}-shield-ring)`}
				stroke="#16082F"
				strokeWidth="18"
			/>
			{/* Inner badge surface */}
			<path
				d="M236 559C276.317 559 309 526.317 309 486C309 445.683 276.317 413 236 413C195.683 413 163 445.683 163 486C163 526.317 195.683 559 236 559Z"
				fill="#13072D"
				fillOpacity="0.9"
			/>
			{/* Crisp white checkmark */}
			<path
				d="M194 486L224 516L282 452"
				stroke="white"
				strokeWidth="24"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* 5. Cyber Sparkle Accents */}
			<circle cx="548" cy="342" r="9" fill="#00F5FF" />
			<circle cx="575" cy="318" r="6" fill="#FF62C5" />
		</svg>
	);

	if (interactive) {
		return (
			<button
				type="button"
				className={cn(
					"relative inline-flex items-center justify-center shrink-0 select-none bg-transparent border-0 p-0 cursor-pointer",
					className,
				)}
				style={{ width: size, height: size }}
				onClick={onClick}
				title={title}
				aria-label={title}
			>
				<ShapeMedia
					className="bg-m3-primary-container"
					width={size}
					height={size}
					shape="cookie4Sided"
					morphOn="click"
					morphTo="cookie12Sided"
				>
					{svgContent}
				</ShapeMedia>
			</button>
		);
	}

	return (
		<div
			className={cn(
				"relative inline-flex items-center justify-center shrink-0 select-none",
				className,
			)}
			style={{ width: size, height: size }}
			title={title}
			role="img"
			aria-label={title}
		>
			<ShapeMedia
				width={size}
				height={size}
				shape="cookie4Sided"
				morphOn="click"
				morphTo="cookie12Sided"
			>
				{svgContent}
			</ShapeMedia>
		</div>
	);
}
