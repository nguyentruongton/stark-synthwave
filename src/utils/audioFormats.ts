import type { AudioFormatInfo } from "../types";

export const SUPPORTED_AUDIO_EXTENSIONS = [
	".mp3",
	".wav",
	".flac",
	".ogg",
	".opus",
	".m4a",
	".aac",
	".weba",
	".webm",
	".aiff",
	".aif",
	".aifc",
	".wma",
	".alac",
	".caf",
	".amr",
	".ac3",
	".ape",
	".au",
	".snd",
	".mid",
	".midi",
	".oga",
	".mp4",
];

export const AUDIO_ACCEPT_STRING = `audio/*,${SUPPORTED_AUDIO_EXTENSIONS.join(",")}`;

export interface SupportedFormatDisplay {
	ext: string;
	extension: string;
	name: string;
	description: string;
	category: "lossless" | "hi-res" | "lossy" | "container";
	isLossless: boolean;
	badgeColor: string;
}

export const GLOBAL_AUDIO_FORMATS: SupportedFormatDisplay[] = [
	{
		ext: "WAV",
		extension: "wav",
		name: "WAV",
		description: "Waveform PCM / Float Studio Audio",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-blue-600/20 text-blue-400 border-blue-500/30",
	},
	{
		ext: "FLAC",
		extension: "flac",
		name: "FLAC",
		description: "Free Lossless Audio Codec",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
	},
	{
		ext: "AIFF",
		extension: "aiff",
		name: "AIFF",
		description: "Apple Audio Interchange Format",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-indigo-600/20 text-indigo-400 border-indigo-500/30",
	},
	{
		ext: "MP3",
		extension: "mp3",
		name: "MP3",
		description: "MPEG Audio Layer III Universal",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-amber-600/20 text-amber-400 border-amber-500/30",
	},
	{
		ext: "M4A",
		extension: "m4a",
		name: "M4A",
		description: "Apple AAC / ALAC Audio",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-purple-600/20 text-purple-400 border-purple-500/30",
	},
	{
		ext: "AAC",
		extension: "aac",
		name: "AAC",
		description: "Advanced Audio Coding",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-violet-600/20 text-violet-400 border-violet-500/30",
	},
	{
		ext: "OGG",
		extension: "ogg",
		name: "OGG",
		description: "Ogg Vorbis / Opus Stream",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-teal-600/20 text-teal-400 border-teal-500/30",
	},
	{
		ext: "OPUS",
		extension: "opus",
		name: "OPUS",
		description: "IETF Opus Interactive Audio",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
	},
	{
		ext: "WEBM",
		extension: "webm",
		name: "WebM",
		description: "WebM Media Audio (Opus/Vorbis)",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-sky-600/20 text-sky-400 border-sky-500/30",
	},
	{
		ext: "WMA",
		extension: "wma",
		name: "WMA",
		description: "Windows Media Audio",
		category: "lossy",
		isLossless: false,
		badgeColor: "bg-rose-600/20 text-rose-400 border-rose-500/30",
	},
	{
		ext: "AU",
		extension: "au",
		name: "AU",
		description: "Sun / NeXT Audio PCM / µ-law",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-orange-600/20 text-orange-400 border-orange-500/30",
	},
	{
		ext: "CAF",
		extension: "caf",
		name: "CAF",
		description: "Apple Core Audio Format",
		category: "lossless",
		isLossless: true,
		badgeColor: "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/30",
	},
];

