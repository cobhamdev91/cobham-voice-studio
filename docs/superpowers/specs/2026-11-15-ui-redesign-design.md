# Thiết kế lại giao diện Cobham Studio — chrome sáng, canvas tối

- Ngày: 2026-11-15
- Trạng thái: **đã duyệt**
- Phạm vi: frontend (`app-desktop/cobham-studio-app/`)

## 1. Vì sao làm

Cobham Studio là bản phái sinh của CIT Voice Studio. Giao diện hiện tại vẫn là của bản
gốc: cùng bảng màu teal, cùng bo góc tròn, cùng card trắng. Đọc ảnh chụp trong README
thì thấy ngay đây là sản phẩm của người khác — mục tiêu "làm thành của mình" chưa đạt
được ở tầng giao diện.

Bổ sung: app được dùng cho **việc dài, nhiều thao tác** (lồng tiếng cả video, tạo hàng
loạt, nhân bản giọng), không phải kiểu dán text → nghe → xong. Nên bố cục phải là
**studio**: giữ bảng điều khiển đầy đủ bên phải, có chỗ xem trước, tham số luôn thấy.

## 2. Mục tiêu / không mục tiêu / chống mục tiêu

**Mục tiêu**
1. Giao diện nhìn ra là sản phẩm riêng, không phải bản đổi màu.
2. Có đặc trưng hình ảnh nhớ được — một dấu hiệu thị giác gọi tên.
3. Vùng làm việc luôn dễ đọc với văn bản tiếng Việt dài.
4. Bảng điều khiển phải đầy đủ, rõ ràng, nhìn thấy trạng thái.

**Không mục tiêu**
- Không đổi layout 3 cột, không đổi cây thư mục tính năng, không đổi logic React.
- Không thêm tính năng mới.
- Không đổi API của backend.

**Chống mục tiêu**
- Không được trông như app AI sinh bằng prompt: gradient tím, bo góc 16px, icon bo tròn
  ở mọi nơi.
- Không được giống bản gốc: teal + bo tròn + card trắng + panel dán mép.

## 3. Ràng buộc

- App chạy **offline**, mọi font phải đóng gói sẵn (không thêm dependency mới).
- Màu bề mặt trong component đã dùng token (`bg-card`, `text-foreground`) — chỉ 12 chỗ
  hardcode. Đổi token lan tới gần hết app.
- Có sẵn cả chế độ sáng/tối (`.dark` trên `<html>`, lưu `cobham_studio_theme`).
- `index.html` có màn hình bootstrap tự viết, có màu hex hardcode — phải sửa riêng.
- Panel phải đang `clamp(288px, 26vw, 400px)`.

## 4. Các hướng đã cân nhắc

| | Hướng | Đánh đổi | Kết quả |
|---|---|---|---|
| A | Chrome sáng – canvas tối (Ableton/Logic) | Phải quản 2 hệ màu song song; vùng viết nền tối | **Chọn** |
| B | Console tối toàn bộ (Pro Tools dark) | Mỏi mắt khi đọc văn bản tiếng Việt dài; phải làm lại bảng màu dark từ đầu | Bỏ |
| C | Studio sáng phẳng, mật độ cao (kiểu Linear) | Rủi ro thấp nhất nhưng ít khác biệt, dễ giống app khác | Bỏ |

Chọn **A** vì nó cho cả hai điều: vùng viết nền tối là dấu hiệu studio ai cũng nhận ra
(khác hẳn bản gốc), còn phần điều khiển vẫn sáng nên số liệu và tham số dễ đọc.

## 5. Thiết kế

### 5.1 Ý tưởng trung tâm

App chia làm hai loại mặt phẳng, phân biệt bằng chất liệu chứ không chỉ bằng màu:

- **Chrome** — header, sidebar, panel điều khiển bên phải. Sáng, trung tính, giống
  vỏ máy. Điều khiển nằm ở đây nên nó phải dễ đọc.
- **Canvas** — vùng soạn thảo và thanh phát. Luôn tối, như màn hình của thiết bị.
  Nội dung bạn làm việc nằm ở đây nên nó phải nổi lên.

Canvas tối **ở cả hai chế độ sáng/tối**. Ở chế độ sáng: vỏ sáng + màn hình tối (Ableton).
Ở chế độ tối: vỏ tối + màn hình tối đậm hơn (Logic). Người dùng luôn biết "chỗ này là
màn hình".

### 5.2 Token mới

Bổ sung nhóm token `--canvas-*`, dùng chung cho light và dark:

```css
--canvas:            #14161d;   /* nền vùng viết */
--canvas-foreground: #e8eaf0;
--canvas-muted:      #98a0b2;   /* placeholder, nhãn phụ */
--canvas-border:     #262a36;
--canvas-toolbar:    #1b1e27;   /* toolbar, thanh phát */
--canvas-accent:     #818cf8;
```

**Chrome sáng** (`:root`) — chuyển từ teal sang indigo, nền bớt xanh:

```css
--background: #eceef1;      --card: #ffffff;         --foreground: #14161a;
--primary:   #4f46e5;      --primary-foreground: #ffffff;
--secondary: #f1f3f6;      --muted: #f4f5f7;        --muted-foreground: #5b6270;
--accent:    #eef0fe;      --accent-foreground: #3730a3;
--border:    #dde0e6;      --input: #c9ced8;        --ring: #6366f1;
--sidebar:   #f7f8fa;      --sidebar-accent: #4f46e5;
--radius: 0.5rem;           /* 10px -> 8px */
```

