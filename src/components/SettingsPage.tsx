/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Button,
  IconButton,
  Card,
  Text,
  Divider,
  Icon,
  useTheme,
  useSnackbar,
  Chip,
  Badge,
  TextField,
} from "@bug-on/m3-expressive";
import { useLanguage } from "../i18n/LanguageContext";
import { AppLogo } from "./AppLogo";

export interface ColorPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  hex: string;
  descriptionVi: string;
  descriptionEn: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "synthwave",
    nameVi: "Synthwave Tím",
    nameEn: "Synthwave Violet",
    hex: "#795290",
    descriptionVi: "Tím Synthwave hoài niệm & huyền bí",
    descriptionEn: "Classic retro synthwave violet",
  },
  {
    id: "cyan",
    nameVi: "Cyber Neon Cyan",
    nameEn: "Cyber Neon Cyan",
    hex: "#00838F",
    descriptionVi: "Xanh ngọc Neon tương lai nổi bật",
    descriptionEn: "High-contrast futuristic neon cyan",
  },
  {
    id: "magenta",
    nameVi: "Hoàng Hôn Magenta",
    nameEn: "Sunset Magenta",
    hex: "#C2185B",
    descriptionVi: "Sắc hồng cam rực rỡ thập niên 80",
    descriptionEn: "80s outrun vibrant sunset magenta",
  },
  {
    id: "emerald",
    nameVi: "Ma Trận Emerald",
    nameEn: "Emerald Matrix",
    hex: "#00796B",
    descriptionVi: "Xanh ngọc bích đậm chất công nghệ",
    descriptionEn: "Deep cyber emerald tech green",
  },
  {
    id: "amber",
    nameVi: "Hổ Phách Cyber",
    nameEn: "Amber Voltage",
    hex: "#B78103",
    descriptionVi: "Vàng cam năng lượng ấm áp",
    descriptionEn: "Warm energetic amber voltage",
  },
  {
    id: "blue",
    nameVi: "Đại Dương Electric",
    nameEn: "Electric Blue",
    hex: "#1565C0",
    descriptionVi: "Xanh biển sâu sắc nét & tĩnh lặng",
    descriptionEn: "Deep energetic ocean blue",
  },
  {
    id: "m3-classic",
    nameVi: "Material Classic",
    nameEn: "M3 Classic Indigo",
    hex: "#6750A4",
    descriptionVi: "Tím chàm Google Material 3 tiêu chuẩn",
    descriptionEn: "Standard Google Material 3 indigo",
  },
  {
    id: "crimson",
    nameVi: "Laser Crimson",
    nameEn: "Laser Crimson",
    hex: "#B71C1C",
    descriptionVi: "Đỏ Laser mạnh mẽ & đam mê",
    descriptionEn: "Bold high-energy laser crimson",
  },
];

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { mode, setMode, sourceColor, setSourceColor, effectiveMode } = useTheme();
  const { showSnackbar } = useSnackbar();

  const [customHexInput, setCustomHexInput] = useState(sourceColor);
  const [hexError, setHexError] = useState<string | null>(null);

  const handleSelectColor = (hex: string) => {
    setSourceColor(hex);
    setCustomHexInput(hex);
    setHexError(null);
  };

  const handleCustomHexChange = (val: string) => {
    setCustomHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSourceColor(val);
      setHexError(null);
    } else if (val.length >= 7) {
      setHexError(
        language === "vi"
          ? "Mã màu Hex phải có dạng #RRGGBB (ví dụ #795290)"
          : "Hex color must be in #RRGGBB format (e.g. #795290)"
      );
    } else {
      setHexError(null);
    }
  };

  const handleApplyCustomHex = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHexInput)) {
      handleSelectColor(customHexInput);
    } else {
      setHexError(
        language === "vi"
          ? "Vui lòng nhập đúng định dạng mã màu #RRGGBB"
          : "Please enter a valid #RRGGBB hex color"
      );
    }
  };

  const handleResetDefaults = () => {
    setMode("dark");
    setSourceColor("#795290");
    setCustomHexInput("#795290");
    setHexError(null);
    setLanguage("vi");
    showSnackbar({
      message: t("settings_reset_success"),
      withDismissAction: true,
    });
  };

  const isCurrentColor = (hex: string) => {
    return sourceColor.toLowerCase() === hex.toLowerCase();
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full overflow-hidden" id="settings-page">
      {/* Header Card */}
      <Card
        variant="outlined"
        className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <IconButton colorStyle="tonal" aria-label="Settings icon" className="shrink-0">
            <Icon name="settings" className="text-m3-primary" size={24} />
          </IconButton>
          <div>
            <Text variant="headline-sm" className="font-bold text-m3-on-surface">
              {t("settings_title")}
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant mt-0.5">
              {t("settings_subtitle")}
            </Text>
          </div>
        </div>

        <Button
          colorStyle="outlined"
          onClick={handleResetDefaults}
          icon={<Icon name="restart_alt" size={18} />}
          className="hidden sm:inline-flex shrink-0 text-xs"
        >
          {t("settings_reset_default")}
        </Button>
      </Card>

      {/* SECTION 1: LANGUAGE (i18n) */}
      <Card
        variant="outlined"
        className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
      >
        <div className="flex items-center gap-2.5">
          <Icon name="translate" className="text-m3-primary" size={24} />
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">
              {t("settings_language_title")}
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              {t("settings_language_desc")}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Vietnamese */}
          <Card
            variant={language === "vi" ? "filled" : "outlined"}
            interactive
            onClick={() => setLanguage("vi")}
            className={`p-4 sm:p-5 flex items-center justify-between rounded-xl transition-all cursor-pointer ${
              language === "vi"
                ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs"
                : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-3xl select-none" role="img" aria-label="Vietnam Flag">🇻🇳</span>
              <div>
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                  {t("settings_lang_vi")}
                </Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant text-xs mt-0.5">
                  Mặc định / Tiếng Việt phổ thông
                </Text>
              </div>
            </div>
            {language === "vi" ? (
              <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center shrink-0">
                <Icon name="check" size={16} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-m3-outline-variant/60 shrink-0" />
            )}
          </Card>

          {/* English */}
          <Card
            variant={language === "en" ? "filled" : "outlined"}
            interactive
            onClick={() => setLanguage("en")}
            className={`p-4 sm:p-5 flex items-center justify-between rounded-xl transition-all cursor-pointer ${
              language === "en"
                ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs"
                : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="text-3xl select-none" role="img" aria-label="US Flag">🇺🇸</span>
              <div>
                <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                  {t("settings_lang_en")}
                </Text>
                <Text variant="body-sm" className="text-m3-on-surface-variant text-xs mt-0.5">
                  International English
                </Text>
              </div>
            </div>
            {language === "en" ? (
              <div className="w-6 h-6 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center shrink-0">
                <Icon name="check" size={16} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-m3-outline-variant/60 shrink-0" />
            )}
          </Card>
        </div>
      </Card>

      {/* SECTION 2: THEME MODE (Dark / Light / System) */}
      <Card
        variant="outlined"
        className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Icon name="brightness_medium" className="text-m3-primary" size={24} />
            <div>
              <Text variant="title-md" className="font-semibold text-m3-on-surface">
                {t("settings_theme_title")}
              </Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant">
                {t("settings_theme_desc")}
              </Text>
            </div>
          </div>

          <Chip
            variant="assist"
            leadingIcon={<Icon name="contrast" size={14} />}
            label={`${t("settings_theme_active_label")}: ${effectiveMode.toUpperCase()}`}
            className="hidden sm:inline-flex text-xs font-mono h-7"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Dark Mode */}
          <Card
            variant={mode === "dark" ? "filled" : "outlined"}
            interactive
            onClick={() => setMode("dark")}
            className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-xl text-center transition-all cursor-pointer ${
              mode === "dark"
                ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs"
                : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                mode === "dark" ? "bg-m3-primary text-m3-on-primary" : "bg-m3-surface-container-high text-m3-on-surface-variant"
              }`}
            >
              <Icon name="dark_mode" size={22} />
            </div>
            <div>
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                {t("settings_theme_dark")}
              </Text>
              <Text variant="label-sm" className="text-m3-on-surface-variant text-[11px] mt-0.5">
                OLED / Deep Black
              </Text>
            </div>
          </Card>

          {/* Light Mode */}
          <Card
            variant={mode === "light" ? "filled" : "outlined"}
            interactive
            onClick={() => setMode("light")}
            className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-xl text-center transition-all cursor-pointer ${
              mode === "light"
                ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs"
                : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                mode === "light" ? "bg-m3-primary text-m3-on-primary" : "bg-m3-surface-container-high text-m3-on-surface-variant"
              }`}
            >
              <Icon name="light_mode" size={22} />
            </div>
            <div>
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                {t("settings_theme_light")}
              </Text>
              <Text variant="label-sm" className="text-m3-on-surface-variant text-[11px] mt-0.5">
                High Contrast Day
              </Text>
            </div>
          </Card>

          {/* System Mode */}
          <Card
            variant={mode === "system" ? "filled" : "outlined"}
            interactive
            onClick={() => setMode("system")}
            className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-xl text-center transition-all cursor-pointer ${
              mode === "system"
                ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs"
                : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                mode === "system" ? "bg-m3-primary text-m3-on-primary" : "bg-m3-surface-container-high text-m3-on-surface-variant"
              }`}
            >
              <Icon name="desktop_windows" size={22} />
            </div>
            <div>
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                {t("settings_theme_system")}
              </Text>
              <Text variant="label-sm" className="text-m3-on-surface-variant text-[11px] mt-0.5">
                Auto OS Match
              </Text>
            </div>
          </Card>
        </div>
      </Card>

      {/* SECTION 3: COLOR PALETTE */}
      <Card
        variant="outlined"
        className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
      >
        <div className="flex items-center gap-2.5">
          <Icon name="palette" className="text-m3-primary" size={24} />
          <div>
            <Text variant="title-md" className="font-semibold text-m3-on-surface">
              {t("settings_palette_title")}
            </Text>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              {t("settings_palette_desc")}
            </Text>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = isCurrentColor(preset.hex);
            return (
              <Card
                key={preset.id}
                variant={isSelected ? "filled" : "outlined"}
                interactive
                onClick={() => handleSelectColor(preset.hex)}
                className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-m3-primary-container/30 border-2 border-m3-primary shadow-xs ring-1 ring-m3-primary/30"
                    : "bg-m3-surface-container-low/60 border-m3-outline-variant/40 hover:bg-m3-surface-container"
                }`}
              >
                {/* Color Swatch */}
                <div
                  className="w-10 h-10 rounded-full shrink-0 shadow-inner flex items-center justify-center border border-m3-outline/30"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && (
                    <Icon name="check" size={18} className="text-white drop-shadow-md" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Text variant="label-lg" className="font-semibold text-m3-on-surface truncate block">
                    {language === "vi" ? preset.nameVi : preset.nameEn}
                  </Text>
                  <Text variant="label-sm" className="text-m3-on-surface-variant font-mono text-[11px] block mt-0.5">
                    {preset.hex.toUpperCase()}
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom Color Input Card */}
        <Card
          variant="filled"
          className="p-4 sm:p-5 rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-m3-outline-variant/60 shadow-xs shrink-0 bg-m3-surface flex items-center justify-center">
              <input
                type="color"
                value={sourceColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="w-16 h-16 -m-2.5 cursor-pointer border-0 p-0 bg-transparent"
                title="Pick custom color"
              />
            </div>
            <div>
              <Text variant="title-sm" className="font-semibold text-m3-on-surface">
                {t("settings_palette_custom")}
              </Text>
              <Text variant="body-sm" className="text-m3-on-surface-variant text-xs mt-0.5">
                {t("settings_palette_custom_desc")}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-36">
              <TextField
                variant="outlined"
                label="HEX"
                value={customHexInput}
                onChange={handleCustomHexChange}
                placeholder="#795290"
                maxLength={7}
                error={!!hexError}
                errorText={hexError || undefined}
                className="font-mono uppercase text-sm"
              />
            </div>
            <Button
              colorStyle="tonal"
              onClick={handleApplyCustomHex}
              icon={<Icon name="check" size={16} />}
              className="text-xs shrink-0"
            >
              OK
            </Button>
          </div>
        </Card>

        {/* Live Preview Card */}
        <Card
          variant="outlined"
          className="p-5 rounded-2xl border-m3-outline-variant/40 bg-m3-surface-container-low/60 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <Text variant="title-sm" className="font-semibold text-m3-on-surface flex items-center gap-2">
              <Icon name="visibility" size={18} className="text-m3-primary" />
              {t("settings_palette_preview")}
            </Text>
            <Badge className="text-xs font-mono px-2.5 py-0.5 bg-m3-primary text-m3-on-primary">
              {sourceColor.toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button colorStyle="filled" icon={<Icon name="check" size={16} />}>
              {t("settings_palette_preview_btn")}
            </Button>

            <Button colorStyle="tonal" icon={<Icon name="star" size={16} />}>
              {t("settings_palette_preview_tonal")}
            </Button>

            <Chip
              label={t("settings_palette_preview_chip")}
              selected={true}
              variant="filter"
            />
          </div>
        </Card>
      </Card>

      {/* SECTION 4: ABOUT APP & ARCHITECTURE */}
      <Card
        variant="outlined"
        className="p-4 sm:p-6 flex flex-col gap-5 overflow-hidden bg-m3-surface-container-lowest/40 rounded-2xl border-m3-outline-variant/40"
      >
        <div className="flex items-center gap-3.5">
          <AppLogo size={42} className="shrink-0 drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <Text variant="title-md" className="font-semibold text-m3-on-surface">
                {t("settings_about_title")}
              </Text>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-m3-primary/15 text-m3-primary border border-m3-primary/30">
                v1.0.0
              </span>
            </div>
            <Text variant="body-sm" className="text-m3-on-surface-variant">
              {t("settings_about_desc")}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Card
            variant="outlined"
            className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
          >
            <Icon name="security" className="text-m3-primary shrink-0 mt-0.5" size={20} />
            <Text variant="body-sm" className="text-m3-on-surface">
              {t("settings_about_feature1")}
            </Text>
          </Card>

          <Card
            variant="outlined"
            className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
          >
            <Icon name="layers" className="text-m3-primary shrink-0 mt-0.5" size={20} />
            <Text variant="body-sm" className="text-m3-on-surface">
              {t("settings_about_feature2")}
            </Text>
          </Card>

          <Card
            variant="outlined"
            className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
          >
            <Icon name="auto_awesome" className="text-m3-primary shrink-0 mt-0.5" size={20} />
            <Text variant="body-sm" className="text-m3-on-surface">
              {t("settings_about_feature3")}
            </Text>
          </Card>

          <Card
            variant="outlined"
            className="p-4 rounded-xl border-m3-outline-variant/30 bg-m3-surface-container-low/40 flex items-start gap-3"
          >
            <Icon name="audio_file" className="text-m3-primary shrink-0 mt-0.5" size={20} />
            <Text variant="body-sm" className="text-m3-on-surface">
              {t("settings_about_feature4")}
            </Text>
          </Card>
        </div>
      </Card>

      {/* Mobile Reset button */}
      <div className="sm:hidden pt-2">
        <Button
          colorStyle="outlined"
          onClick={handleResetDefaults}
          icon={<Icon name="restart_alt" size={18} />}
          className="w-full text-xs"
        >
          {t("settings_reset_default")}
        </Button>
      </div>
    </div>
  );
}
