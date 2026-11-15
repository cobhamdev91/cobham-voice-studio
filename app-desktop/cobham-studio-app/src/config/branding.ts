/**
 * Thương hiệu và danh tính của ứng dụng.
 *
 * ĐÂY LÀ FILE DUY NHẤT CẦN SỬA KHI ĐỔI TÊN ỨNG DỤNG (phía frontend).
 * Bản sao phía backend nằm tại `apps/branding.py` — sửa cả hai cho khớp.
 */

export const APP_NAME = "Cobham Studio";

/** tên rút gọn: dùng cho tên thư mục, id, tiền tố biến môi trường */
export const APP_SLUG = "cobham-studio";
export const APP_ID = "cobham_studio";

/** kho phát hành dùng cho kiểm tra bản cập nhật (để trống = tắt) */
export const RELEASES_REPO = "cobhamdev91/cobham-voice-studio";
export const RELEASES_URL = RELEASES_REPO
  ? `https://github.com/${RELEASES_REPO}`
  : "";

export const AUTHOR_NAME = "Cobham Studio";
export const AUTHOR_URL = "https://github.com/cobhamdev91";
export const COPYRIGHT_YEAR = "2026";
