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

const isHappeningNow = (event, now) => {
  if (!event.start || event.start > now) return false
  const end = event.end || new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate() + 1)
  return now < end
}

const eventTiming = (event, now) => {
  if (isHappeningNow(event, now)) {
    return { label: "Happening now", className: "bg-[#e7f8f1] text-[#15996a]" }
  }
  if (event.start > now) {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return { label: event.start < tomorrow ? "Today" : "Upcoming", className: "bg-[#f8edf0] text-[#741b32]" }
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
  refreshCalendar,
}) {
  const [now, setNow] = useState(() => new Date())
  const [boardPage, setBoardPage] = useState(0)
  const [boardSize, setBoardSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setBoardSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener("resize", resize)
    const rotation = window.setInterval(() => setBoardPage((page) => page + 1), 12000)
    return () => {
      window.removeEventListener("resize", resize)
      window.clearInterval(rotation)
    }
  }, [])
  const fitBoard = boardSize.width > 1000
  const dayCapacity = boardSize.height < 800 ? 1 : 2
  const pageEvents = (events, capacity) => {
    if (!fitBoard) return events
    const offset = (boardPage % Math.max(1, Math.ceil(events.length / capacity))) * capacity
    return events.slice(offset, offset + capacity)
  }
  const pageLabel = (events, capacity) => events.length > capacity && fitBoard
    ? `Page ${boardPage % Math.ceil(events.length / capacity) + 1} of ${Math.ceil(events.length / capacity)} - rotates automatically`
    : ""
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

  const currentEvents = useMemo(() => calendar.events
    .filter((event) => isHappeningNow(event, now))
    .sort((first, second) => first.start - second.start), [calendar.events, now])

  const todaysEvents = useMemo(() => {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const laterToday = calendar.events
      .filter((event) => event.start > now && event.start < tomorrow)
      .sort((first, second) => first.start - second.start)
    return [...currentEvents, ...laterToday]
  }, [calendar.events, currentEvents, now])

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

  return (
    <div className="dashboard dashboard-refresh">
      <header className="dashboard-heading flex items-center justify-between gap-4">
        <div className="board-brand">
          <img src="/JHCSC_Office_of_the_President_Logo.png" alt="Office of the President" />
          <div>
          <p className="mb-1 mt-0 text-[10px] font-bold uppercase tracking-[.18em] text-[#93445a]">Office of the President</p>
          <h1 className="m-0 font-[Manrope] text-[28px] font-extrabold tracking-[-.04em] text-[#351923]">Live Schedule</h1>
          </div>
        </div>
        <div className="dashboard-clock text-right">
          <strong className="block font-[Manrope] text-[32px] text-[#741b32]">
            {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </strong>
          <span>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
          <span className={`board-connection ${calendar.connected ? "is-connected" : ""}`} role="status">
            {calendar.loading ? "Synchronizing" : calendar.connected ? "Calendar live" : "Calendar offline"}
          </span>
        </div>
      </header>
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
        <div className="board-live-heading">
          <div>
            <span className="board-eyebrow">LIVE SCHEDULE</span>
            <h2
              id="happening-now-title"
              className="m-0 font-[Manrope] text-base font-extrabold text-[#2f1c21]"
            >
              Happening now
            </h2>
            <p className="mb-0 mt-1 text-[11px] text-[#958286]">
              Live activities and the rest of today's schedule {pageLabel(todaysEvents, 2) && <span className="board-rotation">{pageLabel(todaysEvents, 2)}</span>}
            </p>
          </div>
          <span className="board-live-count">
            <i /> {currentEvents.length} event{currentEvents.length === 1 ? "" : "s"} live
          </span>
        </div>
        {todaysEvents.length ? (
          <div className="dashboard-live-list grid grid-cols-1 gap-3 p-5">
            {pageEvents(todaysEvents, 2).map((event, index) => {
              const timing = eventTiming(event, now)
              return (
                <button
                  key={`${event.id}-${event.start?.toISOString()}-${index}`}
                  className={`${isHappeningNow(event, now) ? "board-event-live" : "board-event-later"} flex min-w-0 items-start gap-3 rounded-[11px] border border-[#eee6e8] bg-[#fdfafb] p-4 text-left transition hover:border-[#d8a9b6] hover:bg-white hover:shadow-[0_5px_16px_#55313a0d]`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#f8edf0] text-[#741b32]">
                    <Icon name="clock" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="break-words font-[Manrope] text-[15px] text-[#38252a]">
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
                    <span className="mt-2 block break-words text-[12px] font-medium text-[#695157]">
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
          <div className="board-live-empty">
            <span className="board-empty-icon"><Icon name="calendar" size={25} /></span>
            <div>
              <strong>{calendar.loading ? "Checking live activities..." : "No more activities scheduled today"}</strong>
              <p>{!calendar.connected ? "Connect the calendar to see the latest schedule." : "Upcoming activities are listed below. This board updates automatically."}</p>
            </div>
          </div>
        )}
      </section>
      <section className={`${ui.panel} dashboard-upcoming overflow-hidden`} aria-labelledby="upcoming-events-title">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6e8] px-5 py-4">
          <div>
            <h2 id="upcoming-events-title" className="m-0 font-[Manrope] text-base font-extrabold text-[#351923]">Upcoming Events</h2>
            <p className="mb-0 mt-1 text-[11px] text-[#806c75]">The next three days, starting tomorrow</p>
          </div>
          <span className="rounded-full bg-[#faf2f4] px-3 py-1.5 text-[10px] font-bold text-[#81243d]">
            {upcomingDays[0].start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {upcomingDays[2].start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </header>
        <div className="dashboard-days grid grid-cols-3 gap-5 p-5 max-[1000px]:grid-cols-1">
          {upcomingDays.map(({ start, events }) => (
            <section key={start.toISOString()} className="min-w-0">
              <div className="board-day-heading">
                <span className="board-day-number">{start.getDate()}</span>
                <div>
                  <span className="board-day-label">{start.toLocaleDateString("en-US", { weekday: "long" })}</span>
                  <h3>{start.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
                </div>
                <span className="board-day-count">{events.length} event{events.length === 1 ? "" : "s"}</span>
              </div>
              <div className="board-day-events space-y-3">
                {events.length ? pageEvents(events, dayCapacity).map((event, index) => (
                  <button key={`${event.id}-${index}`} type="button" onClick={() => setSelectedEvent(event)}
                    className="block w-full rounded-[12px] border border-[#eee6e8] bg-[#fdfafb] p-4 text-left transition hover:border-[#d8a9b6] hover:bg-[#faf2f4]">
                    <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#93445a]"><Icon name="clock" size={13} />{eventTime(event)}</span>
                    <strong className="block break-words font-[Manrope] text-[14px] text-[#351923]">{event.title}</strong>
                    <span className="mt-2 block break-words text-[11px] text-[#806c75]">{webLink(event.location) ? "Online meeting" : event.location || "Location not specified"}</span>
                    <span className="mt-2 block break-words text-[11px] text-[#806c75]">{event.personnel?.length ? event.personnel.join(", ") : "No personnel assigned"}</span>
                  </button>
                )) : <p className="m-0 rounded-[12px] bg-[#fdfafb] p-4 text-[11px] text-[#806c75]">{calendar.loading ? "Checking calendar..." : "No events scheduled."}</p>}
              </div>
              {pageLabel(events, dayCapacity) && <p className="board-rotation">{pageLabel(events, dayCapacity)}</p>}
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
