import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/features/tts/voice-selector.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  SPEED_MAX,
  SPEED_MIN,
  SPEED_NORMAL,
  clampSpeed,
  filterVoices,
  parseSpeedDraft,
  stepSpeed,
  voiceColorIndex,
  voiceInitials,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("clampSpeed và stepSpeed chặn biên và tránh sai số dấu phẩy động", () => {
  assert.equal(clampSpeed(Number.NaN), SPEED_NORMAL);
  assert.equal(clampSpeed(0.1), SPEED_MIN);
  assert.equal(clampSpeed(3.0), SPEED_MAX);
  assert.equal(stepSpeed(1.0, 1), 1.05);
  assert.equal(stepSpeed(1.05, -1), 1.0);
  assert.equal(stepSpeed(SPEED_MAX, 1), SPEED_MAX);
  assert.equal(stepSpeed(SPEED_MIN, -1), SPEED_MIN);
});

test("parseSpeedDraft hiểu cả dấu phẩy thập phân và giữ fallback khi không hợp lệ", () => {
  assert.equal(parseSpeedDraft("1,25", 1.0), 1.25);
  assert.equal(parseSpeedDraft("2.0", 1.0), SPEED_MAX);
  assert.equal(parseSpeedDraft("abc", 1.15), 1.15);
});

test("voiceColorIndex trả về chỉ số ổn định trong [0..7] và voiceInitials lấy 2 ký tự cuối", () => {
  for (const id of ["Binh", "Ngoc", "voice_custom_1", "en_us_af_heart"]) {
    const tone = voiceColorIndex(id);
    assert.ok(Number.isInteger(tone) && tone >= 0 && tone < 8);
    assert.equal(voiceColorIndex(id), tone);
  }
  assert.equal(voiceInitials("Hải Đăng"), "HĐ");
  assert.equal(voiceInitials("Thiên Tâm Đức"), "TĐ");
});

test("filterVoices lọc đúng theo ngôn ngữ đang chọn và nhóm giới tính / giọng nhân bản", () => {
  const voices = [
    { id: "v1", name: "Nam Bắc", gender: "male" },
    { id: "v2", name: "Nữ Nam", gender: "female", language: "vi" },
    { id: "v3", name: "Custom", gender: "female", isCloned: true },
    { id: "v4", name: "Heart", gender: "female", language: "en" },
  ];
  assert.deepEqual(
    filterVoices(voices, "all", "vi").map((v) => v.id),
    ["v1", "v2", "v3"]
  );
  assert.deepEqual(
    filterVoices(voices, "male", "vi").map((v) => v.id),
    ["v1"]
  );
  assert.deepEqual(
    filterVoices(voices, "female", "en").map((v) => v.id),
    ["v3", "v4"]
  );
  assert.deepEqual(
    filterVoices(voices, "cloned", null).map((v) => v.id),
    ["v3"]
  );
});
