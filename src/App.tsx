/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from "react";
import {
  MD3ThemeProvider,
  SnackbarProvider,
  NavigationBar,
  NavigationBarItem,
  NavigationRail,
  NavigationRailItem,
  SmallAppBar,
  IconButton,
  Icon,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { MusicTrimMerge } from "./components/MusicTrimMerge";
import { LosslessChecker } from "./components/LosslessChecker";
import { TempoDetector } from "./components/TempoDetector";
import { ToneDetector } from "./components/ToneDetector";
import { SettingsPage } from "./components/SettingsPage";
import { AdaptiveScrollArea } from "./components/AdaptiveScrollArea";
import { AppLogo } from "./components/AppLogo";

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
    { id: "trim", path: "/trim", label: t("nav_trim"), iconName: "content_cut" },
    { id: "lossless", path: "/lossless", label: t("nav_lossless"), iconName: "verified" },
    { id: "tempo", path: "/tempo", label: t("nav_tempo"), iconName: "timer" },
    { id: "tone", path: "/tone", label: t("nav_tone"), iconName: "vpn_key" },
  ];

  // Match current active tab path
  const currentPath = location.pathname === "/" ? "/trim" : location.pathname;

  // Viewport reference for auto-scroll on tab change and App Bar scroll sync
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentPath]);

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
              size={36}
              interactive
              onClick={() => navigate("/trim")}
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
            >
              <Icon name="settings" size={24} />
            </IconButton>
          }
          scrollElement={scrollViewportRef}
          scrollBehavior="pinned"
          enableFadingBlur={true}
        />
      </div>

      {/* Desktop Navigation Rail: Web logo on top, navigation items, Settings icon button at bottom */}
      <aside className="hidden md:flex shrink-0 h-screen sticky top-0 border-r border-m3-outline-variant/30 z-30">
        <NavigationRail
          variant="collapsed"
          header={
            <div className="flex flex-col items-center justify-center pt-2 pb-1">
              <AppLogo
                size={40}
                interactive
                onClick={() => navigate("/trim")}
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
        type="auto"
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
                  <Routes location={location}>
                    <Route path="/" element={<Navigate to="/trim" replace />} />
                    <Route path="/trim" element={<MusicTrimMerge />} />
                    <Route path="/lossless" element={<LosslessChecker />} />
                    <Route path="/tempo" element={<TempoDetector />} />
                    <Route path="/tone" element={<ToneDetector />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/trim" replace />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </AdaptiveScrollArea>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <NavigationBar variant="flexible">
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

export default function App() {
  return (
    <MD3ThemeProvider
      defaultMode="dark"
      sourceColor="#795290"
      variant="expressive"
      persistToLocalStorage={true}
    >
      <LanguageProvider>
        <SnackbarProvider>
          <HashRouter>
            <NavigationLayout />
          </HashRouter>
        </SnackbarProvider>
      </LanguageProvider>
    </MD3ThemeProvider>
  );
}
