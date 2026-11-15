# Frontend Architecture & Engineering Context — Cobham Studio

> **Mục đích:** Tài liệu ngữ cảnh chuẩn (SSOT context) cho kỹ sư và AI agent khi bảo trì, nâng cấp giao diện hoặc refactor `app-desktop/cobham-studio-app/`.
> **Cập nhật:** 2026-11-15 · **Nhánh tham chiếu:** `feat/ui-redesign`

---

## 1. Bức tranh hệ thống & Môi trường chạy

- **Ứng dụng:** Cobham Studio — desktop app TTS & Voice Cloning tiếng Việt chạy **100% offline / on-device**.
- **Backend & Serving:**
  - Python desktop host (`apps/desktop_app.py`) phục vụ static build từ `app-desktop/cobham-studio-app/dist/` tại `http://127.0.0.1:8001/`.
  - Launcher cục bộ: `~/.local/bin/cobham-studio` (set `LOCALAPPDATA=$HOME/VoiceStudio`, chạy `.venv/bin/python -m apps.desktop_app`).
- **Frontend Stack (`app-desktop/cobham-studio-app/`):**
  - React 19, TypeScript 6, Vite 8, Tailwind CSS v4 (`@theme`), `class-variance-authority` (`cva`), `lucide-react`, `@fontsource-variable/inter`, `@fontsource/be-vietnam-pro`.
  - Linter/Formatter: Biome / Ultracite (`npm run check`, `npm run fix`).
  - Test runner: Node built-in test runner (`npm test` → `node --test tests/`).
- **Ràng buộc bất biến:**
  1. **Offline hoàn toàn:** Không thêm font CDN hoặc asset tải từ internet. Font mono dùng system stack: `ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`.
  2. **Không đổi API backend** khi nâng cấp UI.
  3. **Không sửa file pháp lý:** `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES.md`, `DIEU-KHOAN.md`.
  4. **Cơ chế theme:** class `.dark` trên `<html>`, `localStorage` key `cobham_studio_theme`.

---

## 2. Kiến trúc Token CSS & Chế độ Sáng/Tối (SSOT)

Mọi màu bề mặt, chữ, viền, bóng và trạng thái phải đi qua token trong `src/app/global.css`. **Cấm hardcode hex/rgb màu thương hiệu hoặc màu bề mặt trực tiếp trong component** (ngoại lệ duy nhất: khối hiển thị code tối có chủ đích `bg-zinc-950 text-zinc-200` trong `RemoteAccessPanel.tsx` và `SettingsModal.tsx`).

### 2.1 Hai lớp bề mặt: Chrome vs Main Panel (Canvas)

| Lớp bề mặt | Thành phần thuộc lớp | Chế độ Sáng (`:root`) | Chế độ Tối (`.dark`) |
|---|---|---|---|
| **Chrome nền & sidebar** | `.studio-workspace`, `.studio-sidebar` | `--background: #eceef1`, `--sidebar: #f7f8fa` | `--background: #0b0c10`, `--sidebar: #0e1015` |
| **Chrome thẻ & header** | `.studio-header`, `.studio-properties`, modal/card | `--card: #ffffff`, `--foreground: #14161a`, `--border: #dde0e6` | `--card: #121419`, `--foreground: #e8eaf0`, `--border: #262a36` |
| **Main Panel — Editor** | `.studio-text-editor`, `.studio-textarea`, preset pill | `--canvas: #ffffff`, `--canvas-foreground: #14161a`, `--canvas-muted: #5b6270` | `--canvas: #14161d`, `--canvas-foreground: #e8eaf0`, `--canvas-muted: #98a0b2` |
| **Main Panel — Toolbars & Player** | `.studio-editor-toolbar`, `.studio-emotions`, hàng `Mẫu:`, `.studio-player`, `.studio-export` | `--canvas-toolbar: #f4f5f7`, `--canvas-border: #dde0e6`, `--canvas-accent: #4f46e5` | `--canvas-toolbar: #1b1e27`, `--canvas-border: #262a36`, `--canvas-accent: #818cf8` |

### 2.2 Thang màu thương hiệu & Ngữ nghĩa

- **Brand Indigo (`@theme`):** `--color-brand-50` (`#eef2ff`) → `--color-brand-950` (`#1e1b4b`).
  - Accent chính sáng: `--primary: #4f46e5` (`brand-600`).
  - Accent chính tối: `--primary: #818cf8` (`brand-400`).
  - **Không dùng màu teal/cyan cũ** (`#0d9488`, `#0f766e`, `#0e7490`, `#2dd4bf`, `#5eead4`).
