import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import type React from "react";
import type { BatchItemResult } from "../batch-queue";

interface BatchItemRowProps {
  fileName: string;
  index: number;
  label: string;
  onDownload: () => void;
  result?: BatchItemResult;
  text: string;
}

function StatusBadge({ result }: { result?: BatchItemResult }) {
  if (!result) {
    return <span className="text-muted-foreground">Chờ tạo</span>;
  }
  if (result.status === "running") {
    return (
      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo...
      </span>
    );
  }
  if (result.status === "error") {
    return (
      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-3.5 w-3.5" /> Lỗi
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {result.duration ? `${result.duration.toFixed(1)}s` : "Xong"}
    </span>
  );
}

/** Hiển thị một dòng trạng thái, lỗi và trình phát xem trước cho mỗi đoạn hàng loạt. */
export const BatchItemRow: React.FC<BatchItemRowProps> = ({
  index,
  label,
  text,
  fileName,
  result,
  onDownload,
}) => {
  return (
    <div className="space-y-1.5 rounded-xl border border-border/70 bg-secondary/20 p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 font-bold font-mono text-brand-700 dark:text-brand-300">
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted-foreground">
          {index + 1}. {fileName}
        </span>
        <StatusBadge result={result} />
        {result?.status === "done" && (
          <button
            aria-label={`Tải ${fileName}`}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={onDownload}
            title="Tải file này"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="line-clamp-2 whitespace-pre-line text-foreground/90 text-xs">
        {text}
      </p>
      {result?.status === "error" && (
        <p className="text-[12px] text-rose-600 dark:text-rose-400">
          {result.error}
        </p>
      )}
      {result?.url && (
        // biome-ignore lint/a11y/useMediaCaption: audio TTS do người dùng tự tạo, chữ đã nằm ngay trên
        <audio
          className="h-8 w-full"
          controls
          preload="none"
          src={result.url}
        />
      )}
    </div>
  );
};
