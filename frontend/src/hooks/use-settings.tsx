import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface AppSettings {
  shadowsEnabled: boolean
  speechSpeed: "normal" | "slow"
  dailyCardGoal: number
  soundEffects: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  shadowsEnabled: true,
  speechSpeed: "normal",
  dailyCardGoal: 7,
  soundEffects: true,
}

const SETTINGS_STORAGE_KEY = "duichinese_settings_v1"

interface SettingsContextType {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
  initialSettings?: Partial<AppSettings>
}

export function SettingsProvider({ children, initialSettings }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    let stored: Partial<AppSettings> = {}
    try {
      const item = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (item) {
        stored = JSON.parse(item)
      }
    } catch {
      // Ignore parse or access errors
    }
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      ...initialSettings,
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore write errors
    }
  }, [settings])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
