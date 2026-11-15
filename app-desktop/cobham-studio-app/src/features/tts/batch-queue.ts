/** Định dạng tệp âm thanh xuất hàng loạt. */
export type BatchFormat = "wav" | "mp3";

/** Trạng thái và kết quả xử lý của từng đoạn trong hàng đợi hàng loạt. */
export interface BatchItemResult {
  blob?: Blob;
  duration?: number;
  error?: string;
  /** Phụ đề SRT (khi bật "Kèm phụ đề"). */
  srt?: string;
  status: "running" | "done" | "error";
  url?: string;
}

/** Thông báo trạng thái hiển thị dưới bảng điều khiển tạo hàng loạt. */
export interface BatchNotice {
  error?: boolean;
  text: string;
}

/** Đếm số mục đã hoàn thành trong bảng kết quả hàng loạt. */
export function countDoneBatch(
  results: Record<number, BatchItemResult>
): number {
  return Object.values(results).filter((r) => r.status === "done").length;
}

/** Trả về danh sách chỉ số các mục chưa hoàn thành để chạy tiếp hoặc tạo lại mục lỗi. */
export function pendingBatchIndices(
  total: number,
  results: Record<number, BatchItemResult>
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < total; i += 1) {
    if (results[i]?.status !== "done") {
      indices.push(i);
    }
  }
  return indices;
}

/** Nhãn nút bắt đầu/tiếp tục tạo hàng loạt dựa theo số mục còn lại. */
export function batchGenerateLabel(
  total: number,
  hasResults: boolean,
  doneCount: number
): string {
  const pendingCount = Math.max(0, total - doneCount);
  if (hasResults && pendingCount > 0) {
    return `Tiếp tục (${pendingCount} mục)`;
  }
  return `Tạo ${total} file`;
}

/** Định dạng dấu thời gian `YYYYMMDD-HHmm` cho tên tệp `.zip` xuất hàng loạt. */
export function formatBatchTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

/** Tạo thông báo sau khi lưu tệp `.zip` hàng loạt. */
export function formatZipNotice(
  audioCount: number,
  subtitleCount: number
): string {
  if (subtitleCount > 0) {
    return `Đã lưu file zip gồm ${audioCount} audio và ${subtitleCount} phụ đề.`;
  }
  return `Đã lưu file zip gồm ${audioCount} audio.`;
}
