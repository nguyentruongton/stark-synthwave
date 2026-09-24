export type Language = "vi" | "en";

export interface TranslationDict {
	// Navigation
	nav_trim: string;
	nav_lossless: string;
	nav_metadata: string;
	nav_tempo: string;
	nav_tone: string;
	nav_settings: string;

	// Settings Page
	settings_title: string;
	settings_subtitle: string;
	settings_language_title: string;
	settings_language_desc: string;
	settings_lang_vi: string;
	settings_lang_en: string;
	settings_theme_title: string;
	settings_theme_desc: string;
	settings_theme_dark: string;
	settings_theme_light: string;
	settings_theme_system: string;
	settings_theme_active_label: string;
	settings_palette_title: string;
	settings_palette_desc: string;
	settings_palette_custom: string;
	settings_palette_custom_desc: string;
	settings_palette_preview: string;
	settings_palette_preview_btn: string;
	settings_palette_preview_tonal: string;
	settings_palette_preview_chip: string;
	settings_reset_default: string;
	settings_reset_success: string;
	settings_about_title: string;
	settings_about_desc: string;
	settings_about_feature1_title: string;
	settings_about_feature1_desc: string;
	settings_about_feature2_title: string;
	settings_about_feature2_desc: string;
	settings_about_feature3_title: string;
	settings_about_feature3_desc: string;
	settings_about_feature4_title: string;
	settings_about_feature4_desc: string;

	// MusicTrimMerge
	trim_title: string;
	trim_desc: string;
	trim_drop_title: string;
	trim_drop_desc: string;
	trim_playing: string;
	trim_paused: string;
	trim_play: string;
	trim_pause: string;
	trim_reset: string;
	trim_add_queue: string;
	trim_queue_title: string;
	trim_queue_empty: string;
	trim_export_btn: string;
	trim_exporting: string;
	trim_export_success: string;
	trim_select_new: string;
	trim_start_time: string;
	trim_end_time: string;
	trim_duration: string;
	trim_channels: string;
	trim_sample_rate: string;
	trim_export_format: string;
	trim_format_label: string;
	trim_global_formats_hint: string;
	trim_zoom_label: string;
	trim_zoom_hint: string;
	trim_zoom_in: string;
	trim_zoom_out: string;
	trim_zoom_reset: string;
	trim_zoom_to_selection: string;
	visualizer_title: string;
	visualizer_subtitle: string;
	visualizer_view_both: string;
	visualizer_view_waveform: string;
	visualizer_view_spectrum: string;
	visualizer_peak: string;

	// LosslessChecker
	lossless_title: string;
	lossless_desc: string;
	lossless_help_title: string;
	lossless_help_p1: string;
	lossless_help_p2: string;
	lossless_drop_title: string;
	lossless_drop_desc: string;
	lossless_analyzing: string;
	lossless_result_true: string;
	lossless_result_fake: string;
	lossless_true_badge: string;
	lossless_fake_badge: string;
	lossless_cutoff_label: string;
	lossless_score_label: string;
	lossless_high_power: string;
	lossless_mid_power: string;
	lossless_bit_depth_label: string;
	lossless_texture_label: string;
	lossless_upscaled_badge: string;
	lossless_score_breakdown: string;
	lossless_spectrum_chart: string;
	lossless_check_another: string;

	// TempoDetector
	tempo_title: string;
	tempo_desc: string;
	tempo_drop_title: string;
	tempo_drop_desc: string;
	tempo_analyzing: string;
	tempo_bpm_label: string;
	tempo_result_label?: string;
	tempo_confidence: string;
	tempo_peaks: string;
	tempo_tap_title: string;
	tempo_tap_desc: string;
	tempo_tap_button: string;
	tempo_tap_reset: string;
	tempo_tap_current?: string;
	tempo_tap_prompt: string;
	tempo_check_another: string;

	// ToneDetector
	tone_title: string;
	tone_desc: string;
	tone_help_title: string;
	tone_help_p1: string;
	tone_help_p2: string;
	tone_drop_title: string;
	tone_drop_desc: string;
	tone_analyzing: string;
	tone_key_label: string;
	tone_result_label?: string;
	tone_camelot?: string;
	tone_camelot_label: string;
	tone_confidence: string;
	tone_chroma_chart: string;
	tone_chroma_title?: string;
	tone_harmonic_title: string;
	tone_harmonic_desc: string;
	tone_check_another: string;

