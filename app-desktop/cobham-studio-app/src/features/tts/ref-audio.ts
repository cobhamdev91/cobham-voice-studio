// Giọng mẫu để nhân bản: engine chỉ dùng tối đa 8 giây có tiếng (sau khi cắt im
// lặng hai đầu). Giữ 15 giây là dư, và file ghi âm dài hàng giờ không phải gửi
// trọn lên server (60 phút = 330 MB WAV) chỉ để lấy vài giây đầu.
export const REF_MAX_SECONDS = 15;

/** Các định dạng file giọng mẫu được phép chọn trong tab Nhân bản giọng. */
export const REF_SOURCE_EXTENSIONS = [".mp3", ".wav", ".m4a"] as const;
export const REF_SOURCE_ACCEPT = `${REF_SOURCE_EXTENSIONS.join(",")},audio/mpeg,audio/wav,audio/mp4`;
export const REF_SOURCE_FORMATS = "MP3, WAV hoặc M4A";

const VOICE_THRESHOLD = 0.01; // ~ -40 dBFS: dưới mức này coi là im lặng / ồn nền
const LEAD_SECONDS = 0.1; // giữ chút im lặng trước tiếng đầu tiên

/** Kiểm tra đuôi file âm thanh mẫu có thuộc danh sách hỗ trợ hay không. */
export function isSupportedRefAudio(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return REF_SOURCE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Định dạng bộ đếm thời gian thu âm mẫu `MM:SS`. */
export function formatRecordDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

/**
 * ``[start, end)`` của đoạn cần giữ: bắt đầu ngay trước mẫu có tiếng đầu tiên,
 * dài tối đa ``maxSeconds``. Toàn im lặng thì lấy từ đầu.
 */
export function voicedWindow(
  samples: Float32Array,
  sampleRate: number,
  maxSeconds: number = REF_MAX_SECONDS
): [number, number] {
  let first = 0;
  while (
    first < samples.length &&
    Math.abs(samples[first]) <= VOICE_THRESHOLD
  ) {
    first++;
  }
  if (first >= samples.length) {
    first = 0;
  }
  const start = Math.max(0, first - Math.round(LEAD_SECONDS * sampleRate));
  const end = Math.min(
    samples.length,
    start + Math.round(maxSeconds * sampleRate)
  );
  return [start, end];
}
