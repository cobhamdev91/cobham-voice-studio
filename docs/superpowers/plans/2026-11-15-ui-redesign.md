# Tái thiết kế giao diện Cobham Studio — chrome sáng, canvas tối — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi giao diện Cobham Studio sang mô hình "chrome sáng – canvas tối": vùng soạn thảo và thanh phát luôn nền tối, phần điều khiển sáng, màu nhấn chuyển từ teal sang indigo.

**Architecture:** Toàn bộ thay đổi nằm ở tầng token CSS. Thêm nhóm biến `--canvas-*` dùng chung cho light/dark, đổi bảng màu chrome và thang brand trong `global.css`. Các bề mặt (editor, player, panel phải, sidebar, header) chỉ đổi CSS, không đổi cấu trúc component. Riêng `EmotionBar` cần sửa nhỏ: màu chip phải phụ thuộc nền nó nằm trên (canvas tối vs chrome sáng/tối), nên bỏ cặp `text-X dark:text-Y` và chuyển sang biến CSS theo ngữ cảnh.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@theme`), shadcn/ui, lucide-react. Test: `node --test` (Node built-in). Không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-15-ui-redesign-design.md`

## Global Constraints

- Không thêm dependency npm. Mọi thứ đã cài phải đủ dùng.
- App chạy offline: **không được** thêm font mới cần tải về. Font mono dùng font hệ thống: `ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`.
- **Canvas luôn tối ở cả chế độ sáng và tối.** Vùng soạn thảo + thanh phát có nền tối trong mọi trạng thái theme.
- Không đổi layout 3 cột. Không đổi cây component React. Không đổi API backend.
- Không sửa các file pháp lý: `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES.md`, `DIEU-KHOAN.md`.
- Giữ nguyên cơ chế theme hiện có: class `.dark` trên `<html>`, key `localStorage` = `cobham_studio_theme`.
- Nguyên tắc DRY: mọi màu bề mặt phải đến từ token trong `global.css`, không hardcode hex trong component.

## Review Focus

Năm trường hợp mà đặc tả hàm ý nhưng không task nào kiểm thử bằng test — mỗi dòng dưới đây sẽ được gắn một test vào task sở hữu code của nó:

1. **Chip cảm xúc trên canvas tối ở chế độ sáng** — chip dùng `text-sky-800` sẽ không đọc được trên nền `#14161d`. Kiểm tra: màu chữ chip phải lấy từ biến `--emotion-*` mà `.studio-canvas` ghi đè, không phải từ cặp `dark:`.
2. **Chip cảm xúc trên nền chrome ở chế độ tối** (tab "Nhân bản giọng" dùng lại `EmotionBar`) — cùng một component nhưng nền khác, phải đọc được ở cả hai.
3. **Placeholder của textarea** — `var(--muted-foreground)` ở chế độ sáng là `#5b6270`, tương phản ~2.9:1 trên nền canvas, không đủ đọc. Phải dùng `var(--canvas-muted)`.
4. **Màn hình bootstrap `index.html`** — phải nền canvas ngay từ đầu, không được nháy nền sáng trước khi React mount.
5. **Vùng canvas đánh dấu bằng `.studio-canvas`** — mọi nội dung bên trong phải dùng biến `--canvas-*`; nếu một bề mặt con lọt vào dùng `--card`/`--foreground` thì nền sáng sẽ xuất hiện giữa vùng tối.

---

### Task 1: Nền tảng token — canvas, bảng màu chrome, brand scale, bo góc

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (khối `@theme` dòng 17–28, khối `:root` dòng 73, khối `.dark` dòng 121)
- Modify: `app-desktop/cobham-studio-app/package.json` (script `test`)
- Create: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Interfaces:**
- Consumes: không có
- Produces: các biến CSS `--canvas`, `--canvas-foreground`, `--canvas-muted`, `--canvas-border`, `--canvas-toolbar`, `--canvas-accent` (dùng ở Task 3–9); các key trong `global.css` mà test `tests/theme-tokens.test.cjs` sẽ khóa.

- [ ] **Step 1: Viết test failing**

Tạo `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`:

```js
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
    assert.equal(value(":root", name), value(".dark", name), `${name} lệch giữa :root và .dark`);
  }
});

test("canvas là nền tối với chữ sáng, tương phản >= 10:1", () => {
  const bg = value(":root", "--canvas");
  const fg = value(":root", "--canvas-foreground");
  assert.match(bg, /^#[0-9a-f]{6}$/i, "--canvas phải là hex 6 ký tự");
  assert.match(fg, /^#[0-9a-f]{6}$/i, "--canvas-foreground phải là hex 6 ký tự");
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
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
  assert.doesNotMatch(theme, /#0d9488|#0f766e|#2dd4bf|#5eead4/, "còn màu teal trong thang brand");
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Script `test` trong `package.json` hiện liệt kê tường minh từng file nên file mới sẽ
không được chạy. Đổi sang tự động khám phá thư mục (Node 26 hỗ trợ):

```json
"test": "node --test tests/"
```

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "Không tìm thấy block" hoặc "Thiếu biến --canvas".

- [ ] **Step 3: Thêm nhóm token canvas vào `global.css`**

Trong khối `:root`, thêm ngay sau khối `--shadow-md` (trước dấu `}` đóng khối):

```css
  /* Màn hình làm việc: luôn tối ở cả chế độ sáng và tối. */
  --canvas: #14161d;
  --canvas-foreground: #e8eaf0;
  --canvas-muted: #98a0b2;
  --canvas-border: #262a36;
  --canvas-toolbar: #1b1e27;
  --canvas-accent: #818cf8;
