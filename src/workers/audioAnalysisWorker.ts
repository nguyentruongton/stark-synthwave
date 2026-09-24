import { detectBPM, detectKey } from "../utils/audioAnalysis";

self.onmessage = (e: MessageEvent) => {
	try {
		const { type, channelData, sampleRate } = e.data;
		if (!channelData || !sampleRate) {
			throw new Error("Dữ liệu âm thanh không hợp lệ truyền vào Web Worker.");
		}

		if (type === "bpm") {
			const result = detectBPM({ channelData, sampleRate });
			self.postMessage({ type: "done", result });
		} else if (type === "key") {
			const result = detectKey({ channelData, sampleRate });
			self.postMessage({ type: "done", result });
		} else {
			throw new Error(`Tác vụ không xác định: ${type}`);
		}
	} catch (err: unknown) {
		const message =
			err instanceof Error
				? err.message
				: "Lỗi xử lý âm thanh trong Web Worker";
		self.postMessage({
			type: "error",
			error: message,
		});
	}
};
