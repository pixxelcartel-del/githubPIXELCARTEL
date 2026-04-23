"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isThemeMode, resolveThemeMode, themeStorageKey, type ThemeMode } from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    media.addEventListener("change", listener);
    queueMicrotask(() => {
      const stored = window.localStorage.getItem(themeStorageKey);
      if (isThemeMode(stored)) {
        setModeState(stored);
      }
      setPrefersDark(media.matches);
    });
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolved = resolveThemeMode(mode, prefersDark);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  function setMode(nextMode: ThemeMode) {
    setModeState(nextMode);
    window.localStorage.setItem(themeStorageKey, nextMode);
  }

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();
  const modes: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-1">
      {modes.map((item) => {
        const Icon = item.icon;
        const active = mode === item.mode;
        return (
          <Button
            key={item.mode}
            type="button"
            size="sm"
            variant={active ? "primary" : "ghost"}
            className={compact ? "h-8 px-2" : "h-8 px-3"}
            aria-label={item.label}
            aria-pressed={active}
            onClick={() => setMode(item.mode)}
          >
            <Icon className="h-4 w-4" />
            {!compact && item.label}
          </Button>
        );
      })}
    </div>
  );
}
