import type React from "react";
import { useEffect, useState } from "react";
import { toggleAudioPlayback } from "../playback";

interface UseAudioElementSyncOptions {
  audioBlobUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onPlayingChange: (playing: boolean) => void;
  volume: number;
}

/** Kết quả đồng bộ trạng thái `<audio>` dùng chung cho thanh phát đáy. */
export interface UseAudioElementSyncResult {
  currentTime: number;
  duration: number;
  handleLoadedMetadata: () => void;
  handleSeek: (time: number) => void;
  handleTimeUpdate: () => void;
  togglePlayPause: () => void;
}

/**
 * Đồng bộ âm lượng, tự phát bản mới và thời lượng/tiến độ của `<audio>`
 * dùng chung giữa lịch sử đọc và thanh phát đáy.
 */
export function useAudioElementSync({
  audioRef,
  audioBlobUrl,
  volume,
  onPlayingChange,
}: UseAudioElementSyncOptions): UseAudioElementSyncResult {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: audioRef là RefObject ổn định truyền từ cha
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Cả lịch sử và thanh dưới dùng duy nhất bộ phát này.
  useEffect(() => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setDuration(0);
    onPlayingChange(false);
    if (!(audio && audioBlobUrl)) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    void toggleAudioPlayback(audio);
    return () => audio.pause();
  }, [audioBlobUrl, audioRef, onPlayingChange]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) {
      return;
    }
    void toggleAudioPlayback(audioRef.current);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return {
    currentTime,
    duration,
    handleTimeUpdate,
    handleLoadedMetadata,
    togglePlayPause,
    handleSeek,
  };
}
