import { Sliders } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  clampSpeed,
  parseSpeedDraft,
  SPEED_MAX,
  SPEED_MIN,
  SPEED_NORMAL,
  SPEED_STEP,
  stepSpeed,
} from "../voice-selector";

/** Props cho cụm điều chỉnh tốc độ đọc (nút -/+, ô nhập số và thanh trượt). */
export interface SpeedControlProps {
  disabled?: boolean;
  onChangeSpeed: (speed: number) => void;
  speed: number;
}

/** Cụm điều chỉnh tốc độ đọc giữ bản nháp chuỗi khi đang nhập để tránh nhảy số giữa chừng. */
export const SpeedControl: React.FC<SpeedControlProps> = ({
  speed,
  disabled,
  onChangeSpeed,
}) => {
  const [speedDraft, setSpeedDraft] = useState<string>(speed.toFixed(2));
  const [speedFocused, setSpeedFocused] = useState(false);

  // Nút trượt / nút +- đổi giá trị thì ô nhập phải theo, trừ khi đang gõ dở.
  useEffect(() => {
    if (!speedFocused) {
      setSpeedDraft(speed.toFixed(2));
    }
  }, [speed, speedFocused]);

  const commitSpeedDraft = () => {
    setSpeedFocused(false);
    const next = parseSpeedDraft(speedDraft, speed);
    onChangeSpeed(next);
    setSpeedDraft(next.toFixed(2));
  };

  return (
    <div className="studio-speed">
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
          <Sliders className="h-3.5 w-3.5 text-brand-500" />
          <span>
            Tốc độ ·{" "}
            <span className="font-mono tabular-nums">
              {speed.toLocaleString("vi-VN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              ×
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="Giảm tốc độ"
            className="flex h-6 w-6 items-center justify-center rounded border border-border/80 bg-background font-bold text-foreground/70 text-sm leading-none transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || speed <= SPEED_MIN}
            onClick={() => onChangeSpeed(stepSpeed(speed, -1))}
            type="button"
          >
            &minus;
          </button>
          <input
            aria-label="Tốc độ đọc"
            className="h-6 w-14 rounded border border-border/80 bg-background px-1 text-center font-bold font-mono text-brand-600 text-xs outline-none focus:border-brand-500 disabled:opacity-40 dark:text-brand-400"
            disabled={disabled}
            max={SPEED_MAX}
            min={SPEED_MIN}
            onBlur={commitSpeedDraft}
            onChange={(e) => setSpeedDraft(e.target.value)}
            onFocus={() => setSpeedFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitSpeedDraft();
                e.currentTarget.blur();
              }
            }}
            step={SPEED_STEP}
            type="number"
            value={speedDraft}
          />
          <button
            aria-label="Tăng tốc độ"
            className="flex h-6 w-6 items-center justify-center rounded border border-border/80 bg-background font-bold text-foreground/70 text-sm leading-none transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || speed >= SPEED_MAX}
            onClick={() => onChangeSpeed(stepSpeed(speed, 1))}
            type="button"
          >
            +
          </button>
          <button
            className="ml-1 h-6 rounded border border-border/80 bg-background px-2 font-semibold text-muted-foreground text-xs transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled || speed === SPEED_NORMAL}
            onClick={() => onChangeSpeed(SPEED_NORMAL)}
            type="button"
          >
            Chuẩn
          </button>
        </div>
      </div>

      <input
        aria-label="Thanh trượt tốc độ đọc"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-brand-500"
        disabled={disabled}
        max={SPEED_MAX}
        min={SPEED_MIN}
        onChange={(e) =>
          onChangeSpeed(clampSpeed(Number.parseFloat(e.target.value)))
        }
        step={SPEED_STEP}
        type="range"
        value={speed}
      />

      <div className="flex justify-between px-0.5 text-muted-foreground text-xs">
        <span>0,75× · Chậm</span>
        <span>1,50× · Nhanh</span>
      </div>
    </div>
  );
};
