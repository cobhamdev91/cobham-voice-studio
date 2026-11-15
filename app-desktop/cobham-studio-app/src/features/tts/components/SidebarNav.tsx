import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  History,
  Info,
  ListOrdered,
  Mic,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type React from "react";
import type { AppUpdateInfo } from "../api";
import {
  resolveNavAction,
  STUDIO_NAV_GROUPS,
  type StudioNavId,
} from "../studio-nav";
import type { ActiveTab } from "../types";
import { SidebarFooter } from "./AppUpdate";

const NAV_ICONS: Record<StudioNavId, LucideIcon> = {
  tts: Mic,
  conversation: Users,
  pdf: FileText,
  batch: ListOrdered,
  clone: Sparkles,
  dictionary: BookOpen,
  history: History,
  settings: Settings,
  about: Info,
};

interface SidebarNavProps {
  activeTab: ActiveTab;
  apiUrl: string;
  appUpdate: AppUpdateInfo | null;
  historyCount: number;
  onOpenDictionary: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onUpdateChecked: (info: AppUpdateInfo) => void;
}

/** Thanh điều hướng bên trái của studio cùng chân trang kiểm tra cập nhật. */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  apiUrl,
  appUpdate,
  historyCount,
  onOpenDictionary,
  onOpenSettings,
  onSelectTab,
  onUpdateChecked,
}) => {
  const handleSelect = (id: StudioNavId) => {
    const action = resolveNavAction(id);
    if (action.type === "open-dictionary") {
      onOpenDictionary();
      return;
    }
    if (action.type === "open-settings") {
      onOpenSettings();
      return;
    }
    onSelectTab(action.tab);
  };

  return (
    <nav aria-label="Chức năng" className="studio-sidebar">
      <div className="studio-nav-groups">
        {STUDIO_NAV_GROUPS.map((group) => (
          <div className="studio-nav-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.id];
              return (
                <button
                  aria-current={activeTab === item.id ? "page" : undefined}
                  className="studio-nav-item"
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                  {item.id === "history" && (
                    <span className="studio-nav-count">{historyCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <SidebarFooter
        apiUrl={apiUrl}
        info={appUpdate}
        onChecked={onUpdateChecked}
      />
    </nav>
  );
};
