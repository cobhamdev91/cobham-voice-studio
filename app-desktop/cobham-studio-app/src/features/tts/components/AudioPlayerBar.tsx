import {
  Anchor,
  Captions,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { useAudioElementSync } from "../hooks/useAudioElementSync";
import {
  formatPlayerClock,
  formatTtfa,
  playbackStatusLabel,
} from "../player-format";
import type { PlaybackStatus } from "../types";
import { AudioWaveformCanvas } from "./AudioWaveformCanvas";
import { ExportMenu } from "./ExportMenu";

/** Props cho thanh phát âm thanh, điều khiển tiến độ và tải xuống bản đọc. */
interface AudioPlayerBarProps {
  audioBlob: Blob | null;
  audioBlobUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Mục đã lưu trên đĩa tải được dù không có blob trong trình duyệt. */
  canDownload?: boolean;
  disabled?: boolean;
  getVisualizerData?: () => Uint8Array | null;
  isPlaying: boolean;
  onChangeVolume: (vol: number) => void;
  onDownload: () => void;
  onDownloadMp3?: () => void;
  /** Tải phụ đề `.srt` của bản audio hiện tại; `undefined` = bản này không có phụ đề. */
  onDownloadSrt?: () => void;
  /** Bỏ trống ở tab không soạn văn bản: ẩn nút "Tạo giọng nói" (vẫn hiện "Dừng tạo" khi đang tạo). */
  onGenerateOrPlay?: () => void;
  onPlayingChange: (playing: boolean) => void;
  onStop: () => void;
  /** "Giữ ổn định": seed cố định, cùng văn bản + giọng thì ra y hệt nhau. */
  onToggleStable?: (enabled: boolean) => void;
  onToggleSubtitles?: (enabled: boolean) => void;
  playbackSpeed?: number;
  /** Tiến độ ước lượng khi đang tạo giọng nói (`null` khi không tạo giọng). */
  progress?: { elapsedMs: number; percent: number } | null;
  selectedVoiceName: string;
  stableEnabled?: boolean;
  status: PlaybackStatus;
  subtitlesEnabled?: boolean;
  ttfaMs: number | null;
  volume: number;
}

/** Thanh phát âm thanh dùng chung dưới đáy workspace: sóng âm, nút tạo/dừng, tuỳ chọn phụ đề/ổn định và xuất file. */
export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  status,
  playbackSpeed = 1,
  ttfaMs,
  audioBlobUrl,
  audioBlob,
  canDownload,
  audioRef: audioElRef,
  isPlaying,
  onPlayingChange,
  selectedVoiceName,
  onGenerateOrPlay,
  onStop,
  onDownload,
  onDownloadMp3,
  onDownloadSrt,
  onToggleSubtitles,
  subtitlesEnabled,
  onToggleStable,
  stableEnabled,
  volume,
  onChangeVolume,
  getVisualizerData,
  disabled,
  progress,
}) => {
  const downloadable = Boolean(audioBlob) || Boolean(canDownload);
  const {
    currentTime,
    duration,
    handleTimeUpdate,
    handleLoadedMetadata,
    togglePlayPause,
    handleSeek,
  } = useAudioElementSync({
    audioRef: audioElRef,
    audioBlobUrl,
    volume,
    onPlayingChange,
  });

  const isGenerating = status === "generating";
  const isBusy = isGenerating;
  const progressPercent = progress?.percent ?? 0;

  return (
    <div className="studio-audio-player">
      {/* Phần tử âm thanh giữ trong nền */}
      {/* biome-ignore lint/a11y/useMediaCaption: audio tổng hợp từ văn bản đang soạn trong studio */}
      <audio
        className="hidden"
        onEmptied={() => onPlayingChange(false)}
        onEnded={() => onPlayingChange(false)}
        onError={() => onPlayingChange(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => onPlayingChange(false)}
        onPlay={() => onPlayingChange(true)}
        onTimeUpdate={handleTimeUpdate}
        ref={audioElRef}
        src={audioBlobUrl ?? undefined}
      />

      <button
        aria-label={isPlaying ? "Tạm dừng" : "Phát lại"}
        className="studio-play-button"
        data-playing={isPlaying || undefined}
        disabled={!audioBlobUrl || isGenerating}
        onClick={togglePlayPause}
        type="button"
      >
        {isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} style={{ marginLeft: 2 }} />
        )}
      </button>

      {/* Nút tạo/dừng tạo và thông tin bản đọc */}
      <div className="flex w-full items-center gap-3 md:w-auto">
        {(onGenerateOrPlay || isBusy) && (
          <Button
            className={`flex-1 select-none font-bold text-xs sm:text-sm md:flex-none ${
              isBusy ? "animate-pulse" : ""
            }`}
            disabled={disabled && !isBusy}
            onClick={isBusy ? onStop : onGenerateOrPlay}
            type="button"
            variant={isBusy ? "destructive" : "studio"}
          >
            {isBusy ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                <span>Dừng tạo</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Tạo giọng nói</span>
              </>
            )}
          </Button>
        )}

        {onToggleSubtitles && (
          <label
            className={`flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2 py-1.5 font-semibold text-xs transition-colors ${
              subtitlesEnabled
                ? "border-violet-500/60 bg-violet-500/10 text-[var(--status-violet)]"
                : "border-[var(--canvas-border)] text-[var(--canvas-muted)] hover:text-[var(--canvas-foreground)]"
            } ${isBusy ? "cursor-not-allowed opacity-50" : ""}`}
            title="Tạo kèm phụ đề .srt (mốc thời gian theo từng câu) để dùng khi dựng video"
          >
            <input
              checked={Boolean(subtitlesEnabled)}
              className="h-3.5 w-3.5 accent-violet-600"
              disabled={isBusy}
              onChange={(e) => onToggleSubtitles(e.target.checked)}
              type="checkbox"
            />
            <Captions className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Phụ đề</span>
          </label>
        )}

        {onToggleStable && (
          <label
            className={`flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2 py-1.5 font-semibold text-xs transition-colors ${
              stableEnabled
                ? "border-sky-500/60 bg-sky-500/10 text-[var(--status-sky)]"
                : "border-[var(--canvas-border)] text-[var(--canvas-muted)] hover:text-[var(--canvas-foreground)]"
            } ${isBusy ? "cursor-not-allowed opacity-50" : ""}`}
            title="Giữ ổn định: cùng văn bản và cùng giọng thì mỗi lần tạo ra giống hệt nhau. Tắt để mỗi lần có ngữ điệu khác."
          >
            <input
              checked={Boolean(stableEnabled)}
              className="h-3.5 w-3.5 accent-sky-600"
              disabled={isBusy}
              onChange={(e) => onToggleStable(e.target.checked)}
              type="checkbox"
            />
            <Anchor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ổn định</span>
          </label>
        )}

        <div className="studio-audio-status flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isGenerating
                  ? "animate-pulse bg-amber-500"
                  : isPlaying || audioBlobUrl
                    ? `${isPlaying ? "animate-pulse" : ""}bg-brand-500`
                    : "bg-[var(--canvas-muted)]"
              }`}
            />
            <span className="font-semibold text-[var(--canvas-foreground)] text-xs capitalize sm:text-sm">
              {playbackStatusLabel(
                isGenerating,
                isPlaying,
                Boolean(audioBlobUrl),
                selectedVoiceName
              )}
            </span>
          </div>

          <span className="text-[12px] text-[var(--canvas-muted)] tabular-nums">
            {selectedVoiceName} ·{" "}
            {playbackSpeed.toLocaleString("vi-VN", {
              minimumFractionDigits: 2,
            })}
            × · WAV / MP3
          </span>
          {!isGenerating && ttfaMs !== null && (
            <div className="mt-0.5 flex items-center gap-1 font-mono font-semibold text-[var(--canvas-accent)] text-xs">
              <Zap className="h-3 w-3 fill-brand-500" />
              <span>Tạo xong: {formatTtfa(ttfaMs)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tiến trình tạo, thanh tua và sóng âm */}
      <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center space-y-1 px-2">
        {isGenerating && (
          <div className="w-full max-w-lg space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-[var(--canvas-muted)]">
                Tiến trình ước tính
              </span>
              <span className="font-bold font-mono text-[var(--canvas-accent)] tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <div
              aria-label="Tiến trình tạo giọng nói ước tính"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPercent}
              aria-valuetext={`Ước tính ${progressPercent} phần trăm`}
              className="h-3 w-full overflow-hidden rounded-full bg-[var(--canvas-border)]"
              role="progressbar"
            >
              <div
                className="h-full min-w-1 rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] text-[var(--canvas-muted)]">
              <span>
                {progressPercent >= 95
                  ? "Vẫn đang xử lý, vui lòng chờ..."
                  : "Đang tổng hợp âm thanh..."}
              </span>
              <span className="font-mono tabular-nums">
                Đã chạy {formatPlayerClock((progress?.elapsedMs ?? 0) / 1000)}
              </span>
            </div>
          </div>
        )}
        <AudioWaveformCanvas
          getVisualizerData={getVisualizerData}
          hidden={isGenerating}
          isPlaying={isPlaying}
        />

        {!isGenerating && audioBlobUrl && duration > 0 && (
          <div className="flex w-full max-w-full items-center gap-2 font-mono text-[12px] text-[var(--canvas-muted)]">
            <span>{formatPlayerClock(currentTime)}</span>
            <input
              aria-label="Tua tiến độ phát âm thanh"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-[var(--canvas-border)] accent-[var(--canvas-accent)]"
              max={duration}
              min={0}
              onChange={(e) => handleSeek(Number.parseFloat(e.target.value))}
              step={0.1}
              type="range"
              value={currentTime}
            />
            <span>{formatPlayerClock(duration)}</span>
          </div>
        )}
      </div>

      {/* Điều khiển xuất file và âm lượng */}
      <div className="flex w-full items-center justify-end gap-2 md:w-auto">
        <ExportMenu
          downloadable={downloadable}
          onDownload={onDownload}
          onDownloadMp3={onDownloadMp3}
          onDownloadSrt={onDownloadSrt}
        />

        <div className="flex items-center gap-1.5 border-border/60 border-l pl-2">
          <button
            aria-label={volume === 0 ? "Bật âm thanh" : "Tắt âm thanh"}
            className="rounded-lg p-1.5 text-[var(--canvas-muted)] transition-colors hover:text-[var(--canvas-foreground)]"
            onClick={() => onChangeVolume(volume === 0 ? 1 : 0)}
            title="Bật/Tắt âm thanh"
            type="button"
          >
            {volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            aria-label="Âm lượng phát"
            className="h-1.5 w-14 cursor-pointer appearance-none rounded-lg bg-[var(--canvas-border)] accent-[var(--canvas-accent)]"
            max="1"
            min="0"
            onChange={(e) => onChangeVolume(Number.parseFloat(e.target.value))}
            step="0.05"
            title={`Âm lượng: ${Math.round(volume * 100)}%`}
            type="range"
            value={volume}
          />
        </div>
      </div>
    </div>
  );
};