```

Trong khối `.dark`, thêm **cùng một nhóm giá trị y hệt** (kèm comment giống nhau) — canvas không đổi theo theme.

- [ ] **Step 4: Đổi bảng màu chrome sáng (khối `:root`)**

Ghi đè các biến sau trong `:root` bằng đúng giá trị:

```css
  --background: #eceef1;
  --foreground: #14161a;
  --card: #ffffff;
  --card-foreground: #14161a;
  --popover: #ffffff;
  --popover-foreground: #14161a;
  --primary: #4f46e5;
  --primary-foreground: #ffffff;
  --secondary: #f1f3f6;
  --secondary-foreground: #14161a;
  --muted: #f4f5f7;
  --muted-foreground: #5b6270;
  --accent: #eef0fe;
  --accent-foreground: #3730a3;
  --border: #dde0e6;
  --input: #c9ced8;
  --ring: #6366f1;
  --sidebar: #f7f8fa;
  --sidebar-foreground: #1e293b;
  --sidebar-primary: #818cf8;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #4f46e5;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: #dde0e6;
  --sidebar-hover: #eceef4;
  --sidebar-hover-foreground: #3730a3;
  --sidebar-muted: #4f46e5;
  --radius: 0.5rem;
  --shadow-sm: 0 1px 2px rgb(16 24 40 / 8%);
  --shadow-md: 0 1px 3px rgb(16 24 40 / 8%), 0 16px 36px -20px rgb(20 22 29 / 45%);
```

Các biến `--chart-*`, `--destructive`, `--sidebar-ring`, `--accent-warm`, `--sidebar-selected-shadow` giữ nguyên giá trị cũ.

- [ ] **Step 5: Đổi bảng màu chrome tối (khối `.dark`)**

Ghi đè trong `.dark`:

```css
  --background: #0b0c10;
  --foreground: #e8eaf0;
  --card: #121419;
  --card-foreground: #e8eaf0;
  --popover: #171a21;
  --popover-foreground: #e8eaf0;
  --primary: #818cf8;
  --primary-foreground: #0b0c10;
  --secondary: #1b1e27;
  --secondary-foreground: #e8eaf0;
  --muted: #171a21;
  --muted-foreground: #99a0b0;
  --accent: #232742;
  --accent-foreground: #c7d2fe;
  --border: #262a36;
  --input: #333849;
  --ring: #818cf8;
  --sidebar: #0e1015;
  --sidebar-foreground: #cbd5e1;
  --sidebar-primary: #818cf8;
  --sidebar-primary-foreground: #0b0c10;
  --sidebar-accent: rgb(129 140 248 / 14%);
  --sidebar-accent-foreground: #c7d2fe;
  --sidebar-border: #262a36;
  --sidebar-hover: #1b1e27;
  --sidebar-hover-foreground: #e8eaf0;
  --sidebar-muted: #818cf8;
```

Các biến `--chart-*`, `--destructive`, `--sidebar-ring`, `--accent-warm` giữ nguyên.

- [ ] **Step 6: Đổi thang brand trong `@theme`**

Trong khối `@theme`, thay 10 dòng `--color-brand-*` bằng:

```css
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-300: #a5b4fc;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --color-brand-800: #3730a3;
  --color-brand-900: #312e81;
  --color-brand-950: #1e1b4b;
```

- [ ] **Step 7: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 6/6.

- [ ] **Step 8: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(theme): them canvas toi, doi bang mau chrome sang indigo"
```

---

### Task 2: Màn hình bootstrap — không nháy trắng

**Files:**
- Modify: `app-desktop/cobham-studio-app/index.html`

