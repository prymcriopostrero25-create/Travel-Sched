// Check the current domain, which moves to the latest deployment when it goes live.
export function startDeploymentReload(baseUrl, currentBuildId) {
  let checking = false
  let reloading = false
  const check = async () => {
    if (checking || reloading || document.visibilityState === "hidden" || !navigator.onLine) return
    checking = true
    try {
      const response = await fetch(`${baseUrl}version.json?t=${Date.now()}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) return
      const version = await response.json()
      if (typeof version.buildId === "string" && version.buildId && version.buildId !== currentBuildId) {
        reloading = true
        window.location.reload()
      }
    } catch {
      // Offline, deployment in progress, or unavailable version file: retry later.
    } finally {
      checking = false
    }
  }
  const interval = window.setInterval(check, 60000)
  document.addEventListener("visibilitychange", check)
  window.addEventListener("focus", check)
  window.addEventListener("online", check)
  void check()
  return () => {
    window.clearInterval(interval)
    document.removeEventListener("visibilitychange", check)
    window.removeEventListener("focus", check)
    window.removeEventListener("online", check)
  }
}
