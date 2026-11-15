import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useVoicePreview } from "../hooks/useVoicePreview";
import { describeVoice, useModelCaps } from "../model-caps";
import type { VoiceOption } from "../types";
import { voiceDetail } from "../voice-label";
import { filterVoices, type VoiceGenderFilter } from "../voice-selector";
import { SpeedControl } from "./SpeedControl";
import { VoiceListItem } from "./VoiceListItem";

function VoiceErrorAlert({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-rose-700 text-xs dark:text-rose-300"
      role="alert"
    >
      <span className="min-w-0 flex-1">{message}</span>
      <button
        aria-label="Đóng thông báo"
        className="font-bold"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

/** Props cho panel chọn giọng đọc và điều chỉnh tốc độ bên phải studio. */
interface VoiceSelectorProps {
  /** Có thì hiện nút nghe thử trên từng giọng. */
  apiUrl?: string;
  disabled?: boolean;
  onChangeSpeed: (speed: number) => void;
  onCloneVoice?: () => void;
  /** Xoá giọng nhân bản đã lưu; không truyền thì không hiện nút xoá. */
  onDeleteVoice?: (voiceId: string) => Promise<void>;
  onSelectVoice: (voiceId: string) => void;
  selectedVoiceId: string;
  speed: number;
  voices: VoiceOption[];
}

const GENDER_FILTERS: ReadonlyArray<{
  label: string;
  value: VoiceGenderFilter;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "cloned", label: "Của tôi" },
];

/** Bộ chọn giọng đọc theo bộ lọc ngôn ngữ/giới tính, nghe thử, xoá giọng nhân bản và tốc độ đọc. */
export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  apiUrl,
  onCloneVoice,
  voices,
  selectedVoiceId,
  onSelectVoice,
  speed,
  onChangeSpeed,
  onDeleteVoice,
  disabled,
}) => {
  const { language, languageName, languages, setLanguage } = useModelCaps();

  // Giọng và ngôn ngữ phải khớp nhau: đổi bên nào thì bên kia cập nhật theo.
  const lastVoiceId = useRef(selectedVoiceId);
  useEffect(() => {
    const current = voices.find((v) => v.id === selectedVoiceId);
    const voiceChanged = lastVoiceId.current !== selectedVoiceId;
    lastVoiceId.current = selectedVoiceId;
    if (!(language && current?.language) || current.language === language) {
      return;
    }
    if (voiceChanged) {
      if (languages.some((l) => l.code === current.language)) {
        setLanguage(current.language);
      }
      return;
    }
    const first = voices.find((v) => v.language === language);
    if (first) {
      onSelectVoice(first.id);
    }
  }, [
    language,
    languages,
    voices,
    selectedVoiceId,
    onSelectVoice,
    setLanguage,
  ]);

  const {
    previewId,
    previewState,
    previewError,
    clearPreviewError,
    togglePreview,
  } = useVoicePreview(apiUrl, disabled);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState<VoiceGenderFilter>("all");

  const handleDelete = async (voice: VoiceOption) => {
    if (
      !(
        onDeleteVoice &&
        // biome-ignore lint/suspicious/noAlert: xac nhan truoc thao tac khong hoan tac
        window.confirm(
          `Xoá giọng nhân bản "${voice.name}"?\nThao tác này không hoàn tác được.`
        )
      )
    ) {
      return;
    }
    setDeletingId(voice.id);
    setDeleteError(null);
    try {
      await onDeleteVoice(voice.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setDeleteError(`Không xoá được "${voice.name}": ${reason}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVoices = filterVoices(voices, filterGender, language);
  const selectedRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedVoiceId && filterGender) {
      selectedRowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedVoiceId, filterGender]);

  return (
    <div className="studio-voice-selector flex h-full flex-col">
      <div className="studio-voice-heading">
        <h2>Giọng đọc</h2>
        {onCloneVoice && (
          <button
            className="text-primary text-xs"
            onClick={onCloneVoice}
            type="button"
          >
            + Nhân bản giọng
          </button>
        )}
      </div>
      <fieldset aria-label="Lọc giọng đọc" className="studio-voice-filter">
        {GENDER_FILTERS.map((filter) => (
          <button
            aria-pressed={filterGender === filter.value}
            key={filter.value}
            onClick={() => setFilterGender(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </fieldset>

      {deleteError && (
        <VoiceErrorAlert
          message={deleteError}
          onClose={() => setDeleteError(null)}
        />
      )}

      {previewError && (
        <VoiceErrorAlert message={previewError} onClose={clearPreviewError} />
      )}

      <div className="studio-voice-list">
        {filteredVoices.length === 0 ? (
          <div className="flex h-20 flex-col items-center justify-center text-muted-foreground text-xs">
            <span>Không tìm thấy giọng đọc phù hợp</span>
          </div>
        ) : (
          filteredVoices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            const description =
              languages.length > 0
                ? describeVoice(voice.description ?? "", languageName)
                : voiceDetail(voice) || "Giọng đọc có sẵn";
            return (
              <VoiceListItem
                canDelete={Boolean(onDeleteVoice && voice.isCloned)}
                canPreview={Boolean(apiUrl)}
                deleteBusy={deletingId === voice.id}
                deleteDisabled={Boolean(disabled || deletingId !== null)}
                description={description}
                disabled={disabled}
                isSelected={isSelected}
                key={voice.id}
                onDelete={() => handleDelete(voice)}
                onSelect={() => onSelectVoice(voice.id)}
                onTogglePreview={() => togglePreview(voice)}
                previewState={previewId === voice.id ? previewState : "idle"}
                rowRef={isSelected ? selectedRowRef : undefined}
                voice={voice}
              />
            );
          })
        )}
      </div>

      <SpeedControl
        disabled={disabled}
        onChangeSpeed={onChangeSpeed}
        speed={speed}
      />
    </div>
  );
};
