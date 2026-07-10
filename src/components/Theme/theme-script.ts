export const THEME_STORAGE_KEY = "sutone-color-theme";
export const THEME_COOKIE_KEY = "sutone_color_theme";

export const themeInitializationScript = `
  (function () {
    var theme = "light";
    var storedTheme = null;
    try {
      storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    } catch (_) {}
    if (storedTheme !== "dark" && storedTheme !== "light") {
      try {
        var cookieMatch = document.cookie.match(/(?:^|; )${THEME_COOKIE_KEY}=(dark|light)(?:;|$)/);
        storedTheme = cookieMatch ? cookieMatch[1] : null;
      } catch (_) {}
    }
    if (storedTheme === "dark" || storedTheme === "light") {
      theme = storedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.crepeTheme = theme;
    document.documentElement.style.colorScheme = theme;
  })();
`;
