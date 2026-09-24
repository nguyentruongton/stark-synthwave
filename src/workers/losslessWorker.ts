import { analyzeLosslessQuality } from "../utils/audioAnalysis";

self.onmessage = (e: MessageEvent) => {
	try {
		const { channelData, sampleRate, duration, claimedBitDepth } = e.data;

		if (!channelData || !sampleRate) {
			throw new Error("Dữ liệu âm thanh không hợp lệ truyền vào Web Worker.");
		}

		const result = analyzeLosslessQuality(
			{ channelData, sampleRate, duration },
			claimedBitDepth,
			(percent: number) => {
				self.postMessage({ type: "progress", percent });
			},
		);

		self.postMessage({ type: "done", result });
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Lỗi xử lý phổ trong Web Worker";
		self.postMessage({
			type: "error",
			error: message,
		});
	}
};
