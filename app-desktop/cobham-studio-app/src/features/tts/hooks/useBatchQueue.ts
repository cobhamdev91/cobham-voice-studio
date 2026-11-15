import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech, synthesizeSpeechWithSubtitles } from "../api";
import { downloadBlobAsFile } from "../audio-engine";
import { type BatchItem, batchFileName } from "../batch-parse";
import {
  type BatchFormat,
  type BatchItemResult,
  type BatchNotice,
  batchGenerateLabel,
  countDoneBatch,
  formatBatchTimestamp,
  formatZipNotice,
  pendingBatchIndices,
} from "../batch-queue";
import { srtBlob } from "../history";
import { createZip } from "../zip";

interface UseBatchQueueOptions {
  apiUrl: string;
  format: BatchFormat;
  items: BatchItem[];
  speed: number;
  voiceId: string;
  withSubtitles: boolean;
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Quản lý hàng đợi tạo giọng nói hàng loạt, huỷ ngang, thu hồi blob URL và
 * đóng gói tải lẻ hoặc `.zip` kèm phụ đề `.srt`.
 */
export function useBatchQueue({
  apiUrl,
  items,
  voiceId,
  speed,
  format,
  withSubtitles,
}: UseBatchQueueOptions) {
  const [results, setResults] = useState<Record<number, BatchItemResult>>({});
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<BatchNotice | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Giữ URL để thu hồi khi xoá kết quả hoặc rời tab (tránh rò bộ nhớ blob).
  const urlsRef = useRef<string[]>([]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      for (const u of urlsRef.current) {
        URL.revokeObjectURL(u);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    for (const u of urlsRef.current) {
      URL.revokeObjectURL(u);
    }
    urlsRef.current = [];
    setResults({});
  }, []);

  const fileNameOf = useCallback(
    (i: number) => batchFileName(i, items.length, items[i].label, format),
    [format, items]
  );

  // Phụ đề trùng tên với audio (001-P1.wav <-> 001-P1.srt) để phần mềm dựng video tự ghép.
  const srtNameOf = useCallback(
    (i: number) => batchFileName(i, items.length, items[i].label, "srt"),
    [items]
  );

  const generateOne = async (i: number, signal: AbortSignal) => {
    setResults((r) => ({ ...r, [i]: { status: "running" } }));
    try {
      const params = { text: items[i].text, voiceId, speed, format };
      let srt: string | undefined;
      let res: Awaited<ReturnType<typeof synthesizeSpeech>>;
      if (withSubtitles) {
        const r = await synthesizeSpeechWithSubtitles(apiUrl, params, signal);
        res = r;
        srt = r.srt;
      } else {
        res = await synthesizeSpeech(apiUrl, params, signal);
      }
      const url = URL.createObjectURL(res.blob);
      urlsRef.current.push(url);
      setResults((r) => ({
        ...r,
        [i]: {
          status: "done",
          blob: res.blob,
          url,
          duration: res.durationSeconds,
          srt,
        },
      }));
      return true;
    } catch (e) {
      if (signal.aborted) {
        setResults((r) => {
          const next = { ...r };
          delete next[i];
          return next;
        });
        return false;
      }
      setResults((r) => ({
        ...r,
        [i]: { status: "error", error: errorText(e) },
      }));
      return true;
    }
  };

  const handleGenerate = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setNotice(null);
    const todo = pendingBatchIndices(items.length, results);
    for (const i of todo) {
      if (controller.signal.aborted) {
        break;
      }
      await generateOne(i, controller.signal);
    }
    setRunning(false);
    abortRef.current = null;
    setNotice(
      controller.signal.aborted
        ? { text: 'Đã dừng. Bấm "Tiếp tục" để tạo các mục còn lại.' }
        : { text: "Đã tạo xong. Tải từng file hoặc tải tất cả (.zip)." }
    );
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleDownloadOne = (i: number) => {
    const blob = results[i]?.blob;
    if (blob) {
      downloadBlobAsFile(blob, fileNameOf(i));
    }
    const srt = results[i]?.srt;
    if (srt) {
      downloadBlobAsFile(srtBlob(srt), srtNameOf(i));
    }
  };

  const handleDownloadZip = async () => {
    const entries = await Promise.all(
      items.map(async (_, i) => {
        const blob =
          results[i]?.status === "done" ? results[i].blob : undefined;
        return blob
          ? {
              name: fileNameOf(i),
              data: new Uint8Array(await blob.arrayBuffer()),
            }
          : null;
      })
    );
    const files = entries.filter((e) => e !== null);
    if (files.length === 0) {
      return;
    }
    const encoder = new TextEncoder();
    const subtitleFiles = items.flatMap((_, i) => {
      const srt = results[i]?.status === "done" ? results[i].srt : undefined;
      return srt
        ? [{ name: srtNameOf(i), data: encoder.encode(`\uFEFF${srt}`) }]
        : [];
    });
    const audioCount = files.length;
    files.push(...subtitleFiles);
    const ok = await downloadBlobAsFile(
      createZip(files),
      `tao-hang-loat-${formatBatchTimestamp()}.zip`
    );
    if (ok) {
      setNotice({ text: formatZipNotice(audioCount, subtitleFiles.length) });
    }
  };

  const doneCount = countDoneBatch(results);
  const hasResults = Object.keys(results).length > 0;
  const pendingCount = items.length - doneCount;
  const generateLabel = batchGenerateLabel(items.length, hasResults, doneCount);

  return {
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
  };
}
