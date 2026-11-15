import { Captions, Download } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";

/** Props cho trình đơn thả xuống xuất âm thanh WAV, MP3 và phụ đề SRT. */
export interface ExportMenuProps {
  downloadable: boolean;
  onDownload: () => void;
  onDownloadMp3?: () => void;
  onDownloadSrt?: () => void;
}

const EXPORT_ITEM_ACTIVE =
  "bg-[var(--canvas-border)] text-[var(--canvas-foreground)] shadow-sm active:scale-95";
const EXPORT_ITEM_DISABLED =
  "cursor-not-allowed border-transparent bg-[var(--canvas-border)] text-[var(--canvas-muted)] opacity-40";

/**
 * Menu "Xuất file" dạng `<details>` hỗ trợ đóng khi bấm ra ngoài, nhấn Esc
 * hoặc sau khi bấm chọn một định dạng tải về.
 */
export const ExportMenu: React.FC<ExportMenuProps> = ({
  downloadable,
  onDownload,
  onDownloadMp3,
  onDownloadSrt,
}) => {
  const exportRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const close = () => exportRef.current?.removeAttribute("open");
    const onPointerDown = (e: PointerEvent) => {
      const menu = exportRef.current;
      if (menu?.open && !menu.contains(e.target as Node)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    const onMenuClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".studio-export-menu button:not(:disabled)")) {
        close();
      }
    };
    const menu = exportRef.current;
    menu?.addEventListener("click", onMenuClick);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      menu?.removeEventListener("click", onMenuClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details className="studio-export" ref={exportRef}>
      <summary>Xuất file ▾</summary>
      <div className="studio-export-menu">
        <button
          className={`flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold text-xs transition-all ${
            downloadable
              ? `${EXPORT_ITEM_ACTIVE} hover:border-brand-500/50 hover:bg-brand-500/10`
              : EXPORT_ITEM_DISABLED
          }`}
          disabled={!downloadable}
          onClick={onDownload}
          title={downloadable ? "Tải xuống file WAV" : "Chưa có audio để tải"}
          type="button"
        >
          <Download className="h-3.5 w-3.5 text-brand-500" />
          <span>WAV</span>
        </button>

        {onDownloadMp3 && (
          <button
            className={`flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold text-xs transition-all ${
              downloadable
                ? `${EXPORT_ITEM_ACTIVE} hover:border-sky-500/50 hover:bg-sky-500/10`
                : EXPORT_ITEM_DISABLED
            }`}
            disabled={!downloadable}
            onClick={onDownloadMp3}
            title={
              downloadable ? "Tải xuống file MP3 nén" : "Chưa có audio để tải"
            }
            type="button"
          >
            <Download className="h-3.5 w-3.5 text-[var(--status-sky)]" />
            <span>MP3</span>
          </button>
        )}

        {onDownloadSrt && (
          <button
            className={`flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold text-xs transition-all ${EXPORT_ITEM_ACTIVE} hover:border-violet-500/50 hover:bg-violet-500/10`}
            onClick={onDownloadSrt}
            title="Tải phụ đề .srt (cùng tên với file audio)"
            type="button"
          >
            <Captions className="h-3.5 w-3.5 text-[var(--status-violet)]" />
            <span>SRT</span>
          </button>
        )}
      </div>
    </details>
  );
};
