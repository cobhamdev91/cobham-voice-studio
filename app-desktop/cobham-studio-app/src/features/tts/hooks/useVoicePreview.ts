import { useCallback, useEffect, useRef, useState } from "react";
import { fetchVoicePreview } from "../api";
import type { VoiceOption } from "../types";

/** Trạng thái phát nghe thử của một giọng trong danh sách. */
export type PreviewPlaybackState = "idle" | "loading" | "playing";

/** Kết quả trả về của hook `useVoicePreview`. */
export interface UseVoicePreviewResult {
  clearPreviewError: () => void;
  previewError: string | null;
  previewId: string | null;
  previewState: "loading" | "playing";
  stopPreview: () => void;
  togglePreview: (voice: VoiceOption) => Promise<void>;
}

/**
 * Quản lý phát nghe thử một giọng đọc tại một thời điểm: huỷ request cũ,
 * giải phóng Blob URL khi dừng và tự tắt khi component unmount hoặc bị khoá.
 */
export function useVoicePreview(
  apiUrl?: string,
  disabled?: boolean
): UseVoicePreviewResult {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<"loading" | "playing">(
    "loading"
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopPreview = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPreviewId(null);
  }, []);

  useEffect(() => stopPreview, [stopPreview]);

  // Đang tạo giọng nói chính thì dừng nghe thử để hai âm thanh không chồng nhau.
  useEffect(() => {
    if (disabled) {
      stopPreview();
    }
  }, [disabled, stopPreview]);

  const togglePreview = useCallback(
    async (voice: VoiceOption) => {
      const wasThis = previewId === voice.id;
      stopPreview();
      if (wasThis || !apiUrl) {
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setPreviewError(null);
      setPreviewId(voice.id);
      setPreviewState("loading");
      try {
        const blob = await fetchVoicePreview(
          apiUrl,
          voice.id,
          controller.signal
        );
        if (controller.signal.aborted) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        urlRef.current = url;
        audioRef.current = audio;
        audio.onended = () => {
          if (audioRef.current === audio) {
            stopPreview();
          }
        };
        await audio.play();
        setPreviewState("playing");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        stopPreview();
        const reason = error instanceof Error ? error.message : String(error);
        setPreviewError(`Không nghe thử được "${voice.name}": ${reason}`);
      }
    },
    [apiUrl, previewId, stopPreview]
  );

  const clearPreviewError = useCallback(() => setPreviewError(null), []);

  return {
    previewId,
    previewState,
    previewError,
    clearPreviewError,
    stopPreview,
    togglePreview,
  };
}
