"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/Theme/ThemeToggle";

type IconName = "home" | "draft" | "article" | "flow" | "slides" | "user";

const NAV_ITEMS: Array<{ label: string; path: string; icon: IconName }> = [
  { label: "首页", path: "/", icon: "home" },
  { label: "草稿", path: "/drafts", icon: "draft" },
  { label: "文章", path: "/articles", icon: "article" },
  { label: "流程图", path: "/drawio", icon: "flow" },
  { label: "演示", path: "/ppt", icon: "slides" },
  { label: "我的", path: "/me", icon: "user" },
];

function NavIcon({ name }: { name: IconName }) {
  if (name === "home") {
    return <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />;
  }
  if (name === "draft") {
    return <><path d="M5 3h10l4 4v14H5V3Z" /><path d="M15 3v5h5M8 12h8M8 16h6" /></>;
  }
  if (name === "article") {
    return <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>;
  }
  if (name === "flow") {
    return <><rect x="3" y="3" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M9 5.5h3a4 4 0 0 1 4 4V16M12 12l4 4 4-4" /></>;
  }
  if (name === "slides") {
    return <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21l4-4 4 4M8 8h8M8 12h5" /></>;
  }
  return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
}

interface WorkspaceHeaderProps {
  activePath: string;
  userName?: string;
  onLogout?: () => void;
}

export default function WorkspaceHeader({
  activePath,
  userName,
  onLogout,
}: WorkspaceHeaderProps) {
  const router = useRouter();

  const isActive = (path: string) =>
    path === "/" ? activePath === "/" : activePath.startsWith(path);

  return (
    <header className="workspace-top-nav">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="workspace-top-brand"
        aria-label="返回 Sutmuch 首页"
      >
        <span className="workspace-brand-mark" aria-hidden="true">
          S
        </span>
        <span className="workspace-brand-copy">
          <strong>Sutmuch</strong>
          <small>AI 创作工作区</small>
        </span>
      </button>

      <nav className="workspace-main-nav" aria-label="主菜单">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className={`workspace-nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <NavIcon name={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="workspace-top-actions">
        {userName && <span className="workspace-top-user">{userName}</span>}
        <ThemeToggle compact />
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="workspace-header-icon-btn"
            title="退出登录"
            aria-label="退出登录"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
