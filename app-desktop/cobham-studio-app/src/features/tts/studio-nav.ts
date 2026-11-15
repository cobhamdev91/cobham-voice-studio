import type { ActiveTab } from "./types";

/** Mã định danh của các mục điều hướng trong sidebar (gồm tab chính và hộp thoại hệ thống). */
export type StudioNavId = ActiveTab | "dictionary" | "settings";

/** Cấu hình dữ liệu cho một mục điều hướng trong sidebar. */
export interface StudioNavItemConfig {
  id: StudioNavId;
  kind: "tab" | "modal";
  label: string;
}

/** Cấu hình một nhóm điều hướng theo chức năng trong sidebar. */
export interface StudioNavGroupConfig {
  items: readonly StudioNavItemConfig[];
  title: string;
}

/** Kết quả ánh xạ hành động khi người dùng chọn một mục điều hướng. */
export type StudioNavAction =
  | { type: "open-dictionary" }
  | { type: "open-settings" }
  | { type: "switch-tab"; tab: ActiveTab };

/** Danh sách nhóm điều hướng cố định của studio, chia theo Tạo / Thư viện / Hệ thống. */
export const STUDIO_NAV_GROUPS: readonly StudioNavGroupConfig[] = [
  {
    title: "Tạo",
    items: [
      { id: "tts", label: "Đọc văn bản", kind: "tab" },
      { id: "conversation", label: "Hội thoại", kind: "tab" },
      { id: "pdf", label: "Đọc file, lồng tiếng", kind: "tab" },
      { id: "batch", label: "Tạo hàng loạt", kind: "tab" },
      { id: "clone", label: "Nhân bản giọng", kind: "tab" },
    ],
  },
  {
    title: "Thư viện",
    items: [
      { id: "dictionary", label: "Từ điển phát âm", kind: "modal" },
      { id: "history", label: "Bản đã tạo", kind: "tab" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { id: "settings", label: "Cài đặt", kind: "modal" },
      { id: "about", label: "Thông tin và bản quyền", kind: "tab" },
    ],
  },
];

/** Trả về hành động tương ứng khi chọn một mục trong thanh điều hướng. */
export function resolveNavAction(id: StudioNavId): StudioNavAction {
  if (id === "dictionary") {
    return { type: "open-dictionary" };
  }
  if (id === "settings") {
    return { type: "open-settings" };
  }
  return { type: "switch-tab", tab: id };
}
