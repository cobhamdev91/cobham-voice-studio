"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const CSS_PATH = path.join(__dirname, "../src/app/global.css");
const css = fs.readFileSync(CSS_PATH, "utf8");

/** Lấy nội dung bên trong block CSS của một selector. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `Không tìm thấy block "${selector}"`);
  const end = css.indexOf("\n}", start);
  assert.notEqual(end, -1, `Block "${selector}" không đóng`);
  return css.slice(start, end);
}

/** Đọc một biến trong block. */
function value(selector, name) {
  const match = block(selector).match(new RegExp(`${name}:\\s*([^;]+);`));
  assert.ok(match, `Thiếu biến "${name}" trong "${selector}"`);
  return match[1].trim();
}

test("canvas tokens có trong :root và .dark, giống nhau", () => {
  for (const name of [
    "--canvas",
    "--canvas-foreground",
    "--canvas-muted",
    "--canvas-border",
    "--canvas-toolbar",
    "--canvas-accent",
  ]) {
    assert.equal(
      value(":root", name),
      value(".dark", name),
      `${name} lệch giữa :root và .dark`
    );
  }
});

test("canvas là nền tối với chữ sáng, tương phản >= 10:1", () => {
  const bg = value(":root", "--canvas");
  const fg = value(":root", "--canvas-foreground");
  assert.match(bg, /^#[0-9a-f]{6}$/i, "--canvas phải là hex 6 ký tự");
  assert.match(fg, /^#[0-9a-f]{6}$/i, "--canvas-foreground phải là hex 6 ký tự");
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(bg), lum(fg)].sort((a, b) => b - a);
  assert.ok((l1 + 0.05) / (l2 + 0.05) >= 10, "Tương phản canvas phải >= 10:1");
});

test("chrome sáng dùng indigo, bo góc 8px", () => {
  assert.equal(value(":root", "--primary"), "#4f46e5");
  assert.equal(value(":root", "--radius"), "0.5rem");
  assert.equal(value(":root", "--background"), "#eceef1");
});

test("chrome tối dùng indigo nhạt", () => {
  assert.equal(value(".dark", "--primary"), "#818cf8");
  assert.equal(value(".dark", "--background"), "#0b0c10");
});

test("thang brand là indigo, không còn teal", () => {
  const theme = block("@theme");
  assert.match(theme, /--color-brand-500:\s*#6366f1;/);
  assert.match(theme, /--color-brand-600:\s*#4f46e5;/);
  assert.doesNotMatch(
    theme,
    /#0d9488|#0f766e|#2dd4bf|#5eead4/,
    "còn màu teal trong thang brand"
  );
});

const HTML_PATH = path.join(__dirname, "../index.html");
const html = fs.readFileSync(HTML_PATH, "utf8");

test("bootstrap nền canvas, không dùng nền sáng", () => {
  assert.match(
    html,
    /background:\s*#14161d/,
    "bootstrap phải nền canvas #14161d"
  );
  assert.match(html, /<title>Cobham Studio<\/title>/);
  assert.doesNotMatch(
    html,
    /#f3f8f8|#e1f6f1/,
    "còn nền sáng cũ của bản gốc"
  );
});

test("editor dùng nền canvas, chữ canvas, bo góc 10px", () => {
  const editor = block(".studio-text-editor");
  assert.match(editor, /background:\s*var\(--canvas\)/);
  assert.match(editor, /border:\s*1px solid var\(--canvas-border\)/);
  assert.match(editor, /border-radius:\s*10px/);
});

test("toolbar và thanh cảm xúc dùng nền canvas-toolbar", () => {
  assert.match(
    block(".studio-editor-toolbar"),
    /background:\s*var\(--canvas-toolbar\)/
  );
  assert.match(
    block(".studio-emotions"),
    /background:\s*var\(--canvas-toolbar\)/
  );
});

test("textarea chữ sáng trên nền tối, placeholder đủ tương phản", () => {
  const ta = block(".studio-textarea");
  assert.match(ta, /color:\s*var\(--canvas-foreground\)/);
  const ph = block(".studio-textarea::placeholder");
  assert.match(ph, /color:\s*var\(--canvas-muted\)/);
  assert.doesNotMatch(
    ph,
    /--muted-foreground/,
    "placeholder phải dùng --canvas-muted"
  );
});

test("TextEditor đánh dấu vùng canvas bằng class studio-canvas", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "../src/features/tts/components/TextEditor.tsx"),
    "utf8"
  );
  assert.match(src, /studio-canvas/);
});

test("không bề mặt nào trong vùng canvas dùng nhầm màu chrome", () => {
  for (const selector of [
    ".studio-text-editor",
    ".studio-editor-toolbar",
    ".studio-editor-heading h2",
    ".studio-editor-stats",
    ".studio-emotions",
    ".studio-textarea",
  ]) {
    const body = block(selector);
    assert.doesNotMatch(
      body,
      /var\(--card\)|var\(--foreground\)|var\(--secondary\)|var\(--muted-foreground\)/,
      `${selector} dùng màu chrome, sẽ lọt nền sáng vào giữa vùng canvas tối`
    );
  }
});
