import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceRecorderOptions {
  /** Tab đang mở hay không; khi rời tab thì tự dừng thu âm để giải phóng micro. */
  active: boolean;
  onRecorded: (raw: Blob) => Promise<void> | void;
  onRecorderError: (message: string) => void;
}

/** Kết quả trả về của hook `useVoiceRecorder`. */
export interface UseVoiceRecorderResult {
  isRecording: boolean;
  recordSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * Quản lý thu âm từ micro qua `MediaRecorder`, đếm giây đang thu và giải phóng
 * track/micro tự động khi người dùng dừng hoặc chuyển sang tab khác.
 */
export function useVoiceRecorder({
  active,
  onRecorded,
  onRecorderError,
}: UseVoiceRecorderOptions): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopRecording();
    }
  }, [active, stopRecording]);

  useEffect(() => stopRecording, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        await onRecorded(
          new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          })
        );
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000
      );
    } catch (err) {
      const reason =
        err instanceof Error && err.message ? err.message : String(err);
      onRecorderError(
        `Không mở được micro: ${reason}. Hãy cho phép ứng dụng dùng micro trong cài đặt quyền riêng tư của hệ điều hành.`
      );
    }
  }, [onRecorded, onRecorderError]);

  return {
    isRecording,
    recordSeconds,
    startRecording,
    stopRecording,
  };
}