- **Màu cảm xúc theo ngữ cảnh (`--emotion-*`):**
  - Định nghĩa trong `:root` (chữ đậm cho nền sáng) và `.dark` (chữ sáng cho nền tối): `--emotion-sky`, `--emotion-emerald`, `--emotion-amber`, `--emotion-purple`, `--emotion-slate`.
  - Tiêu thụ qua bảng ánh xạ `EMOTION_CLASS` trong `EmotionBar.tsx` để component dùng lại được ở cả `TextEditor` lẫn `VoiceCloningTab`.
- **Typography:**
  - Chữ chạy: `--font-sans` (Inter Variable).
  - Tiêu đề: `--font-heading` (Be Vietnam Pro).
  - Số liệu & nhãn rack (tốc độ `1,00×`, đếm ký tự/từ/câu/thời lượng, temperature, `GIỌNG ĐỌC`): `--font-mono` + `tabular-nums`.

---

## 3. Bản đồ thư mục & Ranh giới trách nhiệm

```text
app-desktop/cobham-studio-app/
├── index.html                      # Bootstrap screen (phải khớp light/dark trước khi React mount)
├── tests/
│   ├── theme-tokens.test.cjs       # Khóa SSOT token, tương phản >= 10:1, cấm teal & hardcode màu
│   ├── startup.test.cjs            # Polling khởi động & timeout
│   ├── playback.test.cjs           # Điều phối AudioPlayer & lịch sử phát
│   └── model-download.test.cjs     # Tiến độ tải/nạp mô hình
└── src/
    ├── app/
    │   ├── global.css              # Token gốc, layout 3 cột, style TTS workspace
    │   ├── settings.css            # Style riêng cho SettingsModal & ModelManager
    │   └── dictionary.css          # Style cho PronunciationDictionary
    ├── components/ui/              # Primitive tái sử dụng (Button, Tooltip)
    ├── config/branding.ts          # Hằng số tên/thương hiệu ứng dụng (SSOT)
    ├── features/errors/            # ErrorView, ErrorHeader, ErrorDescription, ErrorActions
    └── features/tts/
        ├── api.ts, types.ts        # Giao tiếp API backend & kiểu dữ liệu
        ├── audio-engine.ts         # WebAudio analyser/gain & playback engine
        ├── model-caps.tsx          # Context năng lực model đang chạy (languages, emotions, seed)
        ├── TtsStudio.tsx           # Shell điều phối workspace 3 cột & các tab
        └── components/             # UI components theo tính năng
```

---

## 4. Quy ước kỹ thuật bắt buộc cho các thay đổi tiếp theo

1. **SSOT (Single Source of Truth):**
   - Mỗi selector CSS chỉ nên có **một** vị trí định nghĩa chính trong `global.css` (trừ `@media` responsive); tránh giữ block cũ bên trên rồi ghi đè lại ở cuối file.
   - Các nút hành động chính dùng chung component/variant (`Button` từ `src/components/ui/button.tsx` hoặc `.studio-primary`), không copy-paste chuỗi gradient Tailwind giữa nhiều tab.
2. **Token CSS Mode:**
   - Mọi component trong panel main (`TextEditor`, `EmotionBar`, `AudioPlayerBar`) phải đọc `--canvas*` / `--emotion-*` hoặc token semantic của theme, tránh trộn class chrome (`bg-secondary`, `text-muted-foreground`) và tránh viết cặp `text-X dark:text-Y` thủ công khi đã có biến CSS.
3. **SOLID & Reusable Component:**
   - Component > 300 dòng nên tách logic side-effect/state sang custom hook (`src/features/tts/hooks/`) và tách phần hiển thị lặp lại sang primitive dùng chung (`src/components/ui/`).
4. **JSDoc & Comment:**
   - Mọi `export` component, props `interface`/`type`, custom hook và helper function mới hoặc được sửa phải có JSDoc tiếng Việt ngắn gọn nêu rõ **mục đích** và **tham số/ràng buộc không hiển nhiên**.
   - Comment inline giải thích **vì sao** (why), không mô tả lại dòng code (what).
5. **Checklist xác minh trước khi kết thúc task:**
   - `cd app-desktop/cobham-studio-app && npm test`
   - `npm run typecheck`
   - `npx biome check <các file đã sửa>` (hướng tới `npm run check` sạch toàn repo)
   - `npm run build`
   - Kiểm tra trực quan trên `http://127.0.0.1:8001/` ở cả **Light Mode** và **Dark Mode** tại 1280×800 và 1024×768.