function parseFormatInternal(
	buffer: ArrayBuffer,
	fileName: string,
): AudioFormatInfo {
	const bytes = new Uint8Array(
		buffer.slice(0, Math.min(buffer.byteLength, 64)),
	);
	const ext = fileName.includes(".")
		? fileName.split(".").pop()?.toLowerCase() || ""
		: "";

	// 1. RIFF WAVE
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x41 &&
		bytes[10] === 0x56 &&
		bytes[11] === 0x45
	) {
		return {
			name: "WAV (Waveform Audio)",
			extension: "wav",
			category: "lossless",
			description: "Tệp âm thanh chuẩn phòng thu uncompressed PCM / IEEE Float",
		};
	}

	// 2. FLAC
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x66 &&
		bytes[1] === 0x4c &&
		bytes[2] === 0x61 &&
		bytes[3] === 0x43
	) {
		return {
			name: "FLAC (Free Lossless Audio Codec)",
			extension: "flac",
			category: "lossless",
			description:
				"Chuẩn nén bảo toàn dữ liệu lossless cao cấp không làm suy giảm chất lượng gốc",
		};
	}

	// 3. FORM AIFF
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x46 &&
		bytes[1] === 0x4f &&
		bytes[2] === 0x52 &&
		bytes[3] === 0x4d &&
		bytes[8] === 0x41 &&
		bytes[9] === 0x49 &&
		bytes[10] === 0x46 &&
		(bytes[11] === 0x46 || bytes[11] === 0x43)
	) {
		return {
			name:
				bytes[11] === 0x43
					? "AIFC (Compressed AIFF)"
					: "AIFF (Apple Audio Interchange)",
			extension: "aiff",
			category: "lossless",
			description:
				"Định dạng âm thanh chuyên nghiệp chất lượng nguyên bản của hệ sinh thái Apple / macOS",
		};
	}

	// 4. OggS
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x4f &&
		bytes[1] === 0x67 &&
		bytes[2] === 0x67 &&
		bytes[3] === 0x53
	) {
		const isOpus = ext === "opus";
		return {
			name: isOpus ? "OPUS (IETF Opus in Ogg)" : "OGG (Ogg Vorbis / Opus)",
			extension: isOpus ? "opus" : "ogg",
			category: "lossy",
			description:
				"Định dạng mã nguồn mở hiện đại với độ nén tối ưu và độ méo tiếng cực thấp",
		};
	}

	// 5. MP3 (ID3 tag or sync frame)
	if (
		(bytes.length >= 3 &&
			bytes[0] === 0x49 &&
			bytes[1] === 0x44 &&
			bytes[2] === 0x33) ||
		(bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
	) {
		return {
			name: "MP3 (MPEG-1/2 Audio Layer III)",
			extension: "mp3",
			category: "lossy",
			description:
				"Định dạng âm thanh phổ biến nhất thế giới với khả năng tương thích trên mọi thiết bị",
		};
	}

	// 6. MP4 / M4A / AAC (ftyp chunk)
	if (
		bytes.length >= 8 &&
		bytes[4] === 0x66 &&
		bytes[5] === 0x74 &&
		bytes[6] === 0x79 &&
		bytes[7] === 0x70
	) {
		const isAlac = ext === "alac";
		return {
			name: isAlac
				? "ALAC (Apple Lossless Audio Codec)"
				: "M4A / AAC (MPEG-4 Audio)",
			extension: "m4a",
			category: isAlac ? "lossless" : "lossy",
			description: isAlac
				? "Chuẩn lossless của Apple Music"
				: "Chuẩn mã hóa âm thanh thế hệ mới với hiệu suất cao hơn MP3",
		};
	}

	// 7. WebM / Matroska (0x1A 0x45 0xDF 0xA3)
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x1a &&
		bytes[1] === 0x45 &&
		bytes[2] === 0xdf &&
		bytes[3] === 0xa3
	) {
		return {
			name: "WebM Audio (Opus/Vorbis)",
			extension: "webm",
			category: "lossy",
			description:
				"Container đa phương tiện mở tối ưu cho web streaming và ghi âm trình duyệt",
		};
	}

	// 8. Sun/NeXT AU (.snd)
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x2e &&
		bytes[1] === 0x73 &&
		bytes[2] === 0x6e &&
		bytes[3] === 0x64
	) {
		return {
			name: "AU / SND (Sun Microsystems Audio)",
			extension: "au",
			category: "lossless",
			description: "Định dạng âm thanh chuẩn Unix / NeXT nguyên bản",
		};
	}

	// 9. ASF / WMA (0x30 0x26 0xB2 0x75)
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x30 &&
		bytes[1] === 0x26 &&
		bytes[2] === 0xb2 &&
		bytes[3] === 0x75
	) {
		return {
			name: "WMA (Windows Media Audio)",
			extension: "wma",
			category: "lossy",
			description: "Định dạng âm thanh độc quyền của Microsoft Windows",
		};
	}

	// 10. Fallback by extension
	switch (ext) {
		case "wav":
			return {
				name: "WAV (Waveform Audio)",
				extension: "wav",
				category: "lossless",
				description: "Tệp âm thanh WAV chuẩn PCM",
			};
		case "flac":
			return {
				name: "FLAC (Free Lossless)",
				extension: "flac",
				category: "lossless",
				description: "Định dạng Lossless FLAC chất lượng cao",
			};
		case "mp3":
			return {
				name: "MP3 Audio",
				extension: "mp3",
				category: "lossy",
				description: "Tệp âm thanh MP3 phổ biến",
			};
		case "m4a":
		case "aac":
			return {
				name: "AAC / M4A Audio",
				extension: ext,
				category: "lossy",
				description: "Tệp nhạc mã hóa AAC MPEG-4",
			};
		case "ogg":
		case "opus":
			return {
				name: "OGG / Opus Audio",
				extension: ext,
				category: "lossy",
				description: "Tệp nén mã nguồn mở Ogg Vorbis/Opus",
			};
		case "aiff":
		case "aif":
			return {
				name: "AIFF Audio",
				extension: "aiff",
				category: "lossless",
				description: "Định dạng âm thanh chuẩn Apple AIFF",
			};
		case "wma":
			return {
				name: "WMA Audio",
				extension: "wma",
				category: "lossy",
				description: "Windows Media Audio",
			};
		case "caf":
			return {
				name: "Apple Core Audio (CAF)",
				extension: "caf",
				category: "container",
				description: "Container âm thanh Apple Core Audio",
			};
		case "amr":
			return {
				name: "AMR Voice Audio",
				extension: "amr",
				category: "lossy",
				description: "Chuẩn âm thanh giọng nói di động",
			};
		case "ac3":
		case "eac3":
			return {
				name: "Dolby AC-3 Audio",
				extension: "ac3",
				category: "lossy",
				description: "Định dạng âm thanh vòm Dolby Digital",
			};
		case "ape":
			return {
				name: "Monkey's Audio (APE)",
				extension: "ape",
				category: "lossless",
				description: "Chuẩn nén lossless APE độ nén cao",
			};
		default:
			return {
				name: ext ? `${ext.toUpperCase()} Audio` : "Tệp Âm thanh",
				extension: ext || "bin",
				category: "container",
				description: "Định dạng dữ liệu âm thanh số",
			};
	}
}

