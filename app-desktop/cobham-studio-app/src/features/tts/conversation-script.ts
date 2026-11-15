import type { VoiceOption } from "./types";

const SPEAKER_LINE_PATTERN = /^\s*(?:\[([^\]]+)\]|([^:]+))\s*:/gm;
const TRAILING_SPACE = /\s+$/;

/** Kết quả đối chiếu lại giọng đọc cho từng nhân vật trong kịch bản hội thoại. */
export interface ReconcileSpeakersResult {
  changed: boolean;
  mapping: Record<string, string>;
  replaced: Record<string, string>;
  voiceNames: Record<string, string>;
}

/** Tách danh sách tên nhân vật duy nhất theo thứ tự xuất hiện trong kịch bản. */
export function extractSpeakers(script: string): string[] {
  const speakers = new Set<string>();
  for (const match of script.matchAll(SPEAKER_LINE_PATTERN)) {
    const speaker = (match[1] || match[2]).trim();
    if (speaker) {
      speakers.add(speaker);
    }
  }
  return Array.from(speakers);
}

/** Sinh tên `"Người N"` chưa trùng để thêm nhân vật mới vào kịch bản. */
export function nextSpeakerName(existing: string[]): string {
  const taken = new Set(existing.map((name) => name.toLowerCase()));
  let n = existing.length + 1;
  while (taken.has(`người ${n}`)) {
    n += 1;
  }
  return `Người ${n}`;
}

/** Nối thêm dòng thoại cho nhân vật kế tiếp ở cuối kịch bản hiện tại. */
export function appendSpeakerLine(script: string, existing: string[]): string {
  const line = `[${nextSpeakerName(existing)}]: `;
  const trimmed = script.replace(TRAILING_SPACE, "");
  return trimmed ? `${trimmed}\n${line}` : line;
}

/**
 * Tự động phân bổ giọng cho nhân vật mới và thay thế giọng đã bị xoá hoặc
 * không còn trong model hiện tại, đồng thời trả về thông báo thay thế nếu có.
 */
export function reconcileSpeakerVoices(
  detectedSpeakers: string[],
  voices: readonly VoiceOption[],
  currentMapping: Readonly<Record<string, string>>,
  previousVoiceNames: Readonly<Record<string, string>>
): ReconcileSpeakersResult {
  const next = { ...currentMapping };
  const replaced: Record<string, string> = {};
  let changed = false;

  detectedSpeakers.forEach((speaker, idx) => {
    if (voices.some((voice) => voice.id === next[speaker])) {
      return;
    }
    const assignedVoice = voices[idx % voices.length];
    const oldId = next[speaker];
    if (oldId) {
      const oldName = previousVoiceNames[oldId] ?? oldId;
      replaced[speaker] =
        `Giọng "${oldName}" của ${speaker} không còn, đã đổi sang "${assignedVoice.name}".`;
    }
    next[speaker] = assignedVoice.id;
    changed = true;
  });

  const voiceNames = Object.fromEntries(
    voices.map((voice) => [voice.id, voice.name])
  );

  return { changed, mapping: next, replaced, voiceNames };
}

/**
 * Kiểm tra mọi nhân vật đều có giọng hợp lệ trong `voices`; trả về bảng ánh xạ
 * đã lọc hoặc `null` nếu có nhân vật thiếu giọng hợp lệ.
 */
export function buildValidSpeakerMapping(
  detectedSpeakers: readonly string[],
  speakerMapping: Readonly<Record<string, string>>,
  voices: readonly VoiceOption[]
): Record<string, string> | null {
  const hasInvalid = detectedSpeakers.some(
    (speaker) => !voices.some((voice) => voice.id === speakerMapping[speaker])
  );
  if (hasInvalid) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(speakerMapping).filter(([, id]) =>
      voices.some((v) => v.id === id)
    )
  );
}
