"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="theme-toggle-wrap" title={isDark ? "切换到亮色主题" : "切换到黑夜主题"}>
      {!compact && <span className="theme-toggle-label">黑夜</span>}
      <button
        type="button"
        role="switch"
        suppressHydrationWarning
        aria-checked={isDark}
        aria-label={isDark ? "切换到亮色主题" : "切换到黑夜主题"}
        onClick={toggleTheme}
        className="theme-toggle"
      >
        <svg className="theme-toggle-icon theme-toggle-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.4 15.2A8.3 8.3 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />
        </svg>
        <svg className="theme-toggle-icon theme-toggle-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <span className="theme-toggle-thumb" />
      </button>
    </div>
  );
}