	// Metadata Editor
	metadata_title: string;
	metadata_subtitle: string;
	metadata_drop_title: string;
	metadata_drop_desc: string;
	metadata_select_files: string;
	metadata_reading_tags: string;
	metadata_empty_title: string;
	metadata_empty_desc: string;
	metadata_files_count: string;
	metadata_selected_count: string;
	metadata_select_all: string;
	metadata_deselect_all: string;
	metadata_clear_all: string;
	metadata_batch_edit: string;
	metadata_batch_download: string;
	metadata_download_single: string;
	metadata_edit_single: string;
	metadata_remove_file: string;
	metadata_has_tags: string;
	metadata_no_tags: string;
	metadata_title_field: string;
	metadata_artist_field: string;
	metadata_album_field: string;
	metadata_year_field: string;
	metadata_track_field: string;
	metadata_genre_field: string;
	metadata_comment_field: string;
	metadata_cover_art: string;
	metadata_change_cover: string;
	metadata_remove_cover: string;
	metadata_no_cover: string;
	metadata_single_dialog_title: string;
	metadata_batch_dialog_title: string;
	metadata_batch_dialog_desc: string;
	metadata_batch_apply_btn: string;
	metadata_save_and_download: string;
	metadata_saving: string;
	metadata_save_success: string;
	metadata_batch_success: string;
	metadata_read_error: string;
	metadata_save_error: string;
	metadata_unsupported_format: string;

	// Common
	common_close: string;
	common_error: string;
	common_help: string;
	common_file_size: string;
}

