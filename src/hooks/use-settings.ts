"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardSettings {
  defaultTeamId: string | null;
  refreshInterval: number; // milliseconds, 0 = disabled
}

const STORAGE_KEY = "linear-dashboard-settings";

const DEFAULT_SETTINGS: DashboardSettings = {
  defaultTeamId: null,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
};

function loadSettings(): DashboardSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<DashboardSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: DashboardSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettingsState(loadSettings());
    setLoaded(true);
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<DashboardSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...updates };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  return { settings, updateSettings, loaded };
}

export const REFRESH_OPTIONS = [
  { value: 60_000, label: "1分" },
  { value: 300_000, label: "5分" },
  { value: 900_000, label: "15分" },
  { value: 0, label: "無効" },
] as const;
