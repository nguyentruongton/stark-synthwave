import {
	Icon,
	IconButton,
	MD3ThemeProvider,
	NavigationBar,
	NavigationBarItem,
	NavigationRail,
	NavigationRailItem,
	SmallAppBar,
	SnackbarProvider,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useRef } from "react";
import {
	BrowserRouter,
	Navigate,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { AdaptiveScrollArea } from "./components/AdaptiveScrollArea";
import { AppLogo } from "./components/AppLogo";
import { RouteLoadingFallback } from "./components/RouteLoadingFallback";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";

const LosslessChecker = lazy(() =>
	import("./components/LosslessChecker").then((m) => ({
		default: m.LosslessChecker,
	})),
);
const MetadataEditor = lazy(() =>
	import("./components/MetadataEditor").then((m) => ({
		default: m.MetadataEditor,
	})),
);
const MusicTrimMerge = lazy(() =>
	import("./components/MusicTrimMerge").then((m) => ({
		default: m.MusicTrimMerge,
	})),
);
const TempoDetector = lazy(() =>
	import("./components/TempoDetector").then((m) => ({
		default: m.TempoDetector,
	})),
);
const ToneDetector = lazy(() =>
	import("./components/ToneDetector").then((m) => ({
		default: m.ToneDetector,
	})),
);
const SettingsPage = lazy(() =>
	import("./components/SettingsPage").then((m) => ({
		default: m.SettingsPage,
	})),
);

interface NavigationTab {
	id: string;
	path: string;
	label: string;
	iconName: string;
}

function NavigationLayout() {
	const { t } = useLanguage();
	const location = useLocation();
	const navigate = useNavigate();

	// Navigation tabs (without Settings as it is moved to App Bar & Rail)
	const tabs: NavigationTab[] = [
		{
			id: "lossless",
			path: "/lossless",
			label: t("nav_lossless"),
			iconName: "verified",
		},
		{
			id: "metadata",
			path: "/metadata",
			label: t("nav_metadata"),
			iconName: "sell",
		},
		{
			id: "trim",
			path: "/trim",
			label: t("nav_trim"),
			iconName: "content_cut",
		},
		{ id: "tempo", path: "/tempo", label: t("nav_tempo"), iconName: "timer" },
		{ id: "tone", path: "/tone", label: t("nav_tone"), iconName: "vpn_key" },
	];

	// Match current active tab path
	const currentPath =
		location.pathname === "/" ? "/lossless" : location.pathname;

	// Viewport reference for auto-scroll on tab change and App Bar scroll sync
	const scrollViewportRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (scrollViewportRef.current) {
			scrollViewportRef.current.scrollTo({ top: 0, behavior: "instant" });
		}
	}, []);

	return (
		<div
			className="flex flex-col h-screen md:flex-row overflow-x-hidden bg-m3-background text-m3-on-background transition-colors duration-200 font-md3-expressive"
			id="app-root"
		>
			{/* Mobile Top App Bar (hidden on desktop) */}
			<div className="md:hidden">
				<SmallAppBar
					title="Stark Synthwave"
					titleAlignment="center"
					navigationIcon={
						<AppLogo
							size={40}
							interactive
							onClick={() => navigate("/lossless")}
							title="Stark Synthwave"
							className="ml-1"
						/>
					}
					actions={
						<IconButton
							aria-label={t("nav_settings")}
							colorStyle={currentPath === "/settings" ? "tonal" : "standard"}
							onClick={() => navigate("/settings")}
							className="mr-1"
							size="sm"
						>
							<Icon name="settings" size={20} />
						</IconButton>
					}
					scrollElement={scrollViewportRef}
					scrollBehavior="pinned"
					enableFadingBlur
				/>
			</div>

			{/* Desktop Navigation Rail: Web logo on top, navigation items, Settings icon button at bottom */}
			<aside className="hidden md:flex shrink-0 h-screen sticky top-0 z-30">
				<NavigationRail
					alignment="center"
					variant="collapsed"
					header={
						<div className="flex flex-col items-center justify-center pt-2 pb-1">
							<AppLogo
								size={48}
								interactive
								onClick={() => navigate("/lossless")}
								title="Stark Synthwave"
							/>
						</div>
					}
					footer={
						<div className="flex flex-col items-center justify-center pb-3">
							<IconButton
								aria-label={t("nav_settings")}
								colorStyle={currentPath === "/settings" ? "tonal" : "standard"}
								onClick={() => navigate("/settings")}
								className="transition-colors"
								title={t("nav_settings")}
								size="md"
							>
								<Icon name="settings" size={24} />
							</IconButton>
						</div>
					}
				>
					{tabs.map((tab) => (
						<NavigationRailItem
							key={tab.id}
							label={tab.label}
							icon={<Icon name={tab.iconName} />}
							selected={currentPath === tab.path}
							onClick={() => navigate(tab.path)}
						/>
					))}
				</NavigationRail>
			</aside>

			{/* Main Content Area with Adaptive M3 Expressive ScrollArea (Desktop) / Native Scroll (Mobile) */}
			<AdaptiveScrollArea
				className="flex-1 h-screen bg-m3-background text-m3-on-background transition-colors duration-200 min-h-0"
				viewportRef={scrollViewportRef}
				orientation="vertical"
				type="scroll"
				id="main-scroll-area"
			>
				<div className="w-full min-h-full pt-16 md:pt-0 pb-28 md:pb-12 min-w-0 flex flex-col">
					{/* Main Workspace */}
					<main className="w-full max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-5 min-w-0">
						<div className="relative w-full">
							<AnimatePresence mode="wait">
								<motion.div
									key={currentPath}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
									className="w-full"
								>
									<Suspense fallback={<RouteLoadingFallback />}>
										<Routes location={location}>
											<Route
												path="/"
												element={<Navigate to="/lossless" replace />}
											/>
											<Route path="/lossless" element={<LosslessChecker />} />
											<Route path="/metadata" element={<MetadataEditor />} />
											<Route path="/trim" element={<MusicTrimMerge />} />
											<Route path="/tempo" element={<TempoDetector />} />
											<Route path="/tone" element={<ToneDetector />} />
											<Route path="/settings" element={<SettingsPage />} />
											<Route
												path="*"
												element={<Navigate to="/lossless" replace />}
											/>
										</Routes>
									</Suspense>
								</motion.div>
							</AnimatePresence>
						</div>
					</main>
				</div>
			</AdaptiveScrollArea>

			{/* Mobile Navigation Bar */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
				<NavigationBar
					variant="xr"
					className="backdrop-blur-xs bg-m3-surface/50 border-m3-outline/25 border px-2"
					itemLayout="vertical"
				>
					{tabs.map((tab) => (
						<NavigationBarItem
							key={tab.id}
							label={tab.label}
							icon={<Icon name={tab.iconName} size={20} />}
							selected={currentPath === tab.path}
							onClick={() => navigate(tab.path)}
						/>
					))}
				</NavigationBar>
			</div>
		</div>
	);
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
	return (
		<MD3ThemeProvider
			defaultMode="system"
			sourceColor="#795290"
			variant="expressive"
			persistToLocalStorage={true}
		>
			<LanguageProvider>
				<SnackbarProvider>
					<BrowserRouter basename={routerBasename}>
						<NavigationLayout />
					</BrowserRouter>
				</SnackbarProvider>
			</LanguageProvider>
		</MD3ThemeProvider>
	);
}
