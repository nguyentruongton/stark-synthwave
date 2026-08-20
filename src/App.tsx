/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  MD3ThemeProvider,
  SnackbarProvider,
  NavigationBar,
  NavigationBarItem,
  NavigationRail,
  NavigationRailItem,
  Icon,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";

import { MusicTrimMerge } from "./components/MusicTrimMerge";
import { LosslessChecker } from "./components/LosslessChecker";
import { TempoDetector } from "./components/TempoDetector";
import { ToneDetector } from "./components/ToneDetector";

type TabId = "trim" | "lossless" | "tempo" | "tone";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("trim");

  const tabs = [
    { id: "trim", label: "Cắt Ghép", iconName: "content_cut" },
    { id: "lossless", label: "Lossless", iconName: "verified" },
    { id: "tempo", label: "Tempo", iconName: "timer" },
    { id: "tone", label: "Dò Tone", iconName: "vpn_key" },
  ] as const;

  return (
    <MD3ThemeProvider defaultMode="dark">
      <SnackbarProvider>
        <div className="flex flex-col h-screen md:flex-row overflow-x-hidden bg-[#0A0B0D]" id="app-root">

          <aside className="hidden md:flex shrink-0 h-screen sticky top-0 border-r border-m3-outline/20">
            <NavigationRail variant="collapsed">
              {tabs.map((tab) => (
                <NavigationRailItem
                  key={tab.id}
                  label={tab.label}
                  icon={<Icon name={tab.iconName} />}
                  selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </NavigationRail>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden bg-[#0A0B0D]">
            <div className="flex flex-col min-h-full pb-20 md:pb-0 min-w-0 w-full">
              {/* Main Workspace */}
              <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-5 min-w-0 overflow-hidden">


                <div className="relative flex-1 min-h-100 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full overflow-hidden"
                    >
                      {activeTab === "trim" && <MusicTrimMerge />}
                      {activeTab === "lossless" && <LosslessChecker />}
                      {activeTab === "tempo" && <TempoDetector />}
                      {activeTab === "tone" && <ToneDetector />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <NavigationBar variant="flexible" >
              {tabs.map((tab) => (
                <NavigationBarItem
                  key={tab.id}
                  label={tab.label}
                  icon={<Icon name={tab.iconName} size={20} />}
                  selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </NavigationBar>
          </div>

        </div>
      </SnackbarProvider>
    </MD3ThemeProvider>
  );
}
