# Kế hoạch dọn kỹ thuật & chuẩn hoá SSOT / SOLID / Token Mode / JSDoc — Implementation Plan

> **For agentic workers:** Thực hiện tuần tự từng task theo nguyên tắc TDD (viết/cập nhật test kiểm chứng → sửa code → chạy `npm test`, `npm run typecheck`, `npx biome check` → commit). Không thay đổi hành vi API backend hay layout 3 cột.

**Goal:** Đưa codebase frontend (`app-desktop/cobham-studio-app/`) đạt chuẩn SSOT, Token CSS Mode (Light/Dark), Reusable Component, SOLID, Readability và JSDoc đồng nhất, đồng thời xử lý dứt điểm các lỗi/cảnh báo còn sót từ `npm run check` (`ultracite check`).

**Context:** Đọc [frontend-architecture-context.md](../contexts/frontend-architecture-context.md) trước khi bắt đầu.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, `cva`, Biome/Ultracite, `node --test`.

---

## Ràng buộc & Phạm vi

- Không thêm dependency npm mới; giữ nguyên hành vi người dùng ở cả 2 chế độ Sáng/Tối.
- Không phá vỡ 41 test hiện có trong `app-desktop/cobham-studio-app/tests/`.
- Mỗi task hoàn tất phải pass: `npm test`, `npm run typecheck`, `npx biome check` trên các file chạm tới, và `npm run build`.

---

### Task 1: Đồng bộ Light/Dark cho màn hình bootstrap (`index.html`)

**Vấn đề hiện tại:** `index.html` đang hardcode nền tối `#14161d` (lệch với `--canvas: #ffffff` / `--background: #eceef1` ở chế độ sáng), còn `box-shadow: 0 14px 30px rgba(5, 150, 105, 0.22)` màu xanh lá cũ ở `.bootstrap-mark` (dòng 40), và `<svg>` bootstrap thiếu `<title>` (lỗi `lint/a11y/noSvgWithoutTitle` khi chạy `npm run check`).

**Files:**
- Modify: `app-desktop/cobham-studio-app/index.html`
- Modify: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Steps:**
- [ ] **Step 1:** Cập nhật test `"bootstrap nền canvas, không dùng nền sáng"` trong `tests/theme-tokens.test.cjs` để kiểm tra:
  - Chế độ mặc định sáng dùng `#eceef1` / `#ffffff`, chữ `#14161a`, accent `#4f46e5`.
  - Có `@media (prefers-color-scheme: dark)` hoặc script đọc `localStorage.getItem("cobham_studio_theme")` áp dụng `#14161d` cho nền tối, không nháy trắng khi người dùng đang bật dark mode.
  - Không còn màu cũ (`#f3f8f8`, `#e1f6f1`, `rgba(5, 150, 105`).
- [ ] **Step 2:** Chạy `node --test tests/theme-tokens.test.cjs` để xác nhận test fail.
- [ ] **Step 3:** Sửa `index.html`:
  - Đặt màu sáng mặc định khớp `:root`, giữ block `@media (prefers-color-scheme: dark)` + inline script nhỏ đọc `cobham_studio_theme` (set class `dark` lên `<html>` trước first paint nếu user đã lưu `"dark"`).
  - Đổi `box-shadow` của `.bootstrap-mark` sang indigo (`rgba(79, 70, 229, 0.24)`).
  - Thêm `<title>Cobham Studio</title>` vào `<svg>` trong `.bootstrap-mark`.
- [ ] **Step 4:** Chạy `node --test tests/theme-tokens.test.cjs` và `npx biome check index.html tests/theme-tokens.test.cjs` để xác nhận pass sạch.
- [ ] **Step 5:** Commit: `fix(ui): dong bo light dark va a11y cho bootstrap index.html`.

---

### Task 2: Khử trùng lặp CSS & dọn nốt màu teal trong `global.css` và `settings.css`

**Vấn đề hiện tại:**
- `global.css` vẫn còn màu teal cũ: `#0e7490` (dòng 565, 1027, 2079), shadow `rgb(13 148 136 / ...)` / `rgb(45 212 191 / ...)` / `rgb(20 184 166 / ...)` (dòng 1429–1507, 1741, 2081), và `--tone-bg: #ccfbf1; --tone-fg: #115e59` (dòng 1529–1530).
- `settings.css` còn `rgb(45 212 191 / 12%)` và `rgb(45 212 191 / 16%)` (dòng 366, 410, 645).
- Nhiều selector trong `global.css` bị tách thành 2–3 block rời nhau (`.studio-primary`, `.studio-voice-heading h2`, `.studio-logo`, `.studio-sidebar`, `.studio-audio-player`), vi phạm SSOT.

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css`
- Modify: `app-desktop/cobham-studio-app/src/app/settings.css`
- Modify: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Steps:**
- [ ] **Step 1:** Thêm test vào `tests/theme-tokens.test.cjs`:
  - Cấm toàn bộ mã teal cũ (`#0e7490`, `#0f766e`, `13 148 136`, `45 212 191`, `20 184 166`) trong `global.css` và `settings.css`.
  - Xác minh các selector trọng tâm (`.studio-voice-heading h2`, `.studio-logo`, `.studio-properties`) chỉ có 1 block định nghĩa (ngoài `@media`).