/** Detect format metadata based on magic byte header inspection and file name fallback. */
export function detectAudioFormat(
	buffer: ArrayBuffer,
	fileName: string,
): AudioFormatInfo {
	const info = parseFormatInternal(buffer, fileName);
	return {
		...info,
		isLossless:
			info.isLossless ??
			(info.category === "lossless" || info.category === "hi-res"),
	};
}

/** If a file has an ID3v2 header prepended (e.g. ID3 tag on WAV or AIFF), strips it so decoders don't choke. */
export function stripId3Tag(arrayBuffer: ArrayBuffer): ArrayBuffer | null {
	const bytes = new Uint8Array(arrayBuffer);
	if (
		bytes.length > 10 &&
		bytes[0] === 0x49 &&
		bytes[1] === 0x44 &&
		bytes[2] === 0x33
	) {
		// Synchsafe integer in bytes 6, 7, 8, 9
		const tagSize =
			((bytes[6] & 0x7f) << 21) |
			((bytes[7] & 0x7f) << 14) |
			((bytes[8] & 0x7f) << 7) |
			(bytes[9] & 0x7f);
		const totalHeaderLength = 10 + tagSize;
		if (totalHeaderLength < arrayBuffer.byteLength) {
			return arrayBuffer.slice(totalHeaderLength);
		}
	}
	return null;
}

