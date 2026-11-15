import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function loadTsModule(relPath) {
  const source = fs.readFileSync(path.join(APP_ROOT, relPath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const encoded = Buffer.from(outputText, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const convoPromise = loadTsModule("src/features/tts/conversation-script.ts");

test("extractSpeakers tách đúng tên nhân vật duy nhất từ cả dạng [Tên]: và Tên:", async () => {
  const { extractSpeakers } = await convoPromise;
  const script = [
    "[Host]: Xin chào",
    "Khách mời: Rất vui được tham gia",
    "[Host]: Câu hỏi tiếp theo",
    "Dòng không có nhân vật",
  ].join("\n");
  assert.deepEqual(extractSpeakers(script), ["Host", "Khách mời"]);
});

test("nextSpeakerName và appendSpeakerLine tránh trùng tên hiện có", async () => {
  const { appendSpeakerLine, nextSpeakerName } = await convoPromise;
  assert.equal(nextSpeakerName(["Host", "Người 2"]), "Người 3");
  assert.equal(nextSpeakerName(["Người 1", "Người 2"]), "Người 3");
  assert.equal(
    appendSpeakerLine("[Host]: Xin chào   \n", ["Host"]),
    "[Host]: Xin chào\n[Người 2]: "
  );
  assert.equal(appendSpeakerLine("   ", []), "[Người 1]: ");
});

test("reconcileSpeakerVoices phân bổ vòng tròn và cảnh báo khi giọng cũ bị xoá", async () => {
  const { reconcileSpeakerVoices } = await convoPromise;
  const voices = [
    { id: "v1", name: "Hà Nội Nam" },
    { id: "v2", name: "Sài Gòn Nữ" },
  ];
  const res = reconcileSpeakerVoices(
    ["Host", "Khách"],
    voices,
    { Host: "v1", Khách: "deleted-voice" },
    { v1: "Hà Nội Nam", "deleted-voice": "Giọng Cũ" }
  );
  assert.equal(res.changed, true);
  assert.deepEqual(res.mapping, { Host: "v1", Khách: "v2" });
  assert.match(res.replaced.Khách, /Giọng "Giọng Cũ" của Khách không còn/);
  assert.equal(res.replaced.Host, undefined);
});

test("buildValidSpeakerMapping trả về null khi thiếu giọng hợp lệ và lọc key thừa khi hợp lệ", async () => {
  const { buildValidSpeakerMapping } = await convoPromise;
  const voices = [
    { id: "v1", name: "Voice 1" },
    { id: "v2", name: "Voice 2" },
  ];
  assert.equal(
    buildValidSpeakerMapping(["Host", "Guest"], { Host: "v1" }, voices),
    null
  );
  assert.deepEqual(
    buildValidSpeakerMapping(
      ["Host"],
      { Host: "v1", RemovedSpeaker: "missing" },
      voices
    ),
    { Host: "v1" }
  );
});
