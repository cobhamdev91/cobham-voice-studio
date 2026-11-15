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

const batchQueuePromise = loadTsModule("src/features/tts/batch-queue.ts");

test("countDoneBatch và pendingBatchIndices bỏ qua mục done và giữ mục lỗi/chưa chạy", async () => {
  const { countDoneBatch, pendingBatchIndices } = await batchQueuePromise;
  const results = {
    0: { status: "done" },
    1: { status: "error", error: "timeout" },
    3: { status: "done" },
  };
  assert.equal(countDoneBatch(results), 2);
  assert.deepEqual(pendingBatchIndices(5, results), [1, 2, 4]);
});

test("batchGenerateLabel hiển thị Tạo hoặc Tiếp tục đúng ngữ cảnh", async () => {
  const { batchGenerateLabel } = await batchQueuePromise;
  assert.equal(batchGenerateLabel(4, false, 0), "Tạo 4 file");
  assert.equal(batchGenerateLabel(4, true, 1), "Tiếp tục (3 mục)");
  assert.equal(batchGenerateLabel(4, true, 4), "Tạo 4 file");
});

test("formatBatchTimestamp và formatZipNotice định dạng tên file và thông báo zip chuẩn", async () => {
  const { formatBatchTimestamp, formatZipNotice } = await batchQueuePromise;
  assert.equal(
    formatBatchTimestamp(new Date(2026, 10, 5, 9, 4)),
    "20261105-0904"
  );
  assert.equal(formatZipNotice(3, 0), "Đã lưu file zip gồm 3 audio.");
  assert.equal(
    formatZipNotice(3, 3),
    "Đã lưu file zip gồm 3 audio và 3 phụ đề."
  );
});