**Interfaces:**
- Consumes: `--canvas` (#14161d) từ Task 1
- Produces: không có

- [ ] **Step 1: Viết test failing**

Thêm vào `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`:

```js
const HTML_PATH = path.join(__dirname, "../index.html");
const html = fs.readFileSync(HTML_PATH, "utf8");

test("bootstrap nền canvas, không dùng nền sáng", () => {
  assert.match(html, /background:\s*#14161d/, "bootstrap phải nền canvas #14161d");
  assert.match(html, /<title>Cobham Studio<\/title>/);
  assert.doesNotMatch(html, /#f3f8f8|#e1f6f1/, "còn nền sáng cũ của bản gốc");
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "bootstrap phải nền canvas #14161d".

- [ ] **Step 3: Sửa `index.html`**

Trong `<style>` của `index.html`:
- `body { background: #f3f8f8 }` → `background: #14161d`
- Trong `@media (prefers-color-scheme: dark)`: `background: #101c23` → `background: #14161d`
- `#bootstrap-screen { color: #163039; background: radial-gradient(circle at 50% 36%, #e1f6f1 0, #f3f8f8 55%, #f8fbfc 100%) }` → `color: #e8eaf0; background: #14161d`
- `.bootstrap-subtitle, .bootstrap-status { color: #527079 }` → `color: #98a0b2`
- `.bootstrap-track { background: #d9e9e7 }` → `background: #262a36`
- `.bootstrap-progress { background: #0aa889 }` → `background: #818cf8`
- `.bootstrap-retry { background: #0d9e81 }` → `background: #6366f1`
- Trong khối `@media (prefers-color-scheme: dark)`: xoá các dòng override cũ (`#101c23`, `#173a3a`, `#abc1c3`, `#2a4447`) vì giá trị đã thống nhất.
- `.bootstrap-mark` đang dùng `linear-gradient(135deg, #10b981, #0891b2)` → `linear-gradient(135deg, #6366f1, #4f46e5)`

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 7/7.

- [ ] **Step 5: Commit**

```bash
git add app-desktop/cobham-studio-app/index.html app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): bootstrap ve noi dung canvas toi, khong nhay trang"
```

---

### Task 3: Bề mặt canvas — editor, toolbar, textarea

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (`.studio-text-editor` dòng ~591, `.studio-editor-heading` ~602, `.studio-editor-toolbar` ~620, `.studio-emotions` ~643, `.studio-textarea-area` ~665, `.studio-textarea` ~670)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/TextEditor.tsx` (thêm class `studio-canvas` lên phần tử gốc)

**Interfaces:**
- Consumes: `--canvas*` từ Task 1
- Produces: class `.studio-canvas` — đánh dấu cây con nằm trên nền tối. Task 7 dùng nó để ghi đè màu chip cảm xúc.

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
test("editor dùng nền canvas, chữ canvas, bo góc 10px", () => {
  const editor = block(".studio-text-editor");
  assert.match(editor, /background:\s*var\(--canvas\)/);
  assert.match(editor, /border-color:\s*var\(--canvas-border\)/);
  assert.match(editor, /border-radius:\s*10px/);
});

test("toolbar và thanh cảm xúc dùng nền canvas-toolbar", () => {
  assert.match(block(".studio-editor-toolbar"), /background:\s*var\(--canvas-toolbar\)/);
  assert.match(block(".studio-emotions"), /background:\s*var\(--canvas-toolbar\)/);
});

test("textarea chữ sáng trên nền tối, placeholder đủ tương phản", () => {
  const ta = block(".studio-textarea");
  assert.match(ta, /color:\s*var\(--canvas-foreground\)/);
  const ph = ta.slice(ta.indexOf("::placeholder"));
  assert.match(ph, /color:\s*var\(--canvas-muted\)/);
  assert.doesNotMatch(ph, /--muted-foreground/, "placeholder phải dùng --canvas-muted");
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
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "editor dùng nền canvas".

- [ ] **Step 3: Sửa `.studio-text-editor` trong `global.css`**

Đặt lại các thuộc tính của block:

```css
.studio-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--canvas);
  border: 1px solid var(--canvas-border);
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 4%),
    0 18px 40px -22px rgb(0 0 0 / 70%);
}
```

- [ ] **Step 4: Sửa `.studio-editor-heading` và `.studio-editor-toolbar`**

```css
.studio-editor-heading {
  color: var(--canvas-foreground);
}

.studio-editor-toolbar {
  padding: 4px;
  margin: 0 16px;
  background: var(--canvas-toolbar);
  border-radius: 10px 10px 0 0;
}

.studio-editor-toolbar button {
  height: 30px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--canvas-muted);
  background: transparent;
  border: 0;
  box-shadow: none;
}

.studio-editor-toolbar button:hover {
  color: var(--canvas-foreground);
  background: var(--canvas);
}
```

`.studio-editor-heading h2` đổi `color: var(--foreground)` → `color: var(--canvas-foreground)`.
`.studio-editor-stats` đổi `color: var(--muted-foreground)` → `color: var(--canvas-muted)`.

- [ ] **Step 5: Sửa `.studio-emotions` và `.studio-textarea`**

```css
.studio-emotions {
  padding: 0 4px 4px;
  margin: 0 16px;
  background: var(--canvas-toolbar);
  border-radius: 0 0 10px 10px;
}

.studio-textarea {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 22px clamp(24px, 3vw, 48px);
  overflow-y: auto;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.9;
  color: var(--canvas-foreground);
  resize: none;
  user-select: text;
  outline: none;
  background: transparent;
  border: 0;
}

