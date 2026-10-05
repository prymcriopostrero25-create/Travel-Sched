import { useEffect, useState } from "react"
import { Page } from "./TravelSchedules"
import Icon from "../components/Icon"
import { ui } from "../styles"
import { showNotification } from "../services/notifications"

const tabs = [
  { id: "integrations", icon: "sync", label: "Integrations", hint: "Connected services" },
  { id: "notifications", icon: "bell", label: "Notifications", hint: "Reminders & alerts" },
  { id: "preferences", icon: "settings", label: "Preferences", hint: "Workspace behavior" },
]
const tabCopy = {
  integrations: ["Integrations", "Manage the services and data sources connected to your workspace."],
  notifications: ["Notifications", "Decide how and when the system should keep you informed."],
  preferences: ["Workspace Preferences", "Personalize how the travel system looks and behaves for you."],
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full border-0 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#741b3226] ${checked ? "bg-gradient-to-r from-[#741b32] to-[#81243d] shadow-[0_5px_12px_#741b322d]" : "bg-[#e5d9dc]"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-[0_2px_5px_#361e2430] transition-[left] ${checked ? "left-6" : "left-1"}`} /></button>
}

function SettingRow({ icon, tone = "blue", title, description, children }) {
  const tones = { blue: "bg-[#fff2f5] text-[#741b32]", violet: "bg-[#fff2f5] text-[#d57b92]", green: "bg-[#e8f8f2] text-[#15996a]", amber: "bg-[#fff3e3] text-[#c87923]" }
  return <div className="group flex items-center gap-4 rounded-[15px] border border-transparent px-3 py-4 transition hover:border-[#f4eaec] hover:bg-[#fdfafb] max-[560px]:items-start"><span className={`grid size-10 shrink-0 place-items-center rounded-[11px] ${tones[tone]}`}><Icon name={icon} size={17} /></span><div className="min-w-0 flex-1"><h3 className="m-0 font-[Manrope] text-[12px] font-extrabold text-[#412c31]">{title}</h3><p className="mb-0 mt-1 max-w-[540px] text-[10px] leading-relaxed text-[#9c898d]">{description}</p></div><div className="shrink-0 max-[560px]:mt-1">{children}</div></div>
}

function SectionHeading({ eyebrow, title, description }) {
  return <div className="mb-3 px-3 pt-2"><span className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#ce758b]">{eyebrow}</span><h2 className="mb-1 mt-1 font-[Manrope] text-[17px] font-extrabold tracking-[-.02em] text-[#3d252b]">{title}</h2><p className="m-0 text-[10px] leading-relaxed text-[#a28f93]">{description}</p></div>
}