export const translations: Record<Language, TranslationDict> = {
	vi: {
		// Navigation
		nav_trim: "Cắt Ghép",
		nav_lossless: "Lossless",
		nav_metadata: "Metadata",
		nav_tempo: "Tempo",
		nav_tone: "Dò Tone",
		nav_settings: "Cài đặt",

		// Settings Page
		settings_title: "Cài đặt hệ thống",
		settings_subtitle:
			"Tùy biến ngôn ngữ, chế độ hiển thị và bảng màu sắc theo phong cách của bạn.",
		settings_language_title: "Ngôn ngữ",
		settings_language_desc:
			"Chọn ngôn ngữ sử dụng xuyên suốt toàn bộ ứng dụng.",
		settings_lang_vi: "Tiếng Việt",
		settings_lang_en: "English",
		settings_theme_title: "Chế độ giao diện",
		settings_theme_desc:
			"Chuyển đổi giữa chế độ Tối, Sáng hoặc đồng bộ theo cấu hình của hệ điều hành.",
		settings_theme_dark: "Tối",
		settings_theme_light: "Sáng",
		settings_theme_system: "Hệ thống",
		settings_theme_active_label: "Trạng thái hiển thị hiện tại:",
		settings_palette_title: "Bảng màu sắc (Color Palette)",
		settings_palette_desc:
			"Được tính toán động theo thuật toán Material Design 3 Expressive 2025 (MCU). Mọi thành phần nút bấm, thẻ và thanh điều hướng sẽ tự động thích ứng với màu sắc bạn chọn.",
		settings_palette_custom: "Màu tùy biến (Custom Hex)",
		settings_palette_custom_desc:
			"Nhập mã màu hex hoặc click biểu tượng màu để chọn màu bất kỳ.",
		settings_palette_preview: "Xem trước bảng màu đã chọn",
		settings_palette_preview_btn: "Nút chính (Filled)",
		settings_palette_preview_tonal: "Nút phụ (Tonal)",
		settings_palette_preview_chip: "Thẻ nhãn (Chip)",
		settings_reset_default: "Khôi phục bảng màu mặc định",
		settings_reset_success: "Đã khôi phục cài đặt mặc định thành công!",
		settings_about_title: "Thông tin ứng dụng",
		settings_about_desc:
			"Bộ công cụ kiểm định Lossless, phân tích phổ tần số và biên tập âm thanh studio chuyên nghiệp hoạt động 100% trên trình duyệt.",
		settings_about_feature1_title: "Kiểm định Lossless & DSP Engine",
		settings_about_feature1_desc:
			"Thuật toán 8192-point FFT, cửa sổ Blackman -58 dB, Web Worker đa luồng phân tích cut-off dải tần và phát hiện fake upscaled audio.",
		settings_about_feature2_title: "Hỗ trợ 20+ định dạng âm thanh",
		settings_about_feature2_desc:
			"Hỗ trợ FLAC, WAV (PCM/Float 32-bit), AIFF, ALAC, MP3, AAC, OGG, Opus, WebM, AU... kèm bộ giải mã fallback và bộ lọc ID3v2 raw.",
		settings_about_feature3_title: "Bộ công cụ Studio cốt lõi",
		settings_about_feature3_desc:
			"Cắt & ghép nhạc chính xác mili-giây, nhận diện nhịp độ BPM, dò Tone/Key hợp âm và trực quan hóa thác nước 2D Spectrogram thời gian thực.",
		settings_about_feature4_title: "100% Client-Side & Bảo mật",
		settings_about_feature4_desc:
			"Toàn bộ quá trình giải mã, tính toán phổ âm và xuất tệp chạy hoàn toàn trong trình duyệt qua Web Audio API, không upload lên máy chủ.",

		// MusicTrimMerge
		trim_title: "Cắt & Ghép nhạc Studio",
		trim_desc:
			"Kéo thả hai điểm mốc để cắt chính xác từng mili-giây và ghép nối nhiều đoạn nhạc, xuất đa định dạng chất lượng cao.",
		trim_drop_title: "Chọn hoặc kéo thả tệp âm thanh vào đây",
		trim_drop_desc:
			"Hỗ trợ định dạng toàn cầu: WAV, FLAC, AIFF, MP3, M4A, AAC, OGG, Opus, WebM, WMA, ALAC, CAF, AU...",
		trim_playing: "Đang phát",
		trim_paused: "Đã tạm dừng",
		trim_play: "Phát đoạn chọn",
		trim_pause: "Tạm dừng",
		trim_reset: "Đặt lại vùng chọn",
		trim_add_queue: "Thêm đoạn này vào hàng chờ ghép",
		trim_queue_title: "Hàng chờ ghép nhạc",
		trim_queue_empty:
			"Chưa có đoạn nhạc nào trong danh sách. Hãy cắt một đoạn rồi bấm 'Thêm vào hàng chờ'!",
		trim_export_btn: "Ghép và Xuất tệp",
		trim_exporting: "Đang mã hóa và tổng hợp âm thanh...",
		trim_export_success: "Đã xuất tệp nhạc thành công!",
		trim_select_new: "Chọn tệp khác",
		trim_start_time: "Bắt đầu",
		trim_end_time: "Kết thúc",
		trim_duration: "Thời lượng",
		trim_channels: "Kênh âm thanh",
		trim_sample_rate: "Tần số lấy mẫu",
		trim_export_format: "Định dạng xuất tệp",
		trim_format_label: "Định dạng gốc nhận diện",
		trim_global_formats_hint:
			"Tương thích 100% định dạng âm thanh trên thế giới",
		trim_zoom_label: "Thu phóng sóng âm",
		trim_zoom_hint:
			"Phóng to để căn chỉnh điểm bắt đầu và kết thúc với độ chính xác mili-giây",
		trim_zoom_in: "Phóng to",
		trim_zoom_out: "Thu nhỏ",
		trim_zoom_reset: "Vừa khung (1x)",
		trim_zoom_to_selection: "Phóng to vùng chọn",
		visualizer_title: "Phổ Tần Số Thời Gian Thực",
		visualizer_subtitle:
			"Phản hồi dải tần số âm học thời gian thực (20Hz - 20kHz)",
		visualizer_view_both: "Cả hai chế độ",
		visualizer_view_waveform: "Sóng âm",
		visualizer_view_spectrum: "Phổ tần số",
		visualizer_peak: "Tần số đỉnh",

		// LosslessChecker
		lossless_title: "Kiểm tra nhạc lossless Thật/Giả",
		lossless_desc:
			"Phân tích tần số để phát hiện tệp nhạc MP3 nén bị thổi phồng dung lượng thành FLAC/WAV.",
		lossless_help_title: "Chỉ số này hoạt động thế nào?",
		lossless_help_p1:
			"Nhạc nén (Lossy) như MP3 hay AAC thường loại bỏ triệt để các tần số cao trên 15 kHz - 16 kHz để giảm kích thước tệp. Khi một tệp MP3 được chuyển đổi giả tạo thành WAV hoặc FLAC ('upscaled/fake lossless'), biểu đồ tần số vẫn sẽ bị giới hạn nghiêm ngặt ở mốc này.",
		lossless_help_p2:
			"Tệp Lossless thật (100% gốc) giữ nguyên toàn bộ phổ âm thanh lên tới 20 kHz - 22 kHz mà không có bất kỳ đường cắt gắt nào.",
		lossless_drop_title: "Chọn tệp nhạc FLAC, WAV, AIFF, MP3, M4A cần kiểm tra",
		lossless_drop_desc:
			"Hỗ trợ tất cả định dạng âm thanh phổ biến để quét phổ tần số",
		lossless_analyzing: "Đang phân tích phổ tần số âm thanh...",
		lossless_result_true: "Xác thực: Nhạc Lossless Thật (Chuẩn Studio)",
		lossless_result_fake: "Cảnh báo: Nhạc Giả Lossless (MP3 Phóng Đại)",
		lossless_true_badge: "Chuẩn Lossless 100%",
		lossless_fake_badge: "Nén MP3 Phóng Đại",
		lossless_cutoff_label: "Giới hạn tần số cắt (Cut-off)",
		lossless_score_label: "Điểm độ sạch âm thanh",
		lossless_high_power: "Mật độ dải cao (16kHz-22kHz)",
		lossless_mid_power: "Mật độ dải trung (1kHz-15kHz)",
		lossless_bit_depth_label: "Độ sâu bit thực tế (Effective Bit-Depth)",
		lossless_texture_label: "Độ gợn phổ dải cao (HF Texture)",
		lossless_upscaled_badge: "Phát hiện giả lập Hi-Res (Upscaled từ 16-bit)",
		lossless_score_breakdown: "Chi tiết điểm đa nhân tố (Multi-Factor Scoring)",
		lossless_spectrum_chart:
			"Biểu đồ phổ tần số (Peak-Hold & Average FFT Curve)",
		lossless_check_another: "Kiểm tra bài khác",

		// TempoDetector
		tempo_title: "Đo Tempo bài hát (Tự động)",
		tempo_desc:
			"Tải tệp âm thanh lên để thuật toán đếm nhịp bass tự động đo chỉ số BPM (Tempo).",
		tempo_drop_title: "Chọn tệp âm thanh để tự động đo Tempo",
		tempo_drop_desc: "Hỗ trợ định dạng MP3, WAV, FLAC, OGG, AAC",
		tempo_analyzing: "Đang tính toán đỉnh nhịp bass (Onset Detection)...",
		tempo_bpm_label: "Chỉ số Tempo (BPM)",
		tempo_confidence: "Độ tin cậy thuật toán",
		tempo_peaks: "Số nhịp phách phát hiện",
		tempo_tap_title: "Đo nhịp thủ công (Tap Tempo)",
		tempo_tap_desc:
			"Gõ liên tục vào nút bên dưới theo giai điệu bài hát để đo BPM tức thì.",
		tempo_tap_button: "Gõ Nhịp (TAP)",
		tempo_tap_reset: "Đặt lại Tap",
		tempo_tap_prompt: "Gõ ít nhất 2 lần để bắt đầu tính toán",
		tempo_check_another: "Đo bài khác",

		// ToneDetector
		tone_title: "Dò Tone / Thang âm bài hát",
		tone_desc:
			"Phân tích tần số Pitch Chroma để xác định tông chính (Key/Scale) của bản nhạc.",
		tone_help_title: "Camelot System & Phối tông hòa âm là gì?",
		tone_help_p1:
			"Mã Camelot (ví dụ: 8B, 8A) là hệ thống đánh số mã hóa cho vòng tròn bậc năm (Circle of Fifths). Các DJ chuyên nghiệp sử dụng hệ thống này để trộn nhạc hòa âm (harmonic mixing) mượt mà mà không lo bị phô hay lệch tông.",
		tone_help_p2:
			"Các bài hát có mã kề nhau (ví dụ 8B có thể ghép hoàn hảo với 7B, 9B, hoặc 8A) sẽ có cấu trúc hòa âm tương thích và trộn lẫn với nhau tạo cảm giác tự nhiên nhất.",
		tone_drop_title: "Chọn tệp nhạc để dò tìm Thang âm",
		tone_drop_desc:
			"Thuật toán Pitch Class Profile hoạt động hoàn toàn trên client",
		tone_analyzing: "Đang tính toán năng lượng nốt nhạc (Chromagram)...",
		tone_key_label: "Tông chính (Key)",
		tone_camelot_label: "Mã Camelot Wheel",
		tone_confidence: "Độ chuẩn xác",
		tone_chroma_chart: "Phân bố năng lượng 12 cao độ (Chromagram Energy)",
		tone_harmonic_title: "Các tông nhạc phối hòa âm hoàn hảo (Harmonic Mixing)",
		tone_harmonic_desc:
			"Trộn các bài hát có thang âm sau để chuyển bài mượt mà và không lệch pha giai điệu:",
		tone_check_another: "Dò bài khác",

		// Metadata Editor
		metadata_title: "Chỉnh sửa Metadata Âm thanh",
		metadata_subtitle:
			"Đọc, cập nhật thông tin bài hát (ID3 tags) và ảnh bìa Album đơn lẻ hoặc hàng loạt ngay trên trình duyệt.",
		metadata_drop_title: "Chọn hoặc kéo thả các tệp âm thanh vào đây",
		metadata_drop_desc:
			"Hỗ trợ MP3, M4A, MP4, AAC, AIFF... Chỉnh sửa không làm nén lại âm thanh gốc.",
		metadata_select_files: "Tải tệp từ máy",
		metadata_reading_tags: "Đang đọc metadata của các tệp...",
		metadata_empty_title: "Chưa có tệp âm thanh nào",
		metadata_empty_desc:
			"Tải lên một hoặc nhiều tệp để bắt đầu xem và chỉnh sửa thông tin tags, ảnh bìa.",
		metadata_files_count: "tệp âm thanh",
		metadata_selected_count: "đã chọn",
		metadata_select_all: "Chọn tất cả",
		metadata_deselect_all: "Bỏ chọn tất cả",
		metadata_clear_all: "Xóa danh sách",
		metadata_batch_edit: "Sửa hàng loạt",
		metadata_batch_download: "Tải xuống các tệp đã chọn",
		metadata_download_single: "Lưu & Tải tệp này",
		metadata_edit_single: "Chỉnh sửa chi tiết",
		metadata_remove_file: "Xóa khỏi danh sách",
		metadata_has_tags: "Có tags",
		metadata_no_tags: "Chưa có tags",
		metadata_title_field: "Tiêu đề bài hát (Title)",
		metadata_artist_field: "Nghệ sĩ biểu diễn (Artist)",
		metadata_album_field: "Tên Album",
		metadata_year_field: "Năm phát hành (Year)",
		metadata_track_field: "Số thứ tự bài (Track)",
		metadata_genre_field: "Thể loại nhạc (Genre)",
		metadata_comment_field: "Ghi chú / Nhận xét (Comment)",
		metadata_cover_art: "Ảnh bìa bài hát (Cover Art)",
		metadata_change_cover: "Đổi ảnh bìa",
		metadata_remove_cover: "Gỡ ảnh bìa",
		metadata_no_cover: "Chưa có ảnh bìa",
		metadata_single_dialog_title: "Chỉnh sửa Metadata",
		metadata_batch_dialog_title: "Chỉnh sửa Metadata Hàng loạt",
		metadata_batch_dialog_desc:
			"Đánh dấu tích vào trường bạn muốn thay đổi. Chỉ những trường được chọn mới ghi đè lên các tệp đã chọn.",
		metadata_batch_apply_btn: "Áp dụng và tải xuống",
		metadata_save_and_download: "Lưu & Tải xuống",
		metadata_saving: "Đang cập nhật metadata...",
		metadata_save_success: "Đã cập nhật và lưu tệp thành công!",
		metadata_batch_success: "Đã xử lý xong các tệp được chọn!",
		metadata_read_error: "Không thể đọc metadata của tệp này.",
		metadata_save_error: "Có lỗi khi ghi metadata vào tệp.",
		metadata_unsupported_format: "Định dạng không được hỗ trợ để ghi ID3 tag.",

		// Common
		common_close: "Đóng",
		common_error: "Đã xảy ra lỗi",
		common_help: "Trợ giúp",
		common_file_size: "Dung lượng",
	},
	en: {
		// Navigation
		nav_trim: "Trim & Merge",
		nav_lossless: "Lossless",
		nav_metadata: "Metadata",
		nav_tempo: "Tempo",
		nav_tone: "Key Finder",
		nav_settings: "Settings",

		// Settings Page
		settings_title: "System Settings",
		settings_subtitle:
			"Customize language, theme mode, and expressive dynamic color palette.",
		settings_language_title: "Language",
		settings_language_desc:
			"Choose the display language throughout the application.",
		settings_lang_vi: "Tiếng Việt",
		settings_lang_en: "English",
		settings_theme_title: "Theme Mode",
		settings_theme_desc:
			"Switch between Dark, Light, or automatically adapt to your System settings.",
		settings_theme_dark: "Dark",
		settings_theme_light: "Light",
		settings_theme_system: "System",
		settings_theme_active_label: "Current resolved appearance:",
		settings_palette_title: "Color Palette",
		settings_palette_desc:
			"Powered dynamically by Material Design 3 Expressive 2025 algorithm (MCU). All buttons, cards, and interactive accents automatically harmonize with your selected seed color.",
		settings_palette_custom: "Custom Color (Hex)",
		settings_palette_custom_desc:
			"Enter a hex color code or click the swatch to pick any color.",
		settings_palette_preview: "Theme Palette Live Preview",
		settings_palette_preview_btn: "Primary Button (Filled)",
		settings_palette_preview_tonal: "Secondary Button (Tonal)",
		settings_palette_preview_chip: "Active Chip",
		settings_reset_default: "Reset to Default Palette",
		settings_reset_success: "Default color scheme restored successfully!",
		settings_about_title: "About Application",
		settings_about_desc:
			"Professional in-browser studio suite for lossless audio inspection, spectral analysis, and precision editing powered by Web Audio API.",
		settings_about_feature1_title: "Lossless Inspection & DSP Engine",
		settings_about_feature1_desc:
			"High-res 8192-point FFT, -58 dB Blackman windowing, and multi-threaded Web Workers analyzing cut-off frequencies & fake upscaled audio.",
		settings_about_feature2_title: "20+ Audio Formats Supported",
		settings_about_feature2_desc:
			"Full support for FLAC, WAV (up to 32-bit float), AIFF, ALAC, MP3, AAC, OGG, Opus, WebM, AU... with custom fallback decoders & raw ID3 strip.",
		settings_about_feature3_title: "Comprehensive Studio Tools",
		settings_about_feature3_desc:
			"Millisecond-precision trim & merge, BPM tempo estimation, harmonic tone/key detection, and real-time interactive 2D spectrogram waterfall.",
		settings_about_feature4_title: "100% Client-Side & Private",
		settings_about_feature4_desc:
			"All decoding, spectral calculations, and audio exports run entirely in your browser via Web Audio API with zero server uploads.",

		// MusicTrimMerge
		trim_title: "Studio Audio Trim & Merge",
		trim_desc:
			"Drag dual handles to trim with millisecond precision, splice multiple tracks, and export into various studio formats.",
		trim_drop_title: "Choose or drag & drop audio files here",
		trim_drop_desc:
			"Supports all world formats: WAV, FLAC, AIFF, MP3, M4A, AAC, OGG, Opus, WebM, WMA, ALAC, CAF, AU...",
		trim_playing: "Playing",
		trim_paused: "Paused",
		trim_play: "Play Selection",
		trim_pause: "Pause",
		trim_reset: "Reset Selection",
		trim_add_queue: "Add selection to Merge Queue",
		trim_queue_title: "Merge Queue",
		trim_queue_empty:
			"No segments in queue. Trim a selection and click 'Add selection to Merge Queue'!",
		trim_export_btn: "Concatenate & Export",
		trim_exporting: "Encoding and synthesizing master audio...",
		trim_export_success: "Master audio file exported successfully!",
		trim_select_new: "Choose another file",
		trim_start_time: "Start",
		trim_end_time: "End",
		trim_duration: "Duration",
		trim_channels: "Channels",
		trim_sample_rate: "Sample Rate",
		trim_export_format: "Export Audio Format",
		trim_format_label: "Detected Format",
		trim_global_formats_hint:
			"100% compatible with global digital audio formats",
		trim_zoom_label: "Waveform Zoom",
		trim_zoom_hint:
			"Zoom in to align start and end points with millisecond precision",
		trim_zoom_in: "Zoom In",
		trim_zoom_out: "Zoom Out",
		trim_zoom_reset: "Fit (1x)",
		trim_zoom_to_selection: "Zoom to Selection",
		visualizer_title: "Real-time Frequency Spectrum",
		visualizer_subtitle:
			"Real-time acoustic FFT frequency response (20Hz - 20kHz)",
		visualizer_view_both: "Dual View",
		visualizer_view_waveform: "Waveform",
		visualizer_view_spectrum: "Frequency",
		visualizer_peak: "Peak Freq",

		// LosslessChecker
		lossless_title: "Lossless Audio Quality Checker",
		lossless_desc:
			"Spectral frequency analysis to detect upscaled MP3 files disguised as FLAC or WAV.",
		lossless_help_title: "How does this analysis work?",
		lossless_help_p1:
			"Lossy compression (MP3, AAC) strips out high audio frequencies above 15 kHz - 16 kHz to shrink file size. When a low-bitrate MP3 is transcoded to WAV or FLAC ('fake/upscaled lossless'), the sharp high-frequency shelf cut-off remains permanently embedded.",
		lossless_help_p2:
			"True studio Lossless audio (100% authentic) preserves full harmonic energy reaching smoothly up to 20 kHz - 22 kHz without artificial brickwall filters.",
		lossless_drop_title: "Select FLAC, WAV, AIFF, MP3, M4A file to inspect",
		lossless_drop_desc:
			"Supports all digital audio containers for high-resolution FFT spectral scanning",
		lossless_analyzing: "Analyzing spectral frequency distribution...",
		lossless_result_true: "Verified: Authentic Lossless (Studio Quality)",
		lossless_result_fake: "Warning: Fake Lossless (Upscaled MP3 Detected)",
		lossless_true_badge: "100% True Lossless",
		lossless_fake_badge: "Fake / Upscaled MP3",
		lossless_cutoff_label: "Frequency Cut-off Shelf",
		lossless_score_label: "Spectral Clarity Score",
		lossless_high_power: "High Band Energy (16kHz - 22kHz)",
		lossless_mid_power: "Mid Band Energy (1kHz - 15kHz)",
		lossless_bit_depth_label: "Effective Bit-Depth",
		lossless_texture_label: "HF Spectral Texture",
		lossless_upscaled_badge: "Fake Hi-Res (Upscaled from 16-bit)",
		lossless_score_breakdown: "Multi-Factor Scoring Breakdown",
		lossless_spectrum_chart: "Frequency Power Curve (Peak-Hold & Average FFT)",
		lossless_check_another: "Check another track",

		// TempoDetector
		tempo_title: "Auto Tempo & BPM Detector",
		tempo_desc:
			"Upload an audio file to analyze bass energy peaks and calculate accurate BPM.",
		tempo_drop_title: "Select audio file for automatic Tempo detection",
		tempo_drop_desc: "Supports MP3, WAV, FLAC, OGG, AAC files",
		tempo_analyzing: "Calculating bass onset peaks...",
		tempo_bpm_label: "Tempo (BPM)",
		tempo_confidence: "Detection Confidence",
		tempo_peaks: "Detected Beat Pulses",
		tempo_tap_title: "Manual Tap Tempo",
		tempo_tap_desc:
			"Tap rhythmically along to the beat to calculate BPM manually.",
		tempo_tap_button: "Tap Tempo (TAP)",
		tempo_tap_reset: "Reset Tap",
		tempo_tap_prompt: "Tap at least twice to calculate tempo",
		tempo_check_another: "Measure another file",

		// ToneDetector
		tone_title: "Key & Scale Harmonic Detector",
		tone_desc:
			"Chroma pitch energy analysis to detect the musical root key and scale.",
		tone_help_title: "What is the Camelot System & Harmonic Mixing?",
		tone_help_p1:
			"The Camelot system (e.g., 8B, 8A) numbers musical keys around the Circle of Fifths. Professional DJs use this to mix tracks harmonically without dissonant key clashes.",
		tone_help_p2:
			"Adjacent keys on the Camelot wheel (such as 8B transitioning to 7B, 9B, or 8A) share compatible scale notes, ensuring seamless and melodic transitions.",
		tone_drop_title: "Select music file to detect key & scale",
		tone_drop_desc:
			"Pitch Class Profile algorithm executed entirely client-side",
		tone_analyzing: "Computing 12-pitch chromagram energy...",
		tone_key_label: "Musical Key",
		tone_camelot_label: "Camelot Wheel Code",
		tone_confidence: "Confidence Score",
		tone_chroma_chart: "12-Pitch Energy Distribution (Chromagram)",
		tone_harmonic_title: "Harmonic Mixing Matches",
		tone_harmonic_desc:
			"Mix tracks in the following keys for musically consonant transitions:",
		tone_check_another: "Detect another track",

		// Metadata Editor
		metadata_title: "Audio Metadata Editor",
		metadata_subtitle:
			"Inspect, update track information (ID3 tags), and manage album cover artwork individually or in batch client-side.",
		metadata_drop_title: "Select or drop audio files here",
		metadata_drop_desc:
			"Supports MP3, M4A, MP4, AAC, AIFF... Edits tags losslessly without re-encoding audio data.",
		metadata_select_files: "Browse Audio Files",
		metadata_reading_tags: "Reading metadata from uploaded audio...",
		metadata_empty_title: "No audio files loaded",
		metadata_empty_desc:
			"Upload one or more tracks to view, edit, or batch-update metadata tags and cover artwork.",
		metadata_files_count: "audio tracks",
		metadata_selected_count: "selected",
		metadata_select_all: "Select All",
		metadata_deselect_all: "Deselect All",
		metadata_clear_all: "Clear List",
		metadata_batch_edit: "Batch Edit",
		metadata_batch_download: "Download Selected",
		metadata_download_single: "Save & Download",
		metadata_edit_single: "Edit Metadata",
		metadata_remove_file: "Remove from list",
		metadata_has_tags: "Has Tags",
		metadata_no_tags: "No Tags",
		metadata_title_field: "Track Title",
		metadata_artist_field: "Artist / Performer",
		metadata_album_field: "Album Name",
		metadata_year_field: "Release Year",
		metadata_track_field: "Track Number",
		metadata_genre_field: "Musical Genre",
		metadata_comment_field: "Comment / Notes",
		metadata_cover_art: "Album Cover Artwork",
		metadata_change_cover: "Change Artwork",
		metadata_remove_cover: "Remove Artwork",
		metadata_no_cover: "No artwork attached",
		metadata_single_dialog_title: "Edit Metadata",
		metadata_batch_dialog_title: "Batch Edit Metadata",
		metadata_batch_dialog_desc:
			"Select the fields you want to update across all selected tracks. Unchecked fields will remain untouched.",
		metadata_batch_apply_btn: "Apply & Download Files",
		metadata_save_and_download: "Save & Download",
		metadata_saving: "Updating metadata tags...",
		metadata_save_success: "Metadata updated and audio saved successfully!",
		metadata_batch_success: "Batch processed all selected tracks!",
		metadata_read_error: "Unable to read metadata from this file.",
		metadata_save_error: "An error occurred while writing metadata tags.",
		metadata_unsupported_format:
			"Unsupported audio format for ID3 tag writing.",

		// Common
		common_close: "Close",
		common_error: "An error occurred",
		common_help: "Help",
		common_file_size: "File Size",
	},
};