/** Pure TypeScript WAV parser and PCM/Float extractor for files that browser decodeAudioData rejects. */
export function parseWavToAudioBuffer(
	audioContext: AudioContext,
	arrayBuffer: ArrayBuffer,
): AudioBuffer | null {
	try {
		const view = new DataView(arrayBuffer);
		if (view.byteLength < 44) return null;

		// Check RIFF
		const riff = String.fromCharCode(
			view.getUint8(0),
			view.getUint8(1),
			view.getUint8(2),
			view.getUint8(3),
		);
		const wave = String.fromCharCode(
			view.getUint8(8),
			view.getUint8(9),
			view.getUint8(10),
			view.getUint8(11),
		);
		if (riff !== "RIFF" || wave !== "WAVE") return null;

		let offset = 12;
		let format = 1;
		let numChannels = 2;
		let sampleRate = 44100;
		let bitsPerSample = 16;
		let dataOffset = -1;
		let dataLength = 0;

		while (offset + 8 <= view.byteLength) {
			const chunkId = String.fromCharCode(
				view.getUint8(offset),
				view.getUint8(offset + 1),
				view.getUint8(offset + 2),
				view.getUint8(offset + 3),
			);
			const chunkSize = view.getUint32(offset + 4, true);

			if (chunkId === "fmt ") {
				format = view.getUint16(offset + 8, true);
				numChannels = view.getUint16(offset + 10, true);
				sampleRate = view.getUint32(offset + 12, true);
				bitsPerSample = view.getUint16(offset + 22, true);
			} else if (chunkId === "data") {
				dataOffset = offset + 8;
				dataLength = Math.min(chunkSize, view.byteLength - dataOffset);
				break;
			}
			offset += 8 + chunkSize;
			if (chunkSize % 2 !== 0) offset += 1; // Word align
		}

		if (dataOffset === -1 || numChannels === 0 || sampleRate === 0) return null;

		const bytesPerSample = bitsPerSample / 8;
		const blockAlign = numChannels * bytesPerSample;
		const numFrames = Math.floor(dataLength / blockAlign);
		if (numFrames <= 0) return null;

		const audioBuffer = audioContext.createBuffer(
			numChannels,
			numFrames,
			sampleRate,
		);
		const channelArrays: Float32Array[] = [];
		for (let c = 0; c < numChannels; c++) {
			channelArrays.push(audioBuffer.getChannelData(c));
		}

		let bytePtr = dataOffset;
		if (bitsPerSample === 16 && (format === 1 || format === 65534)) {
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					const val = view.getInt16(bytePtr, true);
					channelArrays[c][f] = val / 32768;
					bytePtr += 2;
				}
			}
		} else if (bitsPerSample === 24 && (format === 1 || format === 65534)) {
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					const b0 = view.getUint8(bytePtr);
					const b1 = view.getUint8(bytePtr + 1);
					const b2 = view.getUint8(bytePtr + 2);
					let val = (b2 << 16) | (b1 << 8) | b0;
					if (val & 0x800000) val |= ~0xffffff;
					channelArrays[c][f] = val / 8388608;
					bytePtr += 3;
				}
			}
		} else if (bitsPerSample === 32 && format === 3) {
			// 32-bit float
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					channelArrays[c][f] = view.getFloat32(bytePtr, true);
					bytePtr += 4;
				}
			}
		} else if (bitsPerSample === 32 && (format === 1 || format === 65534)) {
			// 32-bit int
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					channelArrays[c][f] = view.getInt32(bytePtr, true) / 2147483648;
					bytePtr += 4;
				}
			}
		} else if (bitsPerSample === 8) {
			// 8-bit unsigned
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					channelArrays[c][f] = (view.getUint8(bytePtr) - 128) / 128;
					bytePtr += 1;
				}
			}
		} else {
			return null;
		}

		return audioBuffer;
	} catch (e) {
		console.warn("WAV manual parse failed:", e);
		return null;
	}
}

