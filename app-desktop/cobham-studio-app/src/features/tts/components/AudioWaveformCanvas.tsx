import type React from "react";
import { useEffect, useRef } from "react";
import { waveBarHeight } from "../player-format";

/** Props cho canvas hiển thị sóng âm theo token màu sáng/tối. */
export interface AudioWaveformCanvasProps {
  getVisualizerData?: () => Uint8Array | null;
  hidden?: boolean;
  isPlaying: boolean;
}

/**
 * Vẽ thanh sóng âm lên `<canvas>` dựa trên `--canvas-accent` và `--color-brand-400`,
 * tự động vẽ lại khi người dùng chuyển chế độ sáng/tối lúc âm thanh đang dừng.
 */
export const AudioWaveformCanvas: React.FC<AudioWaveformCanvasProps> = ({
  isPlaying,
  getVisualizerData,
  hidden = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const render = () => {
      const data = getVisualizerData ? getVisualizerData() : null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 44;
      const barWidth = canvas.width / numBars - 2;
      const style = getComputedStyle(canvas);
      const waveStart =
        style.getPropertyValue("--canvas-accent").trim() || "#6366f1";
      const waveEnd =
        style.getPropertyValue("--color-brand-400").trim() || "#818cf8";
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, waveStart);
      grad.addColorStop(1, waveEnd);
      ctx.fillStyle = grad;
      // Lúc chờ vẽ sóng tĩnh nhạt thay cho vạch xám, để thanh phát không trông như bị tắt.
      ctx.globalAlpha = isPlaying ? 1 : 0.35;

      for (let i = 0; i < numBars; i++) {
        const val = waveBarHeight(i, numBars, isPlaying, data, canvas.height);
        const x = i * (barWidth + 2);
        const y = (canvas.height - val) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, val, 2);
        ctx.fill();
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    const themeObserver = new MutationObserver(() => {
      if (!isPlaying) {
        render();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      cancelAnimationFrame(animId);
      themeObserver.disconnect();
    };
  }, [isPlaying, getVisualizerData]);

  return (
    <canvas
      className={`${hidden ? "hidden" : ""} studio-wave h-[26px] w-full max-w-full rounded-lg px-1`}
      height={26}
      ref={canvasRef}
      width={240}
    />
  );
};