- [ ] **Step 2:** Chạy test để xác nhận fail.
- [ ] **Step 3:** Thay các giá trị teal trong `global.css` và `settings.css` sang indigo (`var(--color-brand-*)` hoặc `color-mix(in srgb, var(--primary) ..., transparent)`). Đổi `--tone-bg` / `--tone-fg` mặc định của `.studio-voice-avatar` sang indigo/slate trung tính (`#e0e7ff` / `#3730a3`).
- [ ] **Step 4:** Gộp các rule trùng lặp trong `global.css` về 1 nơi duy nhất (giữ nguyên thứ tự ưu tiên `@media` và specificity), loại bỏ helper `allBlocks()` dư thừa nếu chỉ còn 1 block.
- [ ] **Step 5:** Chạy `npm test`, `npx biome check src/app/global.css src/app/settings.css tests/theme-tokens.test.cjs`, và `npm run build`.
- [ ] **Step 6:** Commit: `refactor(css): hop nhat selector trung lap va don not mau teal`.

---

### Task 3: Chuẩn hoá Token CSS Mode hoàn toàn trong vùng Main Panel

**Vấn đề hiện tại:**
- `TextEditor.tsx` (dòng 168–229) còn class chrome (`text-muted-foreground`, `hover:bg-secondary/80`) và cặp `dark:` (`text-amber-600 dark:text-amber-400`, `text-violet-600 dark:text-violet-400`) trên thanh công cụ bên trong `.studio-canvas`.
- `AudioPlayerBar.tsx` (dòng 303, 324) dùng `text-violet-700 dark:text-violet-300` và `text-sky-700 dark:text-sky-300`.
- `EmotionBar.tsx` (dòng 62–63) vẫn mang `border-border/60 bg-secondary/25 text-foreground/90` rồi bị `.studio-emotions` ở cuối `global.css` ghi đè.

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/app/global.css`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/TextEditor.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/AudioPlayerBar.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/EmotionBar.tsx`
- Modify: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Steps:**
- [ ] **Step 1:** Thêm biến trạng thái theo ngữ cảnh vào `:root` và `.dark` (ví dụ `--status-amber`, `--status-violet`, `--status-sky`, `--status-rose`) hoặc tách props `surface="canvas" | "chrome"` rõ ràng cho `EmotionBar`.
- [ ] **Step 2:** Thay các class chrome/`dark:` còn sót trong `TextEditor.tsx`, `AudioPlayerBar.tsx`, `EmotionBar.tsx` sang biến `--canvas*` / `--status-*`.
- [ ] **Step 3:** Mở rộng test trong `tests/theme-tokens.test.cjs` để xác minh `TextEditor.tsx` và `AudioPlayerBar.tsx` không còn chứa token chrome (`bg-secondary`, `text-muted-foreground`, `text-foreground`).
- [ ] **Step 4:** Chạy `npm test`, `npm run typecheck`, `npx biome check`, và kiểm chứng giao diện trên `http://127.0.0.1:8001/` ở Light/Dark mode.
- [ ] **Step 5:** Commit: `refactor(ui): chuan hoa token canvas cho toolbar va trang thai`.

---

### Task 4: Tái sử dụng Reusable Component cho nút hành động chính (`Button`)

**Vấn đề hiện tại:** `src/components/ui/button.tsx` đã cài sẵn `cva`, nhưng 5+ component (`AudioPlayerBar`, `BatchTab`, `LoadingScreen`, `SrtDubbing`, `VoiceCloningTab`, `TtsStudio`) vẫn lặp lại chuỗi class `studio-primary flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 ...`.

**Files:**
- Modify: `app-desktop/cobham-studio-app/src/components/ui/button.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/AudioPlayerBar.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/BatchTab.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/LoadingScreen.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/SrtDubbing.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/components/VoiceCloningTab.tsx`
- Modify: `app-desktop/cobham-studio-app/src/features/tts/TtsStudio.tsx`
- Modify: `app-desktop/cobham-studio-app/tests/theme-tokens.test.cjs`