**Chrome tối** (`.dark`):

```css
--background: #0b0c10;      --card: #121419;         --foreground: #e8eaf0;
--primary:   #818cf8;      --primary-foreground: #0b0c10;
--secondary: #1b1e27;      --muted: #171a21;        --muted-foreground: #99a0b0;
--accent:    #232742;      --accent-foreground: #c7d2fe;
--border:    #262a36;      --sidebar: #0e1015;
```

**Thang brand** trong `@theme` đổi từ teal sang indigo — component gọi `brand-500`… tự
đổi theo:

```
50 #eef2ff   100 #e0e7ff   200 #c7d2fe   300 #a5b4fc   400 #818cf8
500 #6366f1  600 #4f46e5   700 #4338ca   800 #3730a3   900 #312e81  950 #1e1b4b
```

**Bóng**: bỏ `--shadow-md` tông teal, thay bằng shadow trung tính nhẹ. Canvas dùng
`inset 0 1px 0 rgb(255 255 255 / 4%)` + shadow mềm để nổi.

### 5.3 Typography

- Chữ chạy: Inter Variable — giữ.
- Tiêu đề: Be Vietnam Pro — giữ (dấu tiếng Việt cân).
- **Số liệu** (`1.00×`, seed, số ký tự, thời lượng): chuyển sang `font-mono` hệ thống
  (`ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`). Không thêm font mới
  để đóng gói → không vi phạm ràng buộc offline.
- Nhãn section trong panel: 11px, uppercase, letter-spacing rộng, mono — kiểu rack máy.

### 5.4 Thay đổi từng bề mặt

| Bề mặt | Hiện tại | Sau |
|---|---|---|
| `.studio-header` | card trắng, viền dưới | giữ; bo góc logo 8→6px; pill "Đổi mô hình" dùng viền mảnh |
| `.studio-sidebar` | trắng, viền phải | nền `--sidebar` (#f7f8fa) → tách khỏi header; mục đang chọn giữ nền primary đặc |
| `.studio-text-editor` | card trắng, radius 14px, shadow teal | **nền `--canvas`**, radius 10px, viền `--canvas-border`, chữ `--canvas-foreground` |
| toolbar trong editor | nền secondary | nền `--canvas-toolbar`, chữ `--canvas-muted` |
| `.studio-player` | trong suốt, không viền | **bề mặt riêng**: nền `--canvas-toolbar`, radius 10px, viền `--canvas-border` — thành transport bar |
| `.studio-properties` | card, viền trái, dán mép | giữ dán mép; thêm đường kẻ chia section; nhãn section mono uppercase; **nút "Tạo giọng đọc" dính đáy**, nền riêng |
| `index.html` bootstrap | gradient xanh sáng | nền `--canvas` ngay từ đầu (không nháy trắng), khớp canvas |

Emotion chip giữ màu ngữ nghĩa (amber/rose/violet) vì chúng mang ý nghĩa, không phải
màu thương hiệu — nhưng chỉnh độ tương phản cho nền tối.

### 5.5 Ba lỗi "sạc" được sửa

1. Player trong suốt lạc trong editor card đặc → player thành bề mặt riêng, đồng chất
   với canvas.
2. Panel phải dán mép trông như bảng điều khiển dán → thêm ranh giới section, nhãn
   mono, nút dính đáy → đọc ra là một rack.
3. Header và sidebar cùng trắng, không có ranh giới → sidebar có nền riêng.

## 6. Quyết định đã chốt

| | |
|---|---|
| Hướng | A — chrome sáng, canvas tối |
| Canvas tối ở cả 2 chế độ | có — vùng làm việc luôn là "màn hình" |
| Màu nhấn | indigo (`#4f46e5` / `#818cf8`); amber & rose giữ cho trạng thái |
| Bo góc | 8px (`--radius`), canvas 10px |
| Bố cục | giữ nguyên 3 cột |
| Chụp ảnh README | để sau, không làm trong đợt này |

## 7. Việc còn lại cho người triển khai

1. Thêm nhóm token `--canvas-*` + đổi `--radius`, bảng màu light/dark, thang brand.
2. Đổi style `.studio-text-editor`, toolbar, `.studio-player`, `.studio-properties`,
   `.studio-sidebar`.
3. Chuyển số liệu sang `font-mono`.
4. Sửa `index.html` bootstrap về nền canvas.
5. Chỉnh độ tương phản của chip cảm xúc / màu trạng thái trên nền tối.
6. Kiểm tra 12 chỗ màu bề mặt hardcode (`bg-zinc-950`, `text-zinc-200`, …) — đưa về token.
7. Build, chạy app, xác nhận không tràn bố cục ở 1024/1280/1920.

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Editor nền tối khó đọc khi nhập văn bản dài | `--canvas-foreground` #e8eaf0 trên #14161d → tương phản ~13:1; chữ 16px, line-height cao |
| 12 chỗ màu hardcode lọt lẹu sang kiểu cũ | rà lại trong bước 6 |
| Panel phải chật khi thêm nhãn mono | nhãn 11px, section padding 12px; đã có clamp 288–400px |
| Emotion chip trên nền tối mờ | chỉnh riêng nhóm màu trạng thái, không đụng `--canvas-*` |
