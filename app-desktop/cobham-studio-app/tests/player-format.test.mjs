import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/features/tts/player-format.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { formatPlayerClock, formatTtfa, playbackStatusLabel, waveBarHeight } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

test("formatPlayerClock định dạng đúng mm:ss và an toàn với số không hợp lệ", () => {
  assert.equal(formatPlayerClock(0), "0:00");
  assert.equal(formatPlayerClock(9), "0:09");
  assert.equal(formatPlayerClock(75.9), "1:15");
  assert.equal(formatPlayerClock(-3), "0:00");
  assert.equal(formatPlayerClock(Number.NaN), "0:00");
});

test("formatTtfa và playbackStatusLabel trả về nhãn tiếng Việt nhất quán", () => {
  assert.equal(formatTtfa(450), "450ms");
  assert.equal(formatTtfa(1250), "1.3s");
  assert.equal(
    playbackStatusLabel(true, false, false, "Bình"),
    "Đang tạo giọng nói..."
  );
  assert.equal(
    playbackStatusLabel(false, true, true, "Bình"),
    "Đang phát (Bình)"
  );
  assert.equal(
    playbackStatusLabel(false, false, true, "Bình"),
    "Đã tạo xong (Bình)"
  );
  assert.equal(
    playbackStatusLabel(false, false, false, "Bình"),
    "Sẵn sàng (Bình)"
  );
});

test("waveBarHeight tính chiều cao hợp lệ ở cả chế độ chờ và chế độ phát live", () => {
  const idleHeight = waveBarHeight(3, 44, false, null, 26);
  assert.ok(idleHeight >= 4 && idleHeight <= 20);

  const liveWithData = waveBarHeight(0, 4, true, new Uint8Array([0, 255]), 26);
  assert.equal(liveWithData, 3);
  const maxBar = waveBarHeight(2, 4, true, new Uint8Array([0, 255]), 26);
  assert.equal(maxBar, 26);
});
