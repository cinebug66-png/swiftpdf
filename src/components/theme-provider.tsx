import { createContext, useContext, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = {
  theme: Theme;
  selectedTheme: Theme;
  isMobile: boolean;
  toggle: () => void;
};

const MOBILE_THEME_QUERY = "(max-width: 767px)";

const ThemeCtx = createContext<ThemeContextValue>({
  theme: "light",
  selectedTheme: "light",
  isMobile: false,
  toggle: () => {},
});

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("light");
  const [isMobile, setIsMobile] = useState(false);
  const effectiveTheme: Theme = isMobile ? "light" : selectedTheme;

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_THEME_QUERY);

    const syncTheme = () => {
      const nextIsMobile = mobileQuery.matches;
      const preferredTheme = getPreferredTheme();

      setIsMobile(nextIsMobile);
      setSelectedTheme(preferredTheme);
    };

    syncTheme();
    mobileQuery.addEventListener?.("change", syncTheme);
    return () => mobileQuery.removeEventListener?.("change", syncTheme);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
    document.documentElement.style.colorScheme = effectiveTheme;

    if (isMobile) {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [effectiveTheme, isMobile]);

  const toggle = () => {
    const next: Theme = selectedTheme === "dark" ? "light" : "dark";
    setSelectedTheme(next);
    localStorage.setItem("theme", next);
  };

  return (
    <ThemeCtx.Provider value={{ theme: effectiveTheme, selectedTheme, isMobile, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
