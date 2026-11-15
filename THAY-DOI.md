# Thay đổi so với bản gốc

Theo yêu cầu của Apache-2.0 mục 4(b), tài liệu này nêu rõ các thay đổi đã thực
hiện so với bản gốc.

- **Bản gốc:** CIT Voice Studio — Copyright 2026 Cuong IT — Apache-2.0
- **Bản phái sinh:** Cobham Studio — https://github.com/cobhamdev91/cobham-voice-studio
- **Nền tảng:** VieNeu-TTS — Copyright 2024-2026 Phạm Nguyễn Ngọc Bảo — Apache-2.0

## 1. Đổi thương hiệu

Tên và biểu tượng của tác giả gốc **không** nằm trong phạm vi giấy phép Apache-2.0
(mục 6). Bản phái sinh này dùng tên riêng "Cobham Studio" và không dùng lại biểu
tượng gốc.

| Vị trí | Giá trị mới |
|---|---|
| Tên hiển thị | `Cobham Studio` |
| Slug / tên thư mục | `cobham-studio` |
| Tên gói Python | `cobham_studio` |
| Tên thư mục dữ liệu runtime | `CobhamStudio` |
| Tên lệnh CLI | `cobham-studio` |
| Tiền tố biến môi trường | `COBHAM_` (thay cho `CIT_`) |

Nguồn duy nhất cần sửa khi đổi tên:

- `apps/branding.py` (backend)
- `app-desktop/cobham-studio-app/src/config/branding.ts` (frontend)

## 2. Tách khỏi lịch sử git của tác giả gốc

- Xoá thư mục `.git` cũ, khởi tạo lại repository mới.
- Xoá `.github/` (workflow CI, template issue/PR, FUNDING) vì tham chiếu tới
  repository và secret của tác giả gốc.

## 3. Tính năng

- **Kiểm tra bản cập nhật**: trỏ sang kho phát hành của bản phái sinh, khai báo
  trong `RELEASES_REPO` (`apps/branding.py`). Khi để trống, tính năng **tự động
  tắt** và ứng dụng không gọi ra ngoài mạng.
- **Remote access (API qua mạng nội bộ)**: giữ nguyên, mặc định tắt.

## 4. Hạ tầng

- Bộ cài đặt: đổi tên gói, tên tệp `.deb`/`.dmg`/`.exe`, desktop entry và
  metainfo của Linux sang `cobham-studio`.
- Logo (`assets/brand/cobham-studio-logo.png`) vẽ lại chữ "CS"; script
  `assets/brand/make_logo.py` chạy được trên Linux/macOS (trước đây chỉ dùng
  đường dẫn font Windows).
- Tài liệu API: `docs/cobham-studio.md` (endpoint `/cobham-studio.md`).

## 5. Điều khoản bảo lưu

Toàn bộ nội dung kỹ thuật của bản gốc được giữ nguyên:

- Engine `src/vieneu/` (VieNeu-TTS) và `src/vieneu_utils/` — **không sửa logic**,
  giữ nguyên ghi công tác giả gốc.
- Ghi chú `AI-generated` trong metadata file âm thanh — **giữ nguyên**, không xoá.
- Cơ chế cam kết quyền nhân bản giọng (checkbox + lưu cùng dữ liệu giọng) —
  giữ nguyên.
- `THIRD-PARTY-NOTICES.md` giữ nguyên danh sách thành phần bên thứ ba và giấy
  phép kèm theo.

## 6. Điều khoản của bản phái sinh

`DIEU-KHOAN.md` và `PRIVACY.md` giữ lại các quy tắc sử dụng có trách nhiệm
(nhân bản giọng, bản quyền nội dung, đánh dấu nội dung do AI tạo ra) vì các
quy tắc này áp dụng cho mọi người dùng. Riêng phần tên thương hiệu và liên kết
đã sửa theo bản phái sinh.
