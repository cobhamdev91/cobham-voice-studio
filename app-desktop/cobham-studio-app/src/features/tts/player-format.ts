/** Định dạng số giây thành chuỗi `phút:giây` cho thanh tua âm thanh. */
export function formatPlayerClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/** Định dạng thời gian tạo xong (`ms` hoặc `s`). */
export function formatTtfa(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

/** Nhãn trạng thái hiển thị bên cạnh nút phát của thanh phát đáy. */
export function playbackStatusLabel(
  isGenerating: boolean,
  isPlaying: boolean,
  hasAudio: boolean,
  voiceName: string
): string {
  if (isGenerating) {
    return "Đang tạo giọng nói...";
  }
  if (isPlaying) {
    return `Đang phát (${voiceName})`;
  }
  if (hasAudio) {
    return `Đã tạo xong (${voiceName})`;
  }
  return `Sẵn sàng (${voiceName})`;
}

/**
 * Chiều cao thanh sóng thứ `index`: theo dữ liệu phân tích khi đang phát, sóng giả
 * khi chưa có dữ liệu live, hoặc sóng tĩnh khi đang chờ.
 */
export function waveBarHeight(
  index: number,
  numBars: number,
  isLive: boolean,
  data: Uint8Array | null,
  height: number,
  nowMs = Date.now()
): number {
  if (!isLive) {
    return 4 + Math.abs(Math.sin(index * 0.9) * Math.cos(index * 0.37)) * 16;
  }
  if (data && data.length > 0) {
    const dataIdx = Math.floor((index / numBars) * data.length);
    return Math.max(3, (data[dataIdx] / 255) * height);
  }
  return 3 + Math.sin(nowMs / 150 + index) * 6;
}