export default function Settings({ calendar, connectCalendar, refreshCalendar, settings, updateSettings, permission, onPermissionChange }) {
  const [activeTab, setActiveTab] = useState("integrations")
  const [message, setMessage] = useState("")
  const notificationSupport = "Notification" in window
  const [requestingPermission, setRequestingPermission] = useState(false)
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(""), 5000)
    return () => window.clearTimeout(timer)
  }, [message])
  const [tabTitle, tabDescription] = tabCopy[activeTab]
  const updateGroup = (group, key, value) => {
    try {
      updateSettings({ ...settings, [group]: { ...settings[group], [key]: value } })
      setMessage("Your preferences have been saved")
    } catch {
      setMessage("Could not save preferences. Allow browser storage and try again.")
    }
  }
  const enableBrowserNotifications = async () => {
    if (!notificationSupport) return setMessage("Browser notifications are not supported here")
    if (permission === "denied") return setMessage("Notifications are blocked. Allow notifications in your browser's site settings, then return to this page.")
    setRequestingPermission(true)
    try {
      const result = await window.Notification.requestPermission()
      onPermissionChange(result)
      setMessage(result === "granted" ? "Browser notifications enabled" : "Notification permission was not granted")
    } catch {
      setMessage("Could not enable notifications in this browser.")
    } finally {
      setRequestingPermission(false)
    }
  }
  const sendTestNotification = () => {
    if (permission !== "granted") return enableBrowserNotifications()
    const delivered = showNotification("Personnel Travel System", { body: "Notifications are working correctly." })
    setMessage(delivered ? "Test notification sent" : "This browser could not display a notification. Check site and operating system notification settings.")
  }
  const enabledOptions = [settings.notifications.travelReminders, settings.notifications.syncAlerts, settings.preferences.compactMode, settings.preferences.reduceMotion].filter(Boolean).length

  return <Page title="System Settings" sub="Configure your workspace, connected services, and alerts">
    <section className="relative mb-5 overflow-hidden rounded-[22px] bg-[#3e1d25] px-6 py-6 text-white shadow-[0_16px_42px_#741b3220] max-[560px]:px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,#dd718c80,transparent_31%),radial-gradient(circle_at_8%_130%,#d67b925c,transparent_33%)]" /><span className="absolute -right-10 -top-20 size-52 rounded-full border-[34px] border-white/[.04]" />
      <div className="relative flex items-center justify-between gap-6 max-[680px]:items-start max-[680px]:flex-col"><div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/10 text-[#ffe3ea] backdrop-blur-sm"><Icon name="settings" size={22} /></span><div><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[#f0b5c4]">Workspace control center</span><h2 className="mb-1 mt-1 font-[Manrope] text-xl font-extrabold tracking-[-.025em]">Everything, configured your way.</h2><p className="m-0 text-[10px] text-[#d9bbc2]">Changes are saved automatically on this device.</p></div></div><div className="flex gap-2.5"><MiniStat label="Calendar" value={calendar.connected ? "Live" : "Offline"} live={calendar.connected} /><MiniStat label="Active rules" value={`${enabledOptions} enabled`} /></div></div>
    </section>

    <div className="grid grid-cols-[238px_minmax(0,1fr)] gap-4 max-[820px]:grid-cols-1">
      <aside className="h-max rounded-[17px] border border-[#f1e7e9] bg-white p-2.5 shadow-[0_8px_28px_#55313a0b] max-[820px]:flex max-[820px]:overflow-x-auto"><p className="mb-2 mt-2 px-3 text-[8px] font-extrabold uppercase tracking-[.15em] text-[#b2a1a5] max-[820px]:hidden">Settings menu</p>{tabs.map((tab) => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => { setActiveTab(tab.id); setMessage("") }} className={`group relative flex w-full items-center gap-3 rounded-[12px] border-0 px-3 py-3 text-left transition max-[820px]:w-auto max-[820px]:min-w-max ${activeTab === tab.id ? "bg-gradient-to-r from-[#fff2f5] to-[#fff6f8] text-[#741b32] shadow-[inset_0_0_0_1px_#fbe5ea]" : "bg-transparent text-[#877177] hover:bg-[#f7f9fc]"}`}><span className={`grid size-8 place-items-center rounded-[9px] ${activeTab === tab.id ? "bg-white shadow-[0_3px_10px_#741b3215]" : "bg-[#f9f4f5]"}`}><Icon name={tab.icon} size={15} /></span><span><strong className="block font-[Manrope] text-[11px] font-bold">{tab.label}</strong><small className="mt-0.5 block text-[8px] font-medium text-[#b09fa3] max-[820px]:hidden">{tab.hint}</small></span></button>)}<div className="mx-2 mt-3 rounded-[12px] bg-[#fcf8f9] p-3 max-[820px]:hidden"><span className="grid size-7 place-items-center rounded-[8px] bg-white text-[#976975] shadow-sm"><Icon name="check" size={14} /></span><strong className="mt-2 block font-[Manrope] text-[10px] text-[#624a50]">Auto-save is on</strong><p className="mb-0 mt-1 text-[8px] leading-relaxed text-[#a69397]">Every change is stored instantly in your browser.</p></div></aside>

      <section className="overflow-hidden rounded-[17px] border border-[#f1e7e9] bg-white shadow-[0_8px_28px_#55313a0b]">
        <header className="flex items-center justify-between gap-4 border-b border-[#f4ecee] bg-gradient-to-r from-[#fdfafb] to-[#fdf8f9] px-6 py-5 max-[560px]:px-4"><div><h1 className="m-0 font-[Manrope] text-[18px] font-extrabold tracking-[-.02em] text-[#3b2429]">{tabTitle}</h1><p className="mb-0 mt-1 text-[10px] text-[#9d898e]">{tabDescription}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[#f3e7ea] bg-white text-[#b5697c] shadow-sm"><Icon name={tabs.find((tab) => tab.id === activeTab).icon} size={16} /></span></header>
        {message && <div role="status" className="mx-6 mt-4 flex items-center gap-2 rounded-[10px] border border-[#ccebdd] bg-[#effaf6] px-3 py-2.5 text-[10px] font-semibold text-[#16845f] max-[560px]:mx-4"><span className="grid size-5 place-items-center rounded-full bg-[#d9f3e9]"><Icon name="check" size={11} /></span>{message}</div>}
        <div className="p-4 max-[560px]:p-2">
          {activeTab === "integrations" && <Integration calendar={calendar} connectCalendar={connectCalendar} refreshCalendar={refreshCalendar} />}
          {activeTab === "notifications" && <><SectionHeading eyebrow="Alert controls" title="Stay ahead of every trip" description="Fine-tune reminders and system alerts so important updates never get missed." /><div className="divide-y divide-[#f5eff1]"><SettingRow icon="bell" title="Travel reminders" description="Show a browser notification before upcoming calendar travel."><Toggle label="Travel reminders" checked={settings.notifications.travelReminders} onChange={(v) => updateGroup("notifications", "travelReminders", v)} /></SettingRow><SettingRow icon="clock" tone="violet" title="Reminder time" description="Choose how early you want to be reminded."><select className={`${ui.formControl} w-[150px] max-[480px]:w-[125px]`} value={settings.notifications.reminderMinutes} onChange={(e) => updateGroup("notifications", "reminderMinutes", Number(e.target.value))}><option value={10}>10 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option></select></SettingRow><SettingRow icon="sync" tone="green" title="Sync alerts" description="Get an alert when calendar synchronization updates are completed."><Toggle label="Sync alerts" checked={settings.notifications.syncAlerts} onChange={(v) => updateGroup("notifications", "syncAlerts", v)} /></SettingRow><SettingRow icon="check" tone="amber" title="Browser permission" description={`Current status: ${permission}. Notifications appear while this application is open.`}><button type="button" className={ui.secondaryButton} disabled={requestingPermission || !notificationSupport} onClick={permission === "granted" ? sendTestNotification : enableBrowserNotifications}>{requestingPermission ? "Please wait" : permission === "granted" ? "Send test" : permission === "denied" ? "How to enable" : "Enable"}</button></SettingRow></div></>}
          {activeTab === "preferences" && <><SectionHeading eyebrow="Personalization" title="Shape your workspace" description="Set the starting view, information density, and motion behavior you prefer." /><div className="divide-y divide-[#f5eff1]"><SettingRow icon="dashboard" title="Default page" description="Choose the page shown the next time the application is opened."><select className={`${ui.formControl} w-[170px] max-[480px]:w-[130px]`} value={settings.preferences.defaultPage} onChange={(e) => updateGroup("preferences", "defaultPage", e.target.value)}><option>Dashboard</option><option>Calendar</option><option>Travel Schedules</option><option>Settings</option></select></SettingRow><SettingRow icon="filter" tone="violet" title="Compact layout" description="Reduce page spacing to fit more information on screen."><Toggle label="Compact layout" checked={settings.preferences.compactMode} onChange={(v) => updateGroup("preferences", "compactMode", v)} /></SettingRow><SettingRow icon="trend" tone="green" title="Reduce motion" description="Minimize interface transitions and animated movement for improved comfort."><Toggle label="Reduce motion" checked={settings.preferences.reduceMotion} onChange={(v) => updateGroup("preferences", "reduceMotion", v)} /></SettingRow></div></>}
        </div>
      </section>
    </div>
  </Page>
}