.studio-textarea::placeholder {
  color: var(--canvas-muted);
}
```

Giữ nguyên `.studio-textarea-area`, `.studio-emotions > div`, `.studio-emotions code`.

- [ ] **Step 6: Thêm class `studio-canvas` vào `TextEditor.tsx`**

Trong `TextEditor.tsx`, tìm phần tử gốc có class `studio-text-editor` và gắn thêm `studio-canvas` vào chuỗi class của nó, để thành:

```
"studio-text-editor studio-canvas ..."
```

(Giữ nguyên các class khác đang có.)

- [ ] **Step 7: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 12/12.

- [ ] **Step 8: Kiểm tra typecheck vẫn sạch**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi.

- [ ] **Step 9: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/src/features/tts/components/TextEditor.tsx app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): vung soan thao chuyen nen canvas toi"
```

---

### Task 4: Thanh phát thành transport bar

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (`.studio-player` dòng ~469, `.studio-workspace-tts .studio-player` dòng ~583)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/AudioPlayerBar.tsx`

**Interfaces:**
- Consumes: `--canvas-toolbar`, `--canvas-border`, `--canvas-foreground`, `--canvas-muted` từ Task 1
- Produces: không có

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
test("player là bề mặt riêng, nền canvas-toolbar, không trong suốt", () => {
  const player = block(".studio-player");
  assert.match(player, /background:\s*var\(--canvas-toolbar\)/);
  assert.match(player, /border:\s*1px solid var\(--canvas-border\)/);
  assert.match(player, /border-radius:\s*10px/);
});

test("player trong layout TTS không bị gỡ nền nữa", () => {
  const inTts = block(".studio-workspace-tts .studio-player");
  assert.doesNotMatch(inTts, /background:\s*transparent/);
  assert.doesNotMatch(inTts, /border:\s*0/);
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "player là bề mặt riêng".

- [ ] **Step 3: Sửa `.studio-player` trong `global.css`**

```css
.studio-player {
  background: var(--canvas-toolbar);
  border: 1px solid var(--canvas-border);
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 4%),
    0 12px 28px -20px rgb(0 0 0 / 70%);
}
```

Giữ nguyên phần còn lại của block (padding, flex, gap…).

- [ ] **Step 4: Sửa override trong layout TTS**

Block `.studio-workspace-tts .studio-player` hiện đặt `background: transparent; border: 0; padding: 0;`. Đổi thành:

```css
.studio-workspace-tts .studio-player {
  grid-area: player;
  width: 100%;
  padding: 12px 16px;
  margin: 0 auto 20px;
}
```

(Bỏ `background`, `border`, `border-radius` khỏi block này để kế thừa từ `.studio-player`.)

- [ ] **Step 5: Sửa màu trong `AudioPlayerBar.tsx`**

Thanh phát luôn nằm trong `.studio-player` (nền canvas tối), nên **mọi** màu chrome
trong file này phải chuyển sang biến canvas. Áp dụng đúng bảng sau — dòng là số dòng
trong `AudioPlayerBar.tsx` tại thời điểm thực hiện task này:

| Dòng | Hiện tại | Đổi thành |
|---|---|---|
| 279 | `from-brand-500 to-teal-600 … hover:to-teal-700` | `from-brand-500 to-brand-700 … hover:to-brand-800` |
| 304, 325 | `border-border text-muted-foreground hover:text-foreground` | `border-[var(--canvas-border)] text-[var(--canvas-muted)] hover:text-[var(--canvas-foreground)]` |
| 352 | `bg-slate-400` | `bg-[var(--canvas-muted)]` |
| 355 | `text-foreground` | `text-[var(--canvas-foreground)]` |
| 366 | `text-muted-foreground` | `text-[var(--canvas-muted)]` |
| 374 | `text-brand-600 dark:text-brand-400` | `text-[var(--canvas-accent)]` |
| 392 | `text-muted-foreground` | `text-[var(--canvas-muted)]` |
| 395 | `text-brand-600 dark:text-brand-400` | `text-[var(--canvas-accent)]` |
| 405 | `bg-brand-100 dark:bg-brand-950` | `bg-[var(--canvas-border)]` |
| 409 | `from-brand-500 via-teal-500 to-cyan-500` | `from-brand-500 via-brand-400 to-brand-300` |
| 413 | `text-muted-foreground` | `text-[var(--canvas-muted)]` |
| 434 | `text-muted-foreground` | `text-[var(--canvas-muted)]` |
| 437, 524 | `bg-secondary accent-brand-500` | `bg-[var(--canvas-border)] accent-[var(--canvas-accent)]` |
| 460, 497 | `bg-secondary text-foreground` | `bg-[var(--canvas-border)] text-[var(--canvas-foreground)]` |
| 461, 479 | `bg-muted text-muted-foreground` | `bg-[var(--canvas-border)] text-[var(--canvas-muted)]` |
| 512 | `text-muted-foreground hover:text-foreground` | `text-[var(--canvas-muted)] hover:text-[var(--canvas-foreground)]` |

Các class `text-violet-*`, `text-cyan-500`, `text-rose-500` là **màu trạng thái ngữ
nghĩa** (phụ đề, lỗi) — giữ nguyên, chỉ đảm bảo chúng đủ tương phản trên nền tối.

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 14/14.

- [ ] **Step 7: Kiểm tra typecheck**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi.

- [ ] **Step 8: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/src/features/tts/components/AudioPlayerBar.tsx app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): thanh phat thanh transport bar co be mat rieng"
```

