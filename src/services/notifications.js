export const notificationPermission = () =>
  "Notification" in window ? window.Notification.permission : "unsupported"

export const showNotification = (title, options) => {
  if (notificationPermission() !== "granted") return false
  try {
    new window.Notification(title, options)
    return true
  } catch {
    return false
  }
}
