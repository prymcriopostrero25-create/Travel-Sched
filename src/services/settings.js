export const SETTINGS_KEY = "personnel-travel-settings"

export const defaultSettings = {
  notifications: { travelReminders: true, syncAlerts: true, reminderMinutes: 30 },
  preferences: { defaultPage: "Dashboard", compactMode: false, reduceMotion: false },
}

export const normalizeSettings = (saved = {}) => ({
  notifications: {
    travelReminders: typeof saved?.notifications?.travelReminders === "boolean" ? saved.notifications.travelReminders : true,
    syncAlerts: typeof saved?.notifications?.syncAlerts === "boolean" ? saved.notifications.syncAlerts : true,
    reminderMinutes: [10, 30, 60, 1440].includes(saved?.notifications?.reminderMinutes) ? saved.notifications.reminderMinutes : 30,
  },
  preferences: {
    defaultPage: ["Dashboard", "Calendar", "Travel Schedules", "Settings"].includes(saved?.preferences?.defaultPage) ? saved.preferences.defaultPage : "Dashboard",
    compactMode: saved?.preferences?.compactMode === true,
    reduceMotion: saved?.preferences?.reduceMotion === true,
  },
})

export const loadSettings = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}")
    return normalizeSettings(saved)
  } catch {
    return normalizeSettings()
  }
}

export const saveSettings = (settings) => {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