---

### Task 5: Panel điều khiển — rack có section, nhãn mono, nút dính đáy

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (`.studio-properties` dòng ~566, `.studio-voice-heading` ~700, `.studio-voice-filter` ~709)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/VoiceSelector.tsx`

**Interfaces:**
- Consumes: token từ Task 1
- Produces: không có

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
test("panel điều khiển có ranh giới section và nút dính đáy", () => {
  const props = block(".studio-properties");
  assert.match(props, /border-left:\s*1px solid var\(--border\)/);
  assert.match(props, /--studio-section-divider/);
});

test("nhãn section dùng font mono, chữ nhỏ, uppercase", () => {
  const heading = block(".studio-voice-heading h2");
  assert.match(heading, /font-family:\s*var\(--font-mono)/);
  assert.match(heading, /text-transform:\s*uppercase/);
  assert.match(heading, /letter-spacing:\s*0\.08em/);
});

test("nút chính dính đáy panel", () => {
  assert.match(
    block(".studio-properties .studio-primary"),
    /margin-top:\s*auto/,
    "nút Tạo giọng đọc phải dính đáy panel"
  );
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "panel điều khiển có ranh giới section".

- [ ] **Step 3: Sửa `.studio-properties` trong `global.css`**

```css
.studio-properties {
  display: flex;
  flex-direction: column;
  grid-area: properties;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  background: var(--card);
  border-left: 1px solid var(--border);
  --studio-section-divider: 1px solid var(--border);
}
```

- [ ] **Step 4: Thêm style cho nhãn section mono**

Sau `.studio-voice-heading h2` (đang đặt `font-size: 13px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.07em`), đổi thành:

```css
.studio-voice-heading h2 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

Và thêm biến font mono vào khối `@theme` (cùng chỗ với `--font-sans`, `--font-heading`):

```css
  --font-mono: ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;
```

- [ ] **Step 5: Tách section trong `VoiceSelector.tsx`**

Trong `VoiceSelector.tsx`, khối panel chứa danh sách giọng hiện dùng các div lồng nhau. Thêm đường kẻ giữa các section bằng cách gắn class `border-t` + `pt-3` + `mt-1` (với `border-color: var(--studio-section-divider)`) lên:
- section chứa "Tốc độ đọc"
- section chứa "Tuỳ chọn nâng cao"

Nút "Tạo giọng đọc" (`.studio-primary`) phải nằm ở khối cuối cùng và dính đáy panel.
Thêm vào `global.css`:

```css
.studio-properties .studio-primary {
  margin-top: auto;
}
```

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 17/17.

- [ ] **Step 7: Kiểm tra typecheck**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi.

- [ ] **Step 8: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/src/features/tts/components/VoiceSelector.tsx app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): panel dieu khien thanh rack co section va nut dinh day"
```

---

### Task 6: Chrome — sidebar tách nền, header gọn

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (`.studio-header` dòng ~266, `.studio-logo` ~277, `.studio-model` ~286, `.studio-sidebar` ~326)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/Header.tsx`

**Interfaces:**
- Consumes: token từ Task 1
- Produces: không có

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
test("sidebar có nền riêng khác header", () => {
  assert.notEqual(value(":root", "--sidebar"), value(":root", "--card"));
  assert.match(block(".studio-sidebar"), /background:\s*var\(--sidebar\)/);
});

