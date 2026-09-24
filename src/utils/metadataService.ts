import MP3Tag from "mp3tag.js";

export interface AudioMetadataTags {
	title: string;
	artist: string;
	album: string;
	year: string;
	track: string;
	genre: string;
	comment: string;
}

export interface CoverArtData {
	format: string;
	data: number[];
}

export interface AudioFileItem {
	id: string;
	file: File;
	format: string;
	sizeFormatted: string;
	tags: AudioMetadataTags;
	hasTags: boolean;
	coverUrl?: string;
	coverData?: CoverArtData | null;
	rawBuffer?: ArrayBuffer;
	status: "ready" | "reading" | "saving" | "error";
	selected: boolean;
}

export interface BatchFieldItem {
	enabled: boolean;
	value: string;
}

export interface BatchFieldsState {
	title: BatchFieldItem;
	artist: BatchFieldItem;
	album: BatchFieldItem;
	year: BatchFieldItem;
	track: BatchFieldItem;
	genre: BatchFieldItem;
	comment: BatchFieldItem;
	cover: {
		enabled: boolean;
		action: "keep" | "remove" | "set";
		data?: CoverArtData;
		previewUrl?: string;
	};
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function detectFileFormat(file: File): string {
	const ext = file.name.split(".").pop()?.toUpperCase() || "";
	if (["MP3", "M4A", "MP4", "AAC", "AIFF", "AIF"].includes(ext)) {
		return ext;
	}
	if (file.type.includes("audio/mpeg")) return "MP3";
	if (file.type.includes("audio/mp4") || file.type.includes("audio/x-m4a"))
		return "M4A";
	if (file.type.includes("audio/aac")) return "AAC";
	if (file.type.includes("audio/aiff")) return "AIFF";
	return ext || "AUDIO";
}

export function triggerDownload(
	buffer: ArrayBuffer,
	filename: string,
	mimeType: string,
) {
	const blob = new Blob([buffer], { type: mimeType || "audio/mpeg" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Đọc thẻ metadata từ tệp âm thanh */
export async function readAudioMetadataItem(
	file: File,
): Promise<AudioFileItem> {
	const format = detectFileFormat(file);
	let tags: AudioMetadataTags = {
		title: "",
		artist: "",
		album: "",
		year: "",
		track: "",
		genre: "",
		comment: "",
	};
	let coverUrl: string | undefined;
	let coverData: CoverArtData | null = null;
	let buffer: ArrayBuffer | undefined;
	let hasTags = false;

	try {
		buffer = await file.arrayBuffer();
		const mp3tag = new MP3Tag(buffer.slice(0));
		mp3tag.read();

		const title = mp3tag.tags.title || mp3tag.tags.v2?.TIT2 || "";
		const artist = mp3tag.tags.artist || mp3tag.tags.v2?.TPE1 || "";
		const album = mp3tag.tags.album || mp3tag.tags.v2?.TALB || "";
		const year =
			mp3tag.tags.year || mp3tag.tags.v2?.TYER || mp3tag.tags.v2?.TDRC || "";
		const track = mp3tag.tags.track || mp3tag.tags.v2?.TRCK || "";
		const genre = mp3tag.tags.genre || mp3tag.tags.v2?.TCON || "";
		let comment = mp3tag.tags.comment || "";
		if (!comment && mp3tag.tags.v2?.COMM && mp3tag.tags.v2.COMM.length > 0) {
			comment = mp3tag.tags.v2.COMM[0].text || "";
		}

		tags = { title, artist, album, year, track, genre, comment };

		if (mp3tag.tags.v2?.APIC && mp3tag.tags.v2.APIC.length > 0) {
			const apic = mp3tag.tags.v2.APIC[0];
			if (apic.data && apic.data.length > 0) {
				const mime = apic.format || "image/jpeg";
				const u8 = new Uint8Array(apic.data);
				const blob = new Blob([u8], { type: mime });
				coverUrl = URL.createObjectURL(blob);
				coverData = { format: mime, data: Array.from(u8) };
			}
		}

		hasTags = Boolean(
			title || artist || album || year || track || genre || comment || coverUrl,
		);
	} catch (err) {
		console.warn("Could not read tags for file:", file.name, err);
	}

	return {
		id: crypto.randomUUID(),
		file,
		format,
		sizeFormatted: formatFileSize(file.size),
		tags,
		hasTags,
		coverUrl,
		coverData,
		rawBuffer: buffer,
		status: "ready",
		selected: true,
	};
}

/** Ghi metadata cho một bài hát đơn lẻ */
export async function writeSingleMetadata(
	item: AudioFileItem,
	tags: AudioMetadataTags,
	coverData: CoverArtData | null | "keep",
	editCoverUrl: string | null,
): Promise<{
	updatedBuffer: ArrayBuffer;
	newCoverUrl?: string;
	newCoverData?: CoverArtData | null;
}> {
	const buffer = item.rawBuffer?.slice(0) || (await item.file.arrayBuffer());
	const mp3tag = new MP3Tag(buffer);
	mp3tag.read();

	mp3tag.tags.title = tags.title.trim();
	mp3tag.tags.artist = tags.artist.trim();
	mp3tag.tags.album = tags.album.trim();
	mp3tag.tags.year = tags.year.trim();
	mp3tag.tags.track = tags.track.trim();
	mp3tag.tags.genre = tags.genre.trim();
	mp3tag.tags.comment = tags.comment.trim();

	if (!mp3tag.tags.v2) {
		mp3tag.tags.v2 = {};
	}

	if (coverData === null) {
		delete mp3tag.tags.v2.APIC;
	} else if (coverData !== "keep") {
		mp3tag.tags.v2.APIC = [
			{
				format: coverData.format,
				type: 3,
				description: "Front cover",
				data: coverData.data,
			},
		];
	}

	const saved = mp3tag.save({
		id3v2: {
			include: true,
			version: 3,
			padding: 2048,
		},
	});

	if (mp3tag.error) {
		throw new Error(mp3tag.error);
	}

	const updatedBuffer = saved as ArrayBuffer;
	const newCoverUrl = editCoverUrl || undefined;
	const newCoverData = coverData === "keep" ? item.coverData : coverData;

	return {
		updatedBuffer,
		newCoverUrl,
		newCoverData,
	};
}
