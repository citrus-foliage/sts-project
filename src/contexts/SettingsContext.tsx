"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type UserSettings = {
  display_name?: string;
  notify_task_reminders?: boolean;
  notify_budget_alerts?: boolean;
  notify_daily_budget?: boolean;
  notify_forum_replies?: boolean;
  forum_default_anonymous?: boolean;
  forum_show_display_name?: boolean;
  show_tasks?: boolean;
  show_budget?: boolean;
  show_survival?: boolean;
  show_schedule?: boolean;
  show_timer?: boolean;
  show_forum?: boolean;
  show_resources?: boolean;
  [key: string]: unknown;
};

type SettingsContextValue = {
  settings: UserSettings;
  loading: boolean;
  refetch: () => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initial load — happens once per session, here in the provider,
    // instead of once per page that needs feature settings.
    loadSettings();

    // Re-fetch as soon as the Settings page saves changes in this tab
    window.addEventListener("settings-updated", loadSettings);

    // Re-fetch when the user comes back to this tab (covers changes made
    // in another tab, or the settings-updated listener being missed)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadSettings();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", loadSettings);

    return () => {
      window.removeEventListener("settings-updated", loadSettings);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", loadSettings);
    };
  }, [loadSettings]);

  return (
    <SettingsContext.Provider
      value={{ settings, loading, refetch: loadSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
