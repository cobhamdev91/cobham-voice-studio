import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/features/tts/ref-audio.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { formatRecordDuration, isSupportedRefAudio, voicedWindow } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

test("isSupportedRefAudio chỉ nhận mp3, wav, m4a không phân biệt hoa thường", () => {
  assert.equal(isSupportedRefAudio("voice.WAV"), true);
  assert.equal(isSupportedRefAudio("sample.mp3"), true);
  assert.equal(isSupportedRefAudio("clip.m4a"), true);
  assert.equal(isSupportedRefAudio("notes.txt"), false);
  assert.equal(isSupportedRefAudio("video.mp4"), false);
});

test("formatRecordDuration định dạng đúng MM:SS và chặn số âm/NaN", () => {
  assert.equal(formatRecordDuration(0), "00:00");
  assert.equal(formatRecordDuration(7), "00:07");
  assert.equal(formatRecordDuration(65), "01:05");
  assert.equal(formatRecordDuration(-2), "00:00");
  assert.equal(formatRecordDuration(Number.NaN), "00:00");
});

test("voicedWindow cắt bỏ im lặng đầu file và giới hạn tối đa maxSeconds", () => {
  const sr = 10;
  const samples = new Float32Array(50);
  // Im lặng từ 0..19, bắt đầu có tiếng từ mẫu 20.
  samples[20] = 0.5;
  const [start, end] = voicedWindow(samples, sr, 2);
  assert.equal(start, 19); // 20 - 0.1s * 10Hz
  assert.equal(end, 39); // 19 + 2s * 10Hz
});
