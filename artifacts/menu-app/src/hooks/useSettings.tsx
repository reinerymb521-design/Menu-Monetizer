import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type Language = "es" | "en";
export type FontSize = "sm" | "md" | "lg";

export interface Settings {
  // Apariencia
  theme: ThemeMode;
  fontSize: FontSize;
  // Idioma
  language: Language;
  // Notificaciones
  notifPush: boolean;
  notifEmail: boolean;
  notifFollows: boolean;
  notifComments: boolean;
  notifNewBooks: boolean;
  // Privacidad
  publicProfile: boolean;
  showEmail: boolean;
  searchable: boolean;
  // Reproducción
  autoplay: boolean;
  defaultSpeed: number; // 0.5 - 2.0
  audioQuality: "low" | "medium" | "high";
  // Datos
  downloadOnlyWifi: boolean;
  autoDownload: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  fontSize: "md",
  language: "es",
  notifPush: true,
  notifEmail: true,
  notifFollows: true,
  notifComments: true,
  notifNewBooks: false,
  publicProfile: true,
  showEmail: false,
  searchable: true,
  autoplay: false,
  defaultSpeed: 1.0,
  audioQuality: "high",
  downloadOnlyWifi: true,
  autoDownload: false,
};

const STORAGE_KEY = "audiverse_settings_v1";

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  resetSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}

    // Apply theme
    const root = document.documentElement;
    const isLight =
      settings.theme === "light" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: light)").matches);
    root.classList.toggle("light", isLight);

    // Apply font-size class for body
    document.body.dataset.fontSize = settings.fontSize;
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