test("logo bo góc 6px, dùng indigo", () => {
  const logo = block(".studio-logo");
  assert.match(logo, /border-radius:\s*6px/);
  assert.doesNotMatch(logo, /#0f766e|#0e7490/);
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "sidebar có nền riêng khác header".

- [ ] **Step 3: Sửa `.studio-sidebar`**

Giữ nguyên `width: 248px`, `border-right`, padding. Đảm bảo có:

```css
.studio-sidebar {
  background: var(--sidebar);
  border-right: 1px solid var(--border);
}
```

- [ ] **Step 4: Sửa `.studio-logo` và `.studio-model`**

```css
.studio-logo {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-800));
  border-radius: 6px;
}

.studio-model {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  height: 34px;
  padding: 0 6px 0 12px;
  font-size: 13px;
  color: var(--accent-foreground);
  background: var(--accent);
  border: 1px solid var(--border);
  border-radius: 999px;
}
```

- [ ] **Step 5: Sửa `Header.tsx`**

Trong `Header.tsx`:
- Tiêu đề `<h1 className="font-bold text-sm tracking-tight">` giữ nguyên.
- Nút "Đổi mô hình" (`.studio-model-action`) hiện dùng `box-shadow: var(--shadow-sm)` → đổi sang viền mảnh: trong `global.css`, block `.studio-model-action` đổi `box-shadow: var(--shadow-sm)` thành `border: 1px solid var(--border)` và bỏ `background: var(--card)`.

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 19/19.

- [ ] **Step 7: Kiểm tra typecheck**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi.

- [ ] **Step 8: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/src/features/tts/components/Header.tsx app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): sidebar tach nen rieng, header gon hon"
```

---

### Task 7: Chip cảm xúc — màu theo ngữ cảnh nền

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css` (thêm nhóm token cảm xúc trong `:root`, `.dark`, `.studio-canvas`)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/EmotionBar.tsx`

**Interfaces:**
- Consumes: `.studio-canvas` từ Task 3
- Produces: các biến `--emotion-sky`, `--emotion-emerald`, `--emotion-amber`, `--emotion-slate` (dùng bởi `EmotionBar.tsx`).

**Vì sao phải sửa:** `EmotionBar` dùng ở hai nơi — `TextEditor.tsx` (trên canvas tối) và `VoiceCloningTab.tsx` (trên nền chrome, sáng hoặc tối). Cặp class `text-sky-800 dark:text-sky-300` hiện tại gắn màu theo theme, nhưng canvas luôn tối nên ở chế độ sáng chip sẽ lấy màu `text-sky-800` (xanh đậm) trên nền `#14161d` → không đọc được. Phải chuyển sang biến CSS theo ngữ cảnh nền.

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
test("màu chip cảm xúc theo ngữ cảnh nền, không phụ thuộc theme", () => {
  for (const name of ["--emotion-sky", "--emotion-emerald", "--emotion-amber", "--emotion-slate"]) {
    assert.ok(css.includes(`${name}:`), `thiếu biến ${name}`);
  }
  const canvas = block(".studio-canvas");
  assert.match(canvas, /--emotion-sky:/);
  assert.match(canvas, /--emotion-amber:/);
  // chip cảm xúc cũng dùng ở VoiceCloningTab, trên nền chrome tối ->
  // .dark cũng phải định nghĩa đủ bộ biến này
  for (const name of ["--emotion-sky", "--emotion-emerald", "--emotion-amber", "--emotion-slate"]) {
    assert.match(block(".dark"), new RegExp(`${name}:`), `.dark thiếu ${name}`);
  }
});

test("EmotionBar không dùng cặp màu dark: cho chip", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "../src/features/tts/components/EmotionBar.tsx"),
    "utf8"
  );
  assert.doesNotMatch(src, /text-(sky|emerald|amber|slate)-\d{3}\s+dark:/);
  assert.match(src, /--emotion-/);
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — "thiếu biến --emotion-sky".

- [ ] **Step 3: Thêm token màu cảm xúc vào `global.css`**

Trong `:root` (nền chrome sáng):

```css
  /* Màu chip cảm xúc trên nền chrome sáng: chữ đậm. */
  --emotion-sky: #075985;
  --emotion-emerald: #065f46;
  --emotion-amber: #92400e;
  --emotion-slate: #475569;
```

Trong `.dark` (nền chrome tối):

```css
  /* Màu chip cảm xúc trên nền chrome tối: chữ sáng. */
  --emotion-sky: #7dd3fc;
  --emotion-emerald: #6ee7b7;
  --emotion-amber: #fcd34d;
  --emotion-slate: #cbd5e1;
```

Thêm block mới sau `.studio-text-editor`:

```css
/* Vùng canvas luôn tối: chip cảm xúc dùng bản chữ sáng. */
.studio-canvas {
  --emotion-sky: #7dd3fc;
  --emotion-emerald: #6ee7b7;
  --emotion-amber: #fcd34d;
  --emotion-slate: #cbd5e1;
}
```

- [ ] **Step 4: Sửa `EmotionBar.tsx`**

Danh sách emotion hiện lưu chuỗi class Tailwind trong `item.color` (ví dụ `"text-sky-800 dark:text-sky-300 border-sky-500/45 bg-sky-500/15"`). Đổi `item.color` thành **tên hue** (`"sky"`, `"emerald"`, `"amber"`), rồi ở phần render nút, dựng class từ hue:

```tsx
const EMOTION_CLASS = {
  sky: "border-[color-mix(in_srgb,var(--emotion-sky)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-sky)_15%,transparent)] text-[var(--emotion-sky)]",
  emerald:
    "border-[color-mix(in_srgb,var(--emotion-emerald)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-emerald)_15%,transparent)] text-[var(--emotion-emerald)]",
  amber:
    "border-[color-mix(in_srgb,var(--emotion-amber)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-amber)_15%,transparent)] text-[var(--emotion-amber)]",
  slate:
    "border-[color-mix(in_srgb,var(--emotion-slate)_45%,transparent)] bg-[color-mix(in_srgb,var(--emotion-slate)_15%,transparent)] text-[var(--emotion-slate)]",
};
```

Trong JSX, thay `${item.color}` bằng `${EMOTION_CLASS[item.hue]}`.

Nút "Khoảng nghỉ" (chip trung tính) đổi tương ứng sang `EMOTION_CLASS.slate` và bỏ các class `border-slate-500/45 bg-slate-500/15 text-slate-600 dark:text-slate-300`.

Icon `Sparkles` dùng class `text-amber-600 dark:text-amber-400` → đổi sang `text-[var(--emotion-amber)]`.

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 21/21.

- [ ] **Step 6: Kiểm tra typecheck**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi. Nếu `item.color` được dùng ở nơi khác trong file, đổi sang `item.hue` cho khớp.

- [ ] **Step 7: Commit**

```bash
git add app-desktop/cobham-studio-app/src/app/global.css app-desktop/cobham-studio-app/src/features/tts/components/EmotionBar.tsx app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "feat(ui): mau chip cam xuc theo ngu canh nen canvas"
```

---

### Task 8: Số liệu mono, dọn màu bề mặt hardcode, gradient teal còn sót

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/VoiceSelector.tsx` (hiển thị tốc độ)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/TextEditor.tsx` (số ký tự / thời lượng ở `.studio-editor-stats`)
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/AdvancedGeneration.tsx` (ô nhập seed)
- Modify: `app-desktop/cobham-studio-app/src/features/errors/error-base.tsx` dòng ~36, ~53
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/VoiceCloningTab.tsx` dòng ~411
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/AboutTab.tsx` dòng ~48
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/BatchTab.tsx` dòng ~568
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/LoadingScreen.tsx` dòng ~110
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/SrtDubbing.tsx` dòng ~245
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/ConversationTab.tsx` dòng ~106

**Interfaces:**
- Consumes: `--font-mono` từ Task 5, token chrome từ Task 1, thang brand indigo từ Task 1
- Produces: không có

**Vì sao phải sửa:** Task 1 đổi thang brand từ teal sang indigo. Tám chỗ còn dùng
gradient `from-brand-500 to-teal-600` sẽ thành gradient indigo → teal, lệch tông với
phần còn lại của app.

- [ ] **Step 1: Viết test failing**

Thêm vào `tests/theme-tokens.test.cjs`:

```js
const SRC = path.join(__dirname, "../src");

test("không còn màu bề mặt hardcode ngoài khối code tối có chủ đích", () => {
  const allowed = ["bg-zinc-950", "text-zinc-200"];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);
  const offenders = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    const hits = src.match(/\b(?:bg|text|border)-(?:white|black|slate|gray|zinc|neutral|stone)-\d{0,3}\b/g) ?? [];
    const real = hits.filter((h) => !allowed.includes(h));
    if (real.length > 0) {
      offenders.push(`${path.relative(SRC, file)}: ${[...new Set(real)].join(", ")}`);
    }
  }
  assert.deepEqual(offenders, [], `còn màu bề mặt hardcode:\n${offenders.join("\n")}`);
});

