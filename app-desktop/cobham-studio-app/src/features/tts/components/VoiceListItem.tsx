import { Check, Loader2, Play, Square, Star, Trash2 } from "lucide-react";
import type React from "react";
import type { PreviewPlaybackState } from "../hooks/useVoicePreview";
import type { VoiceOption } from "../types";
import { voiceColorIndex, voiceInitials } from "../voice-selector";

interface DeleteVoiceButtonProps {
  busy: boolean;
  disabled?: boolean;
  name: string;
  onDelete: () => void;
}

function DeleteVoiceButton({
  busy,
  disabled,
  name,
  onDelete,
}: DeleteVoiceButtonProps) {
  return (
    <button
      aria-label={`Xoá giọng ${name}`}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-40"
      disabled={disabled}
      onClick={(e) => {
        // Nút nằm trong thẻ giọng: không để cú bấm xoá chọn luôn giọng đó.
        e.stopPropagation();
        onDelete();
      }}
      title="Xoá giọng nhân bản này (chỉ xoá được giọng của mô hình đang dùng)"
      type="button"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

interface PreviewVoiceButtonProps {
  disabled?: boolean;
  name: string;
  onToggle: () => void;
  state: PreviewPlaybackState;
}

function PreviewVoiceButton({
  disabled,
  name,
  onToggle,
  state,
}: PreviewVoiceButtonProps) {
  let icon = <Play className="h-3.5 w-3.5 fill-current" />;
  if (state === "loading") {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  } else if (state === "playing") {
    icon = <Square className="h-3 w-3 fill-current" />;
  }
  return (
    <button
      aria-label={
        state === "idle" ? `Nghe thử giọng ${name}` : `Dừng nghe thử ${name}`
      }
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
        state === "idle"
          ? "text-muted-foreground hover:bg-secondary hover:text-brand-600 dark:hover:text-brand-400"
          : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
      }`}
      disabled={disabled}
      onClick={(e) => {
        // Nút nằm trong thẻ giọng: nghe thử không được chọn luôn giọng đó.
        e.stopPropagation();
        onToggle();
      }}
      title={
        state === "loading"
          ? "Đang đọc mẫu (lần đầu mất vài giây)..."
          : "Nghe thử giọng này"
      }
      type="button"
    >
      {icon}
    </button>
  );
}

/** Props cho một dòng giọng đọc trong danh sách `VoiceSelector`. */
export interface VoiceListItemProps {
  canDelete: boolean;
  canPreview: boolean;
  deleteBusy: boolean;
  deleteDisabled: boolean;
  description: string;
  disabled?: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onSelect: () => void;
  onTogglePreview: () => void;
  previewState: PreviewPlaybackState;
  rowRef?: React.Ref<HTMLDivElement>;
  voice: VoiceOption;
}

/** Một mục giọng đọc gồm avatar theo màu `id`, tên, mô tả vùng miền và các nút nghe thử/xoá. */
export const VoiceListItem: React.FC<VoiceListItemProps> = ({
  voice,
  description,
  isSelected,
  disabled,
  canPreview,
  previewState,
  canDelete,
  deleteBusy,
  deleteDisabled,
  rowRef,
  onSelect,
  onTogglePreview,
  onDelete,
}) => (
  <div
    className={`studio-voice-row ${isSelected ? "studio-voice-selected" : ""} ${disabled ? "opacity-60" : ""}`}
    ref={rowRef}
  >
    <button
      aria-pressed={isSelected}
      className="flex min-w-0 flex-1 items-center gap-2 text-left"
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="studio-voice-avatar"
          data-tone={voiceColorIndex(voice.id)}
        >
          {voiceInitials(voice.name)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-[13px] text-foreground">
              {voice.name}
            </span>
            {voice.featured && (
              <Star
                aria-label="Giọng tác giả VieNeu-TTS chọn"
                className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
              />
            )}
          </div>
          <p className="line-clamp-1 text-muted-foreground text-xs">
            {description}
          </p>
        </div>
      </div>
    </button>

    <div className="flex items-center gap-1.5">
      {canPreview && (
        <PreviewVoiceButton
          disabled={disabled}
          name={voice.name}
          onToggle={onTogglePreview}
          state={previewState}
        />
      )}
      {canDelete && (
        <DeleteVoiceButton
          busy={deleteBusy}
          disabled={deleteDisabled}
          name={voice.name}
          onDelete={onDelete}
        />
      )}
      {isSelected && (
        <div className="zoom-in-50 flex h-4.5 w-4.5 animate-in items-center justify-center rounded-full bg-brand-600 text-white shadow-xs">
          <Check className="h-3 w-3 stroke-[3]" />
        </div>
      )}
    </div>
  </div>
);
