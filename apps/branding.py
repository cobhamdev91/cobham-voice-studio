"""Thương hiệu và danh tính của ứng dụng.

ĐÂY LÀ FILE DUY NHẤT CẦN SỬA KHI ĐỔI TÊN ỨNG DỤNG.
Backend dùng các hằng số ở đây. Frontend có bản sao tương ứng tại
``app-desktop/loi-studio-app/src/config/branding.ts`` — sửa cả hai.

Về pháp lý: giấy phép Apache-2.0 không bao hàm tên và biểu tượng của tác giả
gốc, nên tên hiển thị phải là tên riêng của bản phái sinh này.
"""

from __future__ import annotations

# ── Tên hiển thị ────────────────────────────────────────────────────────────
APP_NAME = "Cobham Studio"

# ── Tên rút gọn dùng cho đường dẫn, tên gói, tên lệnh ─────────────────────
APP_SLUG = "cobham-studio"       # ký tự thường, dùng trong tên file/thư mục
APP_ID = "cobham_studio"         # dùng cho tên module Python, tên biến môi trường
APP_DATA_DIR = "CobhamStudio"    # tên thư mục dữ liệu runtime

# ── Kho phát hành ──────────────────────────────────────────────────────────
# Dùng cho kiểm tra bản cập nhật. Đổi thành "<user>/<repo>" của bạn.
# Để trống thì tự động tắt tính năng kiểm tra cập nhật.
RELEASES_REPO = "cobhamdev91/cobham-voice-studio"
RELEASES_URL = f"https://github.com/{RELEASES_REPO}" if RELEASES_REPO else ""

# ── Thông tin hiển thị trong hộp thoại "Giới thiệu" ────────────────────────
AUTHOR_NAME = "Cobham Studio"
AUTHOR_URL = "https://github.com/cobhamdev91"
COPYRIGHT_YEAR = "2026"


def app_name() -> str:
    return APP_NAME


def releases_repo() -> str:
    return RELEASES_REPO


def releases_page() -> str:
    return RELEASES_URL


def update_check_enabled() -> bool:
    """Chỉ bật khi đã trỏ sang kho phát hành thật."""
    return bool(RELEASES_REPO)