function MiniStat({ label, value, live }) {
  return <div className="min-w-[92px] rounded-[12px] border border-white/10 bg-white/[.07] px-3.5 py-2.5 backdrop-blur-sm"><span className="block text-[8px] uppercase tracking-[.1em] text-[#d8b6bf]">{label}</span><strong className="mt-1 flex items-center gap-1.5 text-[10px]">{live !== undefined && <i className={`size-1.5 rounded-full ${live ? "bg-[#54d9aa]" : "bg-[#bda5ab]"}`} />}{value}</strong></div>
}

function Integration({ calendar, connectCalendar, refreshCalendar }) {
  const facts = [["Source", import.meta.env.VITE_GOOGLE_CALENDAR_ID || "Primary calendar"], ["Permission", "Read and manage events"], ["Sync status", calendar.connected ? "Ready to sync" : "Connection required"]]
  return <><SectionHeading eyebrow="Connected services" title="Calendar integration" description="Keep official travel schedules synchronized with a trusted calendar source." /><article className="relative overflow-hidden rounded-[16px] border border-[#f2e4e8] bg-gradient-to-br from-white to-[#fff9fb] p-5 max-[560px]:p-4"><span className="absolute -right-12 -top-14 size-36 rounded-full bg-[#f4749408]" /><div className="relative flex items-start gap-4 max-[560px]:flex-wrap"><span className="grid size-12 shrink-0 place-items-center rounded-[13px] border border-[#f0e4e7] bg-white font-[Manrope] text-lg font-extrabold text-[#f47494] shadow-[0_5px_14px_#55313a0d]">G</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 font-[Manrope] text-[13px] font-extrabold text-[#432b31]">Google Calendar</h3><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-bold ${calendar.connected ? "bg-[#e6f8f1] text-[#15996a]" : "bg-[#f5f0f1] text-[#8c797e]"}`}><i className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#32c58d]" : "bg-[#a8999d]"}`} />{calendar.connected ? "Connected" : "Not connected"}</span></div><p className="mb-0 mt-1.5 max-w-[520px] text-[10px] leading-relaxed text-[#9a878b]">View and manage upcoming events from your primary or configured shared calendar. Event changes made here are saved to Google Calendar.</p>{calendar.error && <p className="mb-0 mt-2 text-[9px] font-semibold text-[#b14b4b]">{calendar.error}</p>}</div><button className={calendar.connected ? ui.secondaryButton : ui.primaryButton} onClick={calendar.connected ? () => refreshCalendar() : connectCalendar} disabled={calendar.loading}><Icon name="sync" size={13} />{calendar.loading ? "Please wait…" : calendar.connected ? "Sync now" : "Connect"}</button></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#f5ecee] pt-4 max-[560px]:grid-cols-1">{facts.map(([label, value]) => <div key={label} className="rounded-[10px] bg-white px-3 py-2.5 shadow-[inset_0_0_0_1px_#eee6e8]"><span className="block text-[7px] font-bold uppercase tracking-[.12em] text-[#b2a1a5]">{label}</span><strong className="mt-1 block truncate text-[9px] text-[#6d565c]" title={value}>{value}</strong></div>)}</div></article><div className="mt-4 rounded-[13px] border border-[#f3e9eb] bg-[#fafbfe] px-4 py-3 text-[9px] leading-relaxed text-[#988589]"><strong className="text-[#6a5157]">Privacy first.</strong> The system only requests the calendar data required to display and coordinate official travel schedules.</div></>
}