test("không còn gradient teal cũ", () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);
  const offenders = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    if (/\bteal-\d{3}\b/.test(src)) {
      offenders.push(path.relative(SRC, file));
    }
  }
  assert.deepEqual(offenders, [], `còn màu teal cũ:\n${offenders.join("\n")}`);
});

test("số liệu dùng font mono", () => {
  const voice = fs.readFileSync(
    path.join(SRC, "features/tts/components/VoiceSelector.tsx"),
    "utf8"
  );
  assert.match(voice, /font-mono/);
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: FAIL — danh sách "còn màu bề mặt hardcode" và "còn màu teal cũ".

- [ ] **Step 3: Đưa số liệu về font mono**

- `VoiceSelector.tsx`: khối hiển thị "Tốc độ · 1,00×" — bọc con số vào
  `<span className="font-mono tabular-nums">`.
- `TextEditor.tsx`: các `<span>` chứa số ký tự / số câu / thời lượng trong
  `.studio-editor-stats` thêm class `font-mono tabular-nums`.
- `AdvancedGeneration.tsx`: ô nhập seed thêm class `font-mono tabular-nums`.

- [ ] **Step 4: Dọn từng chỗ màu hardcode**

Đổi như sau (giữ nguyên ý nghĩa hiển thị):

| File | Hiện | Đổi thành |
|---|---|---|
| `error-base.tsx` ~36 | `text-gray-900` | `text-foreground` |
| `error-base.tsx` ~53 | `text-gray-600` | `text-muted-foreground` |
| `AudioPlayerBar.tsx` ~352 | `bg-slate-400` | `bg-[var(--canvas-muted)]` (xem Task 4) |
| `EmotionBar.tsx` ~92 | `border-slate-500/45 bg-slate-500/15 text-slate-600` | `EMOTION_CLASS.slate` (xem Task 7) |
| `RemoteAccessPanel.tsx` ~244 | `bg-zinc-950 text-zinc-200` | **giữ nguyên** — khối code tối có chủ đích, nằm trong `allowed` |
| `SettingsModal.tsx` ~732 | `bg-zinc-950 text-zinc-200` | **giữ nguyên** — khối code tối có chủ đích |
| `VoiceCloningTab.tsx` ~411 | `bg-slate-800 text-white` | `bg-muted text-muted-foreground` |

`EmotionBar.tsx` ~92 đã được xử lý ở Task 7 — Task 8 chỉ xác nhận nó không còn hardcode.

- [ ] **Step 5: Đổi gradient teal còn sót**

Áp dụng đúng các thay thế sau:

| File | Hiện | Đổi thành |
|---|---|---|
| `AboutTab.tsx` ~48 | `from-brand-500 via-teal-500 to-cyan-500` | `from-brand-500 via-brand-400 to-brand-300` |
| `AudioPlayerBar.tsx` ~279 | `from-brand-500 to-teal-600 … hover:to-teal-700` | `from-brand-500 to-brand-700 … hover:to-brand-800` |
| `AudioPlayerBar.tsx` ~409 | `from-brand-500 via-teal-500 to-cyan-500` | `from-brand-500 via-brand-400 to-brand-300` |
| `BatchTab.tsx` ~568 | `from-brand-500 to-teal-600 … hover:to-teal-700` | `from-brand-500 to-brand-700 … hover:to-brand-800` |
| `LoadingScreen.tsx` ~110 | `from-brand-500 to-teal-600 … hover:to-teal-700` | `from-brand-500 to-brand-700 … hover:to-brand-800` |
| `SrtDubbing.tsx` ~245 | `from-brand-500 to-teal-600 … hover:to-teal-700` | `from-brand-500 to-brand-700 … hover:to-brand-800` |
| `VoiceCloningTab.tsx` ~606 | `from-brand-500 to-teal-600` | `from-brand-500 to-brand-700` |
| `ConversationTab.tsx` ~106 | `"from-brand-500 to-teal-500"` | `"from-brand-500 to-brand-400"` |

`ConversationTab.tsx` ~106 là một **chuỗi class nằm trong mảng dữ liệu**, không phải JSX —
đổi đúng giá trị chuỗi, giữ nguyên cấu trúc.

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `cd app-desktop/cobham-studio-app && node --test tests/theme-tokens.test.cjs`
Expected: PASS 24/24.

- [ ] **Step 7: Kiểm tra typecheck**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck`
Expected: không output lỗi.

- [ ] **Step 8: Commit**

```bash
git add app-desktop/cobham-studio-app/src app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs
git commit -m "refactor(ui): so lieu dung font mono, don mau hardcode va gradient teal"
```

---

### Task 9: Xác minh toàn diện

**Files:**
- Modify: không có (chỉ kiểm chứng)
- Test: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Interfaces:**
- Consumes: mọi thay đổi từ Task 1–8
- Produces: ảnh chụp màn hình xác nhận

- [ ] **Step 1: Chạy toàn bộ test frontend**

Run: `cd app-desktop/cobham-studio-app && npm test`
Expected: PASS, không test nào fail (3 file test cũ + file mới).

- [ ] **Step 2: Chạy typecheck và lint**

Run: `cd app-desktop/cobham-studio-app && npm run typecheck && npm run check`
Expected: không output lỗi.

- [ ] **Step 3: Build**

Run: `cd app-desktop/cobham-studio-app && npm run build`
Expected: build thành công, `dist/index.html` tồn tại.

- [ ] **Step 4: Chạy app và kiểm tra bố cục**

Khởi chạy app:
```bash
pkill -f "[a]pps.desktop_app"; sleep 3
cd ~ && setsid nohup ~/.local/bin/cobham-studio > /tmp/cobham.log 2>&1 < /dev/null &
sleep 30
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8001/
```
Expected: `HTTP 200`.

- [ ] **Step 5: Chụp màn hình ở 3 kích thước và kiểm tra**

Dùng `xwd`/`import` (ImageMagick) hoặc công cụ chụp màn hình của môi trường desktop, lưu vào `/tmp/shots/`. Kiểm tra bằng mắt:
- Vùng soạn thảo nền tối, chữ sáng, **đọc được** khi nhìn từ xa
- Thanh phát có nền riêng, không lạc
- Panel phải: nhãn section mono, nút "Tạo giọng đọc" dính đáy
- Sidebar có nền khác header
- Ở cả chế độ sáng và tối: chip cảm xúc đọc được; placeholder textarea đọc được
- Ở 1280px: panel phải không bênh vênh; ở 1024px: không tràn

- [ ] **Step 6: Commit ảnh (nếu có)**

```bash
git add docs/screenshots
git commit -m "docs: anh giao dien moi" || echo "khong co anh de commit"
```
