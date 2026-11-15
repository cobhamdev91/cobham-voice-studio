import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileDown,
  FileUp,
  Layers,
  ListOrdered,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadBlobAsFile } from "../audio-engine";
import { parseBatchScript } from "../batch-parse";
import type { BatchFormat } from "../batch-queue";
import { useBatchQueue } from "../hooks/useBatchQueue";
import { LanguageSelect, useModelCaps } from "../model-caps";
import { readTextFile } from "../read-text-file";
import type { VoiceOption } from "../types";
import { groupVoices, voiceOptionLabel } from "../voice-label";
import { BatchItemRow } from "./BatchItemRow";

/** Props cho tab tạo giọng nói hàng loạt theo từng đoạn đánh dấu `[P1]`, `[P2]`... */
interface BatchTabProps {
  apiUrl: string;
  defaultVoiceId: string;
  voices: VoiceOption[];
}

const SAMPLE = `[P1]
Xin chào quý khách, chào mừng đến với cửa hàng.

[P2]
Chương trình khuyến mãi giảm giá 20% [nghỉ 1s] áp dụng đến hết tháng này.

[P3]
Cảm ơn quý khách đã lắng nghe. [cười]`;

// Ban tieng Anh cho mo hinh nhieu ngon ngu (Supertonic), dung the cam xuc rieng cua no.
const SAMPLE_FOREIGN = `[P1]
Hello and welcome to our store.

[P2]
Enjoy 20% off everything [nghỉ 1s] until the end of this month.

[P3]
Thank you for listening. <laugh>`;

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Tab xử lý hàng loạt đoạn văn bản theo mốc `[P1]`, `[P2]` và đóng gói tải về `.zip`. */
export const BatchTab: React.FC<BatchTabProps> = ({
  apiUrl,
  voices,
  defaultVoiceId,
}) => {
  const sample = useModelCaps().languages.length > 0 ? SAMPLE_FOREIGN : SAMPLE;
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState(defaultVoiceId);
  const [format, setFormat] = useState<BatchFormat>("wav");
  const [speed, setSpeed] = useState(1);
  const [withSubtitles, setWithSubtitles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Chua co giong, hoac giong dang chon vua bi xoa -> ve giong mac dinh.
  useEffect(() => {
    if (voices.length > 0 && !voices.some((v) => v.id === voiceId)) {
      setVoiceId(defaultVoiceId || voices[0].id);
    }
  }, [defaultVoiceId, voiceId, voices]);

  const parsed = useMemo(() => parseBatchScript(script), [script]);
  const items = parsed.items;
  const {
    clearResults,
    doneCount,
    fileNameOf,
    generateLabel,
    handleDownloadOne,
    handleDownloadZip,
    handleGenerate,
    handleStop,
    hasResults,
    notice,
    pendingCount,
    results,
    running,
    setNotice,
  } = useBatchQueue({
    apiUrl,
    items,
    voiceId,
    speed,
    format,
    withSubtitles,
  });

  // Sua van ban sau khi da tao -> ket qua cu khong con khop thu tu/noi dung.
  const updateScript = (value: string) => {
    if (running) {
      return;
    }
    if (hasResults) {
      clearResults();
      setNotice({ text: "Văn bản đã thay đổi - kết quả cũ đã được xoá." });
    }
    setScript(value);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    try {
      const content = await readTextFile(file);
      if (
        script.trim() &&
        // biome-ignore lint/suspicious/noAlert: xac nhan don gian truoc khi ghi de
        !window.confirm("Thay nội dung đang có bằng nội dung file này?")
      ) {
        return;
      }
      updateScript(content);
      setNotice({ text: `Đã nạp ${file.name}.` });
    } catch (e) {
      setNotice({ text: `Không đọc được file: ${errorText(e)}`, error: true });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // File mau: BOM UTF-8 + xuong dong CRLF de Notepad cu tren Windows mo dung dau
  // tieng Viet va dung dong. Khi tai len lai, TextDecoder tu bo BOM.
  const handleDownloadTemplate = () => {
    const content = `\uFEFF${sample.replace(/\n/g, "\r\n")}\r\n`;
    downloadBlobAsFile(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
      "mau-tao-hang-loat.txt"
    );
  };

  return (
    <div className="studio-tab-grid studio-batch-layout fade-in-50 animate-in duration-300">
      {/* Cot trai: nhap van ban */}
      <div className="studio-span-5 space-y-3">
        <div className="studio-tab-card space-y-3 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <div className="studio-section-heading flex items-center justify-between gap-2 border-border/60 border-b pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-500" />
              <h3 className="font-bold text-foreground text-sm">
                Tạo hàng loạt
              </h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <input
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-muted-foreground text-xs hover:bg-secondary/80 hover:text-foreground disabled:opacity-40"
                disabled={running}
                onClick={() => fileInputRef.current?.click()}
                title="Chọn file .txt trên máy để nạp nội dung vào ô nhập"
                type="button"
              >
                <FileUp className="h-3.5 w-3.5" /> Tải lên TXT
              </button>
              <button
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-muted-foreground text-xs hover:bg-secondary/80 hover:text-foreground"
                onClick={handleDownloadTemplate}
                title="Tải về file TXT mẫu, soạn nội dung trong Notepad rồi tải lên lại"
                type="button"
              >
                <FileDown className="h-3.5 w-3.5" /> File mẫu
              </button>
              <button
                className="rounded-lg px-2 py-1 font-medium text-muted-foreground text-xs hover:bg-secondary/80 hover:text-foreground disabled:opacity-40"
                disabled={running}
                onClick={() => updateScript(sample)}
                title="Chèn văn bản mẫu vào ô nhập"
                type="button"
              >
                Chèn mẫu
              </button>
              <button
                aria-label="Xoá văn bản"
                className="rounded-lg p-1 text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
                disabled={running || !script}
                onClick={() => updateScript("")}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Đặt mốc <code className="font-mono text-foreground">[P1]</code>,{" "}
            <code className="font-mono text-foreground">[P2]</code>... ở đầu
            dòng. Mỗi mốc thành{" "}
            <strong className="text-foreground">một file audio</strong>, nội
            dung kéo dài tới mốc kế tiếp. Dùng được thẻ cảm xúc, thẻ{" "}
            <code className="font-mono">[nghỉ 1s]</code> và từ điển phát âm.
          </p>

          <textarea
            className="h-60 w-full resize-y rounded-xl border border-border/80 bg-secondary/20 p-3 font-sans text-[14px] text-foreground leading-relaxed outline-none focus:border-brand-500 disabled:opacity-70"
            disabled={running}
            onChange={(e) => updateScript(e.target.value)}
            placeholder={sample}
            spellCheck={false}
            value={script}
          />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <LanguageSelect className="col-span-2" disabled={running} />
            <label className="col-span-2 space-y-1">
              <span className="font-semibold text-foreground/90">
                Giọng đọc
              </span>
              <select
                className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 outline-none focus:border-brand-500"
                disabled={running}
                onChange={(e) => setVoiceId(e.target.value)}
                value={voiceId}
              >
                {groupVoices(voices).map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {voiceOptionLabel(v)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-foreground/90">
                Tốc độ: {speed.toFixed(2)}x
              </span>
              <input
                className="w-full accent-brand-500"
                disabled={running}
                max={1.5}
                min={0.75}
                onChange={(e) => setSpeed(Number(e.target.value))}
                step={0.05}
                type="range"
                value={speed}
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-foreground/90">
                Định dạng
              </span>
              <select
                className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 outline-none focus:border-brand-500"
                disabled={running || hasResults}
                onChange={(e) => setFormat(e.target.value as BatchFormat)}
                title={hasResults ? "Xoá kết quả để đổi định dạng" : undefined}
                value={format}
              >
                <option value="wav">WAV (chất lượng gốc)</option>
                <option value="mp3">MP3 (nhẹ hơn)</option>
              </select>
            </label>
            <label
              className="col-span-2 flex cursor-pointer select-none items-center gap-2"
              title="Mỗi file audio kèm một file .srt cùng tên (mốc thời gian theo từng câu)"
            >
              <input
                checked={withSubtitles}
                className="h-3.5 w-3.5 accent-violet-600"
                disabled={running || hasResults}
                onChange={(e) => setWithSubtitles(e.target.checked)}
                type="checkbox"
              />
              <span className="font-semibold text-foreground/90">
                Kèm phụ đề (.srt)
              </span>
              <span className="text-muted-foreground">
                - dùng khi dựng video
              </span>
            </label>
          </div>

          {notice && (
            <div
              aria-live="polite"
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-medium text-[13px] ${
                notice.error
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300"
              }`}
              role="status"
            >
              {notice.error ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}
          {/* Nut tao dinh o day man hinh khi cuon, khong bi day xuong duoi thanh phat */}
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 rounded-b-2xl bg-card px-5 pt-2 pb-5">
            {running ? (
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 font-semibold text-sm text-white shadow-md transition-all hover:bg-rose-600 active:scale-95"
                onClick={handleStop}
                type="button"
              >
                <Square className="h-4 w-4" /> Dừng ({doneCount}/{items.length})
              </button>
            ) : (
              <Button
                className="w-full"
                disabled={items.length === 0 || !voiceId || pendingCount === 0}
                onClick={handleGenerate}
                size="studio"
                type="button"
                variant="studio"
              >
                <Play className="h-4 w-4" /> {generateLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cot phai: danh sach muc + tai ve */}
      <div className="studio-span-7 flex flex-col">
        <div className="studio-tab-card flex flex-1 flex-col space-y-3 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <div className="studio-section-heading flex items-center justify-between gap-2 border-border/60 border-b pb-3">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-brand-500" />
              <h3 className="font-bold text-foreground text-sm">
                Danh sách file ({items.length})
              </h3>
              {hasResults && (
                <span className="text-muted-foreground text-xs">
                  · đã tạo {doneCount}/{items.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {hasResults && !running && (
                <button
                  className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-muted-foreground text-xs hover:bg-secondary/80 hover:text-foreground"
                  onClick={() => {
                    clearResults();
                    setNotice(null);
                  }}
                  title="Xoá kết quả để tạo lại từ đầu"
                  type="button"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Tạo lại từ đầu
                </button>
              )}
              <Button
                className="h-auto rounded-lg px-3 py-1.5 text-xs"
                disabled={doneCount === 0 || running}
                onClick={handleDownloadZip}
                size="sm"
                type="button"
                variant="studio"
              >
                <FileArchive className="h-3.5 w-3.5" /> Tải tất cả (.zip)
              </Button>
            </div>
          </div>

          {!parsed.hasMarkers && items.length === 1 && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
              Chưa có mốc [P1], [P2]... - toàn bộ văn bản sẽ thành một file.
            </p>
          )}
          {parsed.emptyMarkers > 0 && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
              Bỏ qua {parsed.emptyMarkers} mốc không có nội dung.
            </p>
          )}

          <div className="max-h-[60vh] min-h-[200px] flex-1 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && (
              <p className="py-10 text-center text-muted-foreground text-xs">
                Nhập văn bản có mốc [P1], [P2]... hoặc bấm "Mẫu" để xem ví dụ.
              </p>
            )}
            {items.map((item, i) => (
              <BatchItemRow
                fileName={fileNameOf(i)}
                index={i}
                // biome-ignore lint/suspicious/noArrayIndexKey: thu tu muc chinh la dinh danh (ket qua gan theo chi so)
                key={i}
                label={item.label}
                onDownload={() => handleDownloadOne(i)}
                result={results[i]}
                text={item.text}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
