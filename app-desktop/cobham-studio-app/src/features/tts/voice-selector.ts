import type { VoiceOption } from "./types";

/** Giới hạn và bước nhảy mặc định của thanh điều chỉnh tốc độ đọc. */
export const SPEED_MIN = 0.75;
export const SPEED_MAX = 1.5;
export const SPEED_NORMAL = 1.0;
export const SPEED_STEP = 0.05;

/** Bộ lọc giọng đọc theo giới tính hoặc giọng nhân bản cá nhân. */
export type VoiceGenderFilter = "all" | "female" | "male" | "cloned";

// Số bảng màu avatar trong global.css (.studio-voice-avatar[data-tone]).
const VOICE_TONES = 8;

/**
 * Ép tốc độ về trong khoảng cho phép và làm tròn 2 chữ số thập phân để tránh sai số
 * dấu phẩy động kiểu `1.0500000000000003`.
 */
export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return SPEED_NORMAL;
  }
  return (
    Math.round(Math.min(SPEED_MAX, Math.max(SPEED_MIN, value)) * 100) / 100
  );
}

/** Tăng hoặc giảm tốc độ theo từng bước `SPEED_STEP` rồi chuẩn hoá trong khoảng hợp lệ. */
export function stepSpeed(value: number, direction: number): number {
  return clampSpeed(value + direction * SPEED_STEP);
}

/** Phân tích chuỗi người dùng đang nhập ở ô tốc độ (chấp nhận cả dấu phẩy tiếng Việt). */
export function parseSpeedDraft(draft: string, fallback: number): number {
  const parsed = Number.parseFloat(draft.replace(",", "."));
  return Number.isFinite(parsed) ? clampSpeed(parsed) : fallback;
}

/**
 * Băm `id` giọng ra chỉ số `0..7` để mỗi giọng luôn giữ một màu avatar ổn định
 * theo thuộc tính `data-tone`.
 */
export function voiceColorIndex(id: string): number {
  let hash = 7;
  for (const char of id) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2_147_483_647;
  }
  return hash % VOICE_TONES;
}

/** Lấy tối đa 2 chữ cái viết tắt cuối của tên giọng để hiển thị trong avatar. */
export function voiceInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .filter(Boolean)
    .slice(-2)
    .join("");
}

/** Lọc danh sách giọng theo ngôn ngữ đang chọn và nhóm giới tính/giọng nhân bản. */
export function filterVoices(
  voices: VoiceOption[],
  filterGender: VoiceGenderFilter,
  activeLanguage?: string | null
): VoiceOption[] {
  return voices.filter((voice) => {
    const languageMatched =
      !(activeLanguage && voice.language) || voice.language === activeLanguage;
    if (!languageMatched) {
      return false;
    }
    if (filterGender === "cloned") {
      return Boolean(voice.isCloned);
    }
    if (filterGender === "female") {
      return voice.gender === "female";
    }
    if (filterGender === "male") {
      return voice.gender === "male";
    }
    return true;
  });
}
