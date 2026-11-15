import { Laugh, Megaphone, Pause, Sparkles, Wind } from "lucide-react";
import type React from "react";
import { useModelCaps } from "../model-caps";

/** Props cho thanh chèn nhanh thẻ cảm xúc và khoảng nghỉ vào văn bản. */
interface EmotionBarProps {
  disabled?: boolean;
  onInsertTag: (tag: string) => void;
}

const EMOTION_CLASS = {
  sky: "border-[color-mix(in_srgb,var(--emotion-sky)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-sky)_15%,transparent)] text-[var(--emotion-sky)] hover:border-[color-mix(in_srgb,var(--emotion-sky)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--emotion-sky)_25%,transparent)]",
  emerald:
    "border-[color-mix(in_srgb,var(--emotion-emerald)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-emerald)_15%,transparent)] text-[var(--emotion-emerald)] hover:border-[color-mix(in_srgb,var(--emotion-emerald)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--emotion-emerald)_25%,transparent)]",
  amber:
    "border-[color-mix(in_srgb,var(--emotion-amber)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-amber)_15%,transparent)] text-[var(--emotion-amber)] hover:border-[color-mix(in_srgb,var(--emotion-amber)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--emotion-amber)_25%,transparent)]",
  purple:
    "border-[color-mix(in_srgb,var(--emotion-purple)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-purple)_15%,transparent)] text-[var(--emotion-purple)] hover:border-[color-mix(in_srgb,var(--emotion-purple)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--emotion-purple)_25%,transparent)]",
  slate:
    "border-[color-mix(in_srgb,var(--emotion-slate)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-slate)_15%,transparent)] text-[var(--emotion-slate)] hover:border-[color-mix(in_srgb,var(--emotion-slate)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--emotion-slate)_25%,transparent)]",
} as const;

type EmotionHue = keyof typeof EMOTION_CLASS;

const EMOTIONS: Array<{
  tag: string;
  label: string;
  icon: typeof Laugh;
  hue: EmotionHue;
}> = [
  {
    tag: "[cười]",
    label: "Cười",
    icon: Laugh,
    hue: "amber",
  },
  {
    tag: "[hắng giọng]",
    label: "Hắng giọng",
    icon: Megaphone,
    hue: "purple",
  },
  {
    tag: "[thở dài]",
    label: "Thở dài",
    icon: Wind,
    hue: "sky",
  },
];

// The goc cua Supertonic (mo hinh nhieu ngon ngu): chen thang, may chu giu nguyen.
const SUPERTONIC_EMOTIONS: typeof EMOTIONS = [
  { ...EMOTIONS[0], tag: "<laugh>" },
  {
    tag: "<breath>",
    label: "Lấy hơi",
    icon: Wind,
    hue: "emerald",
  },
  { ...EMOTIONS[2], tag: "<sigh>" },
];

const PAUSE_TAG = "[nghỉ 1s]";

/** Thanh nút chèn nhanh thẻ cảm xúc (`[cười]`, `[thở dài]`...) và thẻ nghỉ theo mô hình đang chọn. */
export const EmotionBar: React.FC<EmotionBarProps> = ({
  onInsertTag,
  disabled,
}) => {
  // Mo hinh doc nhieu ngon ngu (Supertonic) dung the rieng <laugh> <breath> <sigh>.
  const { languages, supportsEmotions } = useModelCaps();
  const multilingual = languages.length > 0;
  // Kokoro khong co the cam xuc: chi con nut chen the nghi.
  let emotions = multilingual ? SUPERTONIC_EMOTIONS : EMOTIONS;
  if (!supportsEmotions) {
    emotions = [];
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-[var(--canvas-border)] bg-[var(--canvas)] px-2.5 py-1 sm:py-1.5">
      <div className="flex items-center gap-1.5 font-medium text-[var(--canvas-foreground)] text-xs sm:text-[13px]">
        <Sparkles
          aria-hidden="true"
          className="h-3.5 w-3.5 text-[var(--emotion-amber)]"
        />
        <span>Cảm xúc:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {emotions.map((item) => (
          <button
            className={`inline-flex select-none items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold text-xs shadow-xs transition-all active:scale-95 sm:text-[13px] ${
              EMOTION_CLASS[item.hue]
            } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            disabled={disabled}
            key={item.tag}
            onClick={() => onInsertTag(item.tag)}
            title={`Chèn thẻ cảm xúc ${item.tag}`}
            type="button"
          >
            <item.icon aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{item.label}</span>
            <code className="ml-0.5 font-mono text-[12px] opacity-75 sm:text-[12px]">
              {item.tag}
            </code>
          </button>
        ))}
        {/* The nghi: server tach van ban tai the va chen dung so giay im lang.
            Chay voi moi mo hinh, khong rieng v3 Turbo. Sua so giay sau khi chen. */}
        <button
          className={`inline-flex select-none items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold text-xs shadow-xs transition-all active:scale-95 sm:text-[13px] ${EMOTION_CLASS.slate} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          disabled={disabled}
          onClick={() => onInsertTag(PAUSE_TAG)}
          title="Chèn khoảng nghỉ. Sửa số giây trong thẻ: [nghỉ 2s], [nghỉ 0.5s], [nghỉ 500ms] - tối đa 10 giây."
          type="button"
        >
          <Pause className="h-3.5 w-3.5" />
          <span>Khoảng nghỉ</span>
          <code className="ml-0.5 font-mono text-[12px] opacity-75 sm:text-[12px]">
            {PAUSE_TAG}
          </code>
        </button>
      </div>
    </div>
  );
};
