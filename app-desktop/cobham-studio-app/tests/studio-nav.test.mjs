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

const navModulePromise = loadTsModule("src/features/tts/studio-nav.ts");

test("STUDIO_NAV_GROUPS giữ đủ 3 nhóm và 9 mục điều hướng không trùng id", async () => {
  const { STUDIO_NAV_GROUPS } = await navModulePromise;
  assert.deepEqual(
    STUDIO_NAV_GROUPS.map((g) => g.title),
    ["Tạo", "Thư viện", "Hệ thống"]
  );
  const allIds = STUDIO_NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => item.id)
  );
  assert.equal(allIds.length, 9);
  assert.equal(new Set(allIds).size, 9);
  assert.ok(allIds.includes("tts"));
  assert.ok(allIds.includes("history"));
  assert.ok(allIds.includes("dictionary"));
  assert.ok(allIds.includes("settings"));
});

test("resolveNavAction phân biệt đúng modal hệ thống và tab chức năng", async () => {
  const { resolveNavAction } = await navModulePromise;
  assert.deepEqual(resolveNavAction("dictionary"), { type: "open-dictionary" });
  assert.deepEqual(resolveNavAction("settings"), { type: "open-settings" });
  assert.deepEqual(resolveNavAction("tts"), { type: "switch-tab", tab: "tts" });
  assert.deepEqual(resolveNavAction("clone"), {
    type: "switch-tab",
    tab: "clone",
  });
});