/** Pure TypeScript AIFF/AIF parser and big-endian PCM converter. */
export function parseAiffToAudioBuffer(
	audioContext: AudioContext,
	arrayBuffer: ArrayBuffer,
): AudioBuffer | null {
	try {
		const view = new DataView(arrayBuffer);
		if (view.byteLength < 44) return null;

		const form = String.fromCharCode(
			view.getUint8(0),
			view.getUint8(1),
			view.getUint8(2),
			view.getUint8(3),
		);
		const aiff = String.fromCharCode(
			view.getUint8(8),
			view.getUint8(9),
			view.getUint8(10),
			view.getUint8(11),
		);
		if (form !== "FORM" || (aiff !== "AIFF" && aiff !== "AIFC")) return null;

		let offset = 12;
		let numChannels = 2;
		let numSampleFrames = 0;
		let sampleSize = 16;
		let sampleRate = 44100;
		let dataOffset = -1;
		let _dataLength = 0;

		while (offset + 8 <= view.byteLength) {
			const chunkId = String.fromCharCode(
				view.getUint8(offset),
				view.getUint8(offset + 1),
				view.getUint8(offset + 2),
				view.getUint8(offset + 3),
			);
			const chunkSize = view.getUint32(offset + 4, false); // Big endian

			if (chunkId === "COMM") {
				numChannels = view.getUint16(offset + 8, false);
				numSampleFrames = view.getUint32(offset + 10, false);
				sampleSize = view.getUint16(offset + 14, false);
				// 80-bit IEEE 754 float sample rate
				sampleRate = Math.round(readExtendedFloat(view, offset + 16));
			} else if (chunkId === "SSND") {
				const ssndOffset = view.getUint32(offset + 8, false);
				dataOffset = offset + 16 + ssndOffset;
				_dataLength = chunkSize - 8 - ssndOffset;
				break;
			}
			offset += 8 + chunkSize;
			if (chunkSize % 2 !== 0) offset += 1;
		}

		if (
			dataOffset === -1 ||
			numChannels === 0 ||
			sampleRate === 0 ||
			numSampleFrames === 0
		)
			return null;

		const audioBuffer = audioContext.createBuffer(
			numChannels,
			numSampleFrames,
			sampleRate,
		);
		const channels: Float32Array[] = [];
		for (let c = 0; c < numChannels; c++) {
			channels.push(audioBuffer.getChannelData(c));
		}

		let bytePtr = dataOffset;
		if (sampleSize === 16) {
			for (let f = 0; f < numSampleFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					if (bytePtr + 2 > view.byteLength) break;
					const val = view.getInt16(bytePtr, false); // Big endian
					channels[c][f] = val / 32768;
					bytePtr += 2;
				}
			}
		} else if (sampleSize === 24) {
			for (let f = 0; f < numSampleFrames; f++) {
				for (let c = 0; c < numChannels; c++) {
					if (bytePtr + 3 > view.byteLength) break;
					const b0 = view.getUint8(bytePtr);
					const b1 = view.getUint8(bytePtr + 1);
					const b2 = view.getUint8(bytePtr + 2);
					let val = (b0 << 16) | (b1 << 8) | b2; // Big endian
					if (val & 0x800000) val |= ~0xffffff;
					channels[c][f] = val / 8388608;
					bytePtr += 3;
				}
			}
		} else {
			return null;
		}

		return audioBuffer;
	} catch (e) {
		console.warn("AIFF manual parse failed:", e);
		return null;
	}
}

/** Pure TypeScript Sun/NeXT AU (.snd) parser. */
export function parseAuToAudioBuffer(
	audioContext: AudioContext,
	arrayBuffer: ArrayBuffer,
): AudioBuffer | null {
	try {
		const view = new DataView(arrayBuffer);
		if (view.byteLength < 24) return null;

		const magic = view.getUint32(0, false);
		if (magic !== 0x2e736e64) return null; // ".snd"

		const dataOffset = view.getUint32(4, false);
		const dataSize = view.getUint32(8, false);
		const encoding = view.getUint32(12, false);
		const sampleRate = view.getUint32(16, false);
		const channels = view.getUint32(20, false);

		if (channels === 0 || sampleRate === 0 || dataOffset >= view.byteLength)
			return null;

		// Encoding 3 = 16-bit linear PCM big-endian
		if (encoding === 3) {
			const numFrames = Math.floor(
				(dataSize > 0 ? dataSize : view.byteLength - dataOffset) /
					(channels * 2),
			);
			const audioBuffer = audioContext.createBuffer(
				channels,
				numFrames,
				sampleRate,
			);
			const channelData: Float32Array[] = [];
			for (let c = 0; c < channels; c++) {
				channelData.push(audioBuffer.getChannelData(c));
			}

			let ptr = dataOffset;
			for (let f = 0; f < numFrames; f++) {
				for (let c = 0; c < channels; c++) {
					channelData[c][f] = view.getInt16(ptr, false) / 32768;
					ptr += 2;
				}
			}
			return audioBuffer;
		}
		return null;
	} catch (e) {
		console.warn("AU parse failed:", e);
		return null;
	}
}

/** Reads IEEE 754 80-bit extended precision float (used in AIFF COMM chunk). */
export function readExtendedFloat(view: DataView, offset: number): number {
	const biExp = view.getUint16(offset, false) & 0x7fff;
	const exp = biExp - 16383;
	const hi = view.getUint32(offset + 2, false);
	const lo = view.getUint32(offset + 6, false);
	const mantissa = hi / 2 ** 31 + lo / 2 ** 63;
	return mantissa * 2 ** exp;
}
