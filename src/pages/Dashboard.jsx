import { useEffect, useMemo, useState } from "react"
import Icon from "../components/Icon"
import { ui } from "../styles"

const eventTime = (event) => {
  if (event.allDay) return "All day"
  const start = event.start?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const end = event.end?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  return [start, end].filter(Boolean).join(" – ")
}

const eventTiming = (event, now) => {
  if (event.allDay || (event.start <= now && (!event.end || event.end >= now))) {
    return { label: "Happening now", className: "bg-[#e7f8f1] text-[#15996a]" }
  }
  if (event.start > now) {
    return { label: "Later today", className: "bg-[#f8edf0] text-[#741b32]" }
  }
  return { label: "Ended", className: "bg-[#f3eff0] text-[#938286]" }
}

const webLink = (value) => {
  const location = String(value || "").trim()
  if (!/^https?:\/\//i.test(location)) return ""
  try {
    return new URL(location).href
  } catch {
    return ""
  }
}

export default function Dashboard({
  calendar,
  openTravelModal,
  refreshCalendar,
}) {
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const selectedEventLink = webLink(selectedEvent?.location)
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])
  useEffect(() => {
    if (!selectedEvent) return undefined
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return
      setSelectedEvent(null)
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [selectedEvent])

  const todaysEvents = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return calendar.events
      .filter(
        (event) =>
          event.start &&
          event.start < startOfTomorrow &&
          (event.end ? event.end > startOfToday : event.start >= startOfToday),
      )
      .sort((first, second) => first.start - second.start)
  }, [calendar.events, now])

  const upcomingDays = useMemo(() => Array.from({ length: 3 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index + 1)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index + 2)
    const events = calendar.events.filter((event) => {
      if (!event.start || event.start >= end) return false
      // Calendar end times are exclusive, including all-day events.
      return event.end ? event.end > start : event.start >= start
    }).sort((first, second) => first.start - second.start)
    return { start, events }
  }), [calendar.events, now])

  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good Afternoon" : "Good Evening"

  return (
    <div className="dashboard dashboard-refresh">
      <header className="dashboard-heading flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 mt-0 text-[10px] font-bold uppercase tracking-[.18em] text-[#93445a]">Office of the President</p>
          <h1 className="m-0 font-[Manrope] text-[28px] font-extrabold tracking-[-.04em] text-[#351923]">Travel Overview</h1>
        </div>
        <span className="rounded-full border border-[#e9dde1] bg-white px-4 py-2 text-[11px] font-semibold text-[#795c66]">
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </header>
      <section className="dashboard-welcome relative isolate overflow-hidden rounded-[24px] bg-gradient-to-r from-[#3c0d19] to-[#81243d] px-7 py-7 text-white shadow-[0_18px_45px_#741b3222] max-[640px]:px-5 max-[640px]:py-6">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,#3c0d19,#81243d)]" />
        <div className="absolute -right-16 -top-24 -z-10 size-72 rounded-full border-[42px] border-white/[.035]" />
        <div className="flex items-start justify-between gap-6 max-[760px]:flex-col">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#f4c5d2] backdrop-blur-sm">
              <i
                className={`size-1.5 rounded-full ${calendar.connected ? "bg-[#54d9aa] shadow-[0_0_0_4px_#54d9aa20]" : "bg-[#b7a3a8]"}`}
              />
              {calendar.loading
                ? "Synchronizing calendar"
                : calendar.connected
                  ? "Calendar live"
                  : "Calendar offline"}
            </div>
            <p className="m-0 text-xs font-medium text-[#e7b9c6]">{greeting}, OP Personnel</p>
            <h2 className="mb-3 mt-2 max-w-[620px] font-[Manrope] text-[36px] font-extrabold leading-tight tracking-[-.04em] max-[520px]:text-[27px]">
              Your travels, at a glance.
            </h2>
            <p className="m-0 max-w-[580px] text-[12px] leading-relaxed text-[#ecc8d2]">
              A real-time view of personnel assignments, schedules, and travel coverage.
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] border border-white/15 bg-white px-4 py-3 text-[11px] font-bold text-[#590f23] shadow-[0_10px_28px_#240f1445] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={openTravelModal}
            disabled={!calendar.connected}
          >
            <Icon name="plus" size={17} /> Assign Personnel
          </button>
        </div>
        <div className="mt-7 flex items-center gap-4 border-t border-white/10 pt-4 text-[12px] text-[#dfacba] max-[520px]:flex-wrap">
          <span className="font-semibold text-white">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span>{calendar.events.length} events synchronized</span>
          {calendar.lastSync && (
            <span>
              Updated{" "}
              {calendar.lastSync.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </section>
      {calendar.error && (
        <div className={`${ui.error} dashboard-error`}>
          <span>{calendar.error}</span>
          <button
            className={`${ui.textButton} whitespace-nowrap text-[#a74343]`}
            onClick={() => refreshCalendar()}
          >
            Try again
          </button>
        </div>
      )}
      <section className={`${ui.panel} dashboard-today overflow-hidden`} aria-labelledby="happening-now-title">
        <div className="flex items-center justify-between gap-4 border-b border-[#f5eff1] px-5 py-4">
          <div>
            <h2
              id="happening-now-title"
              className="m-0 font-[Manrope] text-base font-extrabold text-[#2f1c21]"
            >
              Happening now
            </h2>
            <p className="mb-0 mt-1 text-[11px] text-[#958286]">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="rounded-full bg-[#faf2f4] px-3 py-1.5 text-[10px] font-bold text-[#81243d]">
            {todaysEvents.length} event{todaysEvents.length === 1 ? "" : "s"} today
          </span>
        </div>
        {todaysEvents.length ? (
          <div className="grid grid-cols-1 gap-3 p-5">
            {todaysEvents.map((event, index) => {
              const timing = eventTiming(event, now)
              return (
                <button
                  key={`${event.id}-${event.start?.toISOString()}-${index}`}
                  className="flex min-w-0 items-start gap-3 rounded-[11px] border border-[#eee6e8] bg-[#fdfafb] p-4 text-left transition hover:border-[#d8a9b6] hover:bg-white hover:shadow-[0_5px_16px_#55313a0d]"
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f8edf0] text-[#741b32]">
                    <Icon name="clock" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate font-[Manrope] text-[15px] text-[#38252a]">
                        {event.title}
                      </strong>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${timing.className}`}
                      >
                        {timing.label}
                      </span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#8e7b7f]">
                      <span>{eventTime(event)}</span>
                      <span className="min-w-0 break-words">
                        {webLink(event.location)
                          ? "Online meeting"
                          : event.location || "Location not specified"}
                      </span>
                    </span>
                    <span className="mt-2 block truncate text-[12px] font-medium text-[#695157]">
                      {event.personnel?.length
                        ? event.personnel.join(", ")
                        : "No personnel assigned"}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-6 text-[11px] text-[#958286]">
            <span className="grid size-9 place-items-center rounded-full bg-[#faf4f6] text-[#a59297]">
              <Icon name="calendar" size={17} />
            </span>
            {calendar.loading
              ? "Checking today's calendar…"
              : "There are no events scheduled for today."}
          </div>
        )}
      </section>
      <section className={`${ui.panel} dashboard-upcoming overflow-hidden`} aria-labelledby="upcoming-events-title">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6e8] px-5 py-4">
          <div>
            <h2 id="upcoming-events-title" className="m-0 font-[Manrope] text-base font-extrabold text-[#351923]">Upcoming Events</h2>
            <p className="mb-0 mt-1 text-[11px] text-[#806c75]">The next three days</p>
          </div>
          <span className="rounded-full bg-[#faf2f4] px-3 py-1.5 text-[10px] font-bold text-[#81243d]">
            {upcomingDays[0].start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {upcomingDays[2].start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </header>
        <div className="grid grid-cols-3 gap-5 p-5 max-[1000px]:grid-cols-1">
          {upcomingDays.map(({ start, events }) => (
            <section key={start.toISOString()} className="min-w-0">
              <h3 className="mb-3 mt-0 border-b border-[#eee6e8] pb-3 text-[12px] font-bold text-[#741b32]">
                {start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h3>
              <div className="space-y-3">
                {events.length ? events.map((event, index) => (
                  <button key={`${event.id}-${index}`} type="button" onClick={() => setSelectedEvent(event)}
                    className="block w-full rounded-[12px] border border-[#eee6e8] bg-[#fdfafb] p-4 text-left transition hover:border-[#d8a9b6] hover:bg-[#faf2f4]">
                    <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#93445a]"><Icon name="clock" size={13} />{eventTime(event)}</span>
                    <strong className="block break-words font-[Manrope] text-[14px] text-[#351923]">{event.title}</strong>
                    <span className="mt-2 block break-words text-[11px] text-[#806c75]">{webLink(event.location) ? "Online meeting" : event.location || "Location not specified"}</span>
                    <span className="mt-2 block break-words text-[11px] text-[#806c75]">{event.personnel?.length ? event.personnel.join(", ") : "No personnel assigned"}</span>
                  </button>
                )) : <p className="m-0 rounded-[12px] bg-[#fdfafb] p-4 text-[11px] text-[#806c75]">{calendar.loading ? "Checking calendar?" : "No events scheduled."}</p>}
              </div>
            </section>
          ))}
        </div>
      </section>
      {selectedEvent && (
        <div
          className={ui.backdrop}
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}
        >
          <section
            className="max-h-[90vh] w-[min(620px,100%)] overflow-y-auto rounded-[22px] bg-white shadow-[0_28px_90px_#240f1470]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="today-event-details-title"
          >
            <header className="relative overflow-hidden bg-gradient-to-br from-[#3c0d19] via-[#591326] to-[#81243d] px-7 pb-8 pt-6 text-white">
              <span className="absolute -right-12 -top-16 size-48 rounded-full border-[28px] border-white/5" />
              <span className="absolute -bottom-20 right-20 size-40 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] backdrop-blur-sm">
                  <Icon name="calendar" size={13} /> Event details
                </span>
                <button
                  className="grid size-9 place-items-center rounded-full border-0 bg-white/10 text-white transition hover:bg-white/20"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close event details"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="relative mt-7">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${eventTiming(selectedEvent, now).className}`}
                >
                  {eventTiming(selectedEvent, now).label}
                </span>
                <h3
                  id="today-event-details-title"
                  className="mb-0 mt-3 max-w-[480px] font-[Manrope] text-[25px] font-extrabold leading-tight tracking-[-.025em]"
                >
                  {selectedEvent.title}
                </h3>
                <p className="mb-0 mt-2 text-[11px] text-[#ffe5ec]">
                  {selectedEvent.status || "Calendar event"}
                </p>
              </div>
            </header>
            <div className="p-7 max-[520px]:p-5">
              <div className="grid min-w-0 grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                <div className="min-w-0 overflow-hidden rounded-[14px] border border-[#eee4e7] bg-[#fdfafb] p-4">
                  <span className="mb-3 grid size-8 place-items-center rounded-[9px] bg-[#f8edf0] text-[#741b32]">
                    <Icon name="clock" size={16} />
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#a59296]">
                    Date &amp; time
                  </span>
                  <strong className="mt-1.5 block font-[Manrope] text-xs text-[#402b31]">
                    {selectedEvent.start?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                  <span className="mt-1 block text-[11px] text-[#867076]">
                    {eventTime(selectedEvent)}
                  </span>
                </div>
                <div className="min-w-0 overflow-hidden rounded-[14px] border border-[#eee4e7] bg-[#fdfafb] p-4">
                  <span className="mb-3 grid size-8 place-items-center rounded-[9px] bg-[#fff0f4] text-[#d47d93]">
                    <Icon name="location" size={16} />
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#a59296]">
                    Location
                  </span>
                  <strong className="mt-1.5 block break-words font-[Manrope] text-xs leading-relaxed text-[#402b31]">
                    {selectedEventLink
                      ? "Online meeting"
                      : selectedEvent.location || "Location not specified"}
                  </strong>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="m-0 flex items-center gap-2 font-[Manrope] text-sm font-extrabold text-[#412c31]">
                    <Icon name="users" size={17} /> Assigned Personnel
                  </h4>
                  <span className="rounded-full bg-[#f8f2f4] px-2.5 py-1 text-[9px] font-bold text-[#856f74]">
                    {selectedEvent.personnel?.length || 0}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 rounded-[14px] border border-[#f2ebed] bg-[#fafbfd] p-4">
                  {selectedEvent.personnel?.length ? (
                    selectedEvent.personnel.map((person) => (
                      <span
                        key={person}
                        className="inline-flex items-center gap-2 rounded-full border border-[#f2e2e6] bg-white py-1.5 pl-1.5 pr-3 text-[10px] font-semibold text-[#62484e] shadow-sm"
                      >
                        <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[#81243d] to-[#a54b63] text-[8px] font-bold text-white">
                          {person
                            .split(/\s+/)
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        {person}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#968387]">
                      No personnel assigned to this event.
                    </span>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mt-6">
                  <h4 className="mb-3 mt-0 font-[Manrope] text-sm font-extrabold text-[#412c31]">
                    Notes
                  </h4>
                  <div className="whitespace-pre-wrap rounded-[14px] border-l-4 border-[#81243d] bg-[#fbf7f8] px-4 py-3 text-[11px] leading-relaxed text-[#756166]">
                    {selectedEvent.description.replace(/^Notes:\s*/i, "")}
                  </div>
                </div>
              )}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-[#f5eff1] bg-[#fbfcfe] px-7 py-4 max-[520px]:flex-col max-[520px]:items-stretch max-[520px]:px-5">
              <span className="text-[9px] text-[#a59296]">Synchronized from Google Calendar</span>
              <div className="flex shrink-0 gap-2 max-[520px]:flex-wrap [&>*]:max-[520px]:flex-1">
                {selectedEventLink && (
                  <a
                    className={ui.primaryButton}
                    href={selectedEventLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open meeting link
                  </a>
                )}
                <button
                  className={`${ui.secondaryButton} min-w-[86px]`}
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
