import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
	return {
		base: "/stark-synthwave/",
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "."),
			},
		},
		optimizeDeps: {
			include: ["react", "react-dom", "react/jsx-runtime", "motion/react"],
		},
		build: {
			target: "es2022",
			cssCodeSplit: true,
			chunkSizeWarningLimit: 600,
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("node_modules")) {
							if (
								id.includes("react-router-dom") ||
								id.includes("react-router") ||
								id.includes("/react/") ||
								id.includes("/react-dom/")
							) {
								return "vendor-react";
							}
							if (id.includes("motion") || id.includes("framer-motion")) {
								return "vendor-motion";
							}
							if (id.includes("@material/material-color-utilities")) {
								return "vendor-color-utils";
							}
							if (
								id.includes("@bug-on/m3-expressive") ||
								id.includes("@bug-on/m3-tokens")
							) {
								return "vendor-m3";
							}
							if (id.includes("mp3tag.js")) {
								return "vendor-metadata";
							}
							if (id.includes("@breezystack/lamejs")) {
								return "vendor-encoder";
							}
						}
					},
				},
			},
		},
		server: {
			// HMR is disabled in AI Studio via DISABLE_HMR env var.
			// Do not modifyâfile watching is disabled to prevent flickering during agent edits.
			hmr: process.env.DISABLE_HMR !== "true",
			// Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
			watch: process.env.DISABLE_HMR === "true" ? null : {},
		},
	};
});