**Steps:**
- [ ] **Step 1:** Thêm `variant: { studio: "studio-primary ..." }` (và biến thể busy/destructive nếu cần) vào `buttonVariants` trong `src/components/ui/button.tsx` kèm JSDoc cho `Button` và `buttonVariants`.
- [ ] **Step 2:** Thay các nút `<button className="studio-primary ... bg-gradient-to-r from-brand-500 to-brand-700 ...">` ở 6 file trên sang `<Button variant="studio" ...>`.
- [ ] **Step 3:** Thêm test trong `tests/theme-tokens.test.cjs` đảm bảo không còn trùng lặp chuỗi `from-brand-500 to-brand-700` trực tiếp trong `src/features/`.
- [ ] **Step 4:** Chạy `npm test`, `npm run typecheck`, `npx biome check`, `npm run build`.
- [ ] **Step 5:** Commit: `refactor(ui): tai su dung Button variant studio lam SSOT nut chinh`.

---

### Task 5: Chuẩn hoá JSDoc & dọn sạch lỗi Ultracite/Biome toàn repo

**Vấn đề hiện tại:**
- Nhiều component & props interface chưa có JSDoc (`EmotionBar`, `TextEditor`, `AudioPlayerBar`, `Header`, `error-base`, `AboutTab`, `BatchTab`, `ConversationTab`, `LoadingScreen`, `SrtDubbing`, `VoiceCloningTab`).
- `npm run check` (`ultracite check`) còn báo lỗi có sẵn ở một số file đã chạm (`TextEditor.tsx`, `Header.tsx`, `AudioPlayerBar.tsx`, `ConversationTab.tsx`, `audio-engine.ts`, v.v.).

**Files:**
- Modify: các component và helper trong `app-desktop/cobham-studio-app/src/features/` và `src/components/ui/`.

**Steps:**
- [ ] **Step 1:** Bổ sung JSDoc tiếng Việt ngắn gọn, đúng chuẩn cho mọi exported component, props interface, custom hook và helper function trong `src/components/ui/` và `src/features/tts/components/` + `src/features/errors/error-base.tsx`.
- [ ] **Step 2:** Sửa các lỗi Biome/Ultracite ở các file trong scope: sắp xếp import (`TextEditor.tsx`, `Header.tsx`), bỏ `any` và gán biến trong `while` (`ConversationTab.tsx`), xử lý a11y/hook deps ở `AudioPlayerBar.tsx` (kèm comment hoặc refactor ref callback).
- [ ] **Step 3:** Chạy `npx biome check` trên toàn bộ `src/features/tts/components/`, `src/features/errors/`, `src/components/ui/`, rồi kiểm tra `npm run check` để thu hẹp/triệt tiêu lỗi toàn repo.
- [ ] **Step 4:** Chạy `npm test && npm run typecheck && npm run build`.
- [ ] **Step 5:** Commit: `docs(ui): bo sung jsdoc va don sach loi lint biome`.

---

### Task 6: Tái cấu trúc SOLID (SRP) cho các component kích thước lớn (lộ trình tách hook & view)

**Mục tiêu:** Giảm kích thước và trách nhiệm đơn lẻ của các file > 500 dòng (`TtsStudio.tsx` 1238 dòng, `BatchTab.tsx` 654 dòng, `VoiceCloningTab.tsx` 645 dòng, `ConversationTab.tsx` 623 dòng, `VoiceSelector.tsx` 580 dòng, `AudioPlayerBar.tsx` 537 dòng) theo từng bước nhỏ không làm gián đoạn tính năng:

1. **`VoiceSelector.tsx` (580 dòng):** tách hook `useVoicePreview` (quản lý `Audio` preview, abort controller, revoke URL) và sub-component `VoiceListItem` + `SpeedControl`.
2. **`AudioPlayerBar.tsx` (537 dòng):** tách hook `useAudioElementSync` và sub-component `AudioWaveformCanvas` + `ExportMenu`.
3. **`VoiceCloningTab.tsx` / `BatchTab.tsx` / `ConversationTab.tsx`:** tách phần xử lý API/state batch hoặc recording sang `hooks/` riêng (`useVoiceRecorder`, `useBatchQueue`, `useConversationDubbing`), giữ component chính thuần điều phối layout.
4. **`TtsStudio.tsx` (1238 dòng):** tách `SidebarNav` và hook `useTtsGeneration` / `useStudioNavigation`, đưa `TtsStudio.tsx` về shell layout gọn dưới ~300 dòng.

**Điều kiện hoàn thành Task 6:** Mỗi lần tách 1 hook/sub-component phải kèm unit test logic tương ứng trong `tests/` (theo mẫu `playback.test.cjs`, `startup.test.cjs`), chạy `npm test && npm run typecheck && npm run check && npm run build` trước khi commit riêng từng phần.
