import { useState } from "react"
import Icon from "./Icon"
import { ui } from "../styles"

const personnelEntriesFor = (event) => {
  const names = event?.personnel || []
  const emails = String(event?.personnelEmail || "").split(",").map((email) => email.trim())
  return Array.from({ length: Math.max(names.length, emails.filter(Boolean).length, 1) }, (_, index) => ({
    name: names[index] || "",
    email: emails[index] || "",
  }))
}
const initialForm = { eventKey: "", personnelEntries: personnelEntriesFor(null), notes: "" }

export default function TravelAssignmentModal({
  open,
  onClose,
  onSubmit,
  saving,
  error,
  events = [],
  selectedEvent,
}) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    eventKey: selectedEvent ? `${selectedEvent.id}::${selectedEvent.start?.toISOString()}` : "",
    personnelEntries: personnelEntriesFor(selectedEvent),
    notes: selectedEvent?.assignmentNotes || "",
  }))
  const isEditing = Boolean(selectedEvent?.personnel?.length)
  if (!open) return null
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const changeCalendarEvent = (input) => {
    const selected = events.find((event) => `${event.id}::${event.start?.toISOString()}` === input.target.value)
    setForm((current) => ({
      ...current,
      eventKey: input.target.value,
      personnelEntries: personnelEntriesFor(selected),
      notes: selected?.assignmentNotes || "",
    }))
  }
  const changePersonnel = (index, field, value) => setForm((current) => ({
    ...current,
    personnelEntries: current.personnelEntries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
  }))
  const submit = async (event) => {
    event.preventDefault()
    if (saving || form.personnelEntries.some((entry) => !entry.name.trim())) return
    const [eventId, eventStart] = form.eventKey.split("::")
    const selected = events.find(
      (calendarEvent) =>
        calendarEvent.id === eventId && calendarEvent.start?.toISOString() === eventStart,
    )
    if (!selected) return
    const success = await onSubmit({
      ...form,
      eventId,
      eventStart,
      personnel: form.personnelEntries.map((entry) => entry.name.trim()).join(", "),
      personnelEmail: [...new Set(form.personnelEntries.map((entry) => entry.email.trim()).filter(Boolean))].join(", "),
    })
    if (success) {
      setForm(initialForm)
      onClose()
    }
  }
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#221115a8] p-5 backdrop-blur-[4px] max-[520px]:p-2"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[calc(100vh-40px)] w-[min(780px,100%)] overflow-auto rounded-[18px] bg-white shadow-[0_28px_80px_#240f1455] max-[520px]:max-h-[calc(100dvh-16px)] max-[520px]:rounded-[14px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-modal-title"
      >
        <header className="flex justify-between gap-5 border-b border-[#eae2e4] px-[25px] pb-[19px] pt-[23px] max-[520px]:gap-3 max-[520px]:px-4 max-[520px]:py-4">
          <div>
            <span className={ui.pill}>GOOGLE CALENDAR</span>
            <h2 className="mb-1 mt-[5px] font-[Manrope] text-xl font-extrabold max-[520px]:text-lg" id="travel-modal-title">
              {isEditing ? "Change Travel Assignment" : "New Travel Assignment"}
            </h2>
            <p className="m-0 text-[10px] text-[#98868a]">Select a Calendar event, then assign the personnel who will attend.</p>
          </div>
          <button className={ui.iconButton} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <form className="px-[25px] py-[22px] max-[520px]:px-4 max-[520px]:py-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-[15px] max-[520px]:grid-cols-1">
            <label className="col-span-full grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Google Calendar Event *</span>
              <select className={ui.formControl} name="eventKey" value={form.eventKey} onChange={changeCalendarEvent} required>
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option
                    key={`${event.id}-${event.start?.toISOString()}`}
                    value={`${event.id}::${event.start?.toISOString()}`}
                  >
                    {event.start?.toLocaleString(
                      "en-PH",
                      event.allDay
                        ? { dateStyle: "medium" }
                        : { dateStyle: "medium", timeStyle: "short" },
                    )}{" "}
                    — {event.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="col-span-full flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Assigned personnel</span>
              <button type="button" disabled={saving} className={`${ui.secondaryButton} flex items-center gap-1.5`} onClick={() => setForm((current) => ({ ...current, personnelEntries: [...current.personnelEntries, { name: "", email: "" }] }))} aria-label="Add another personnel">
                <Icon name="plus" size={15} /> Add personnel
              </button>
            </div>
            {form.personnelEntries.map((entry, index) => (
            <div key={index} className="col-span-full grid gap-3 rounded-[10px] border border-[#eee6e8] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#741b32]">Personnel {index + 1}</span>
                {index > 0 && <button type="button" disabled={saving} className={ui.textButton} aria-label={`Remove personnel ${index + 1}`} onClick={() => setForm((current) => ({ ...current, personnelEntries: current.personnelEntries.filter((_, entryIndex) => entryIndex !== index) }))}><Icon name="close" size={15} /></button>}
              </div>
              <label className="grid gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Personnel *</span>
              <input
                className={ui.formControl}
                name={`personnel-${index}`}
                value={entry.name}
                onChange={(event) => changePersonnel(index, "name", event.target.value)}
                placeholder="Type the assigned personnel name"
                required
              />
              </label>
            <label className="grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Personnel email</span>
              <input
                className={ui.formControl}
                type="email"
                name={`personnelEmail-${index}`}
                value={entry.email}
                onChange={(event) => changePersonnel(index, "email", event.target.value)}
                placeholder="name@example.com"
              />
            </label>
            </div>
            ))}
            <label className="col-span-full grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Notes</span>
              <textarea className={`${ui.formControl} resize-y`} name="notes" value={form.notes} onChange={change} rows="3" />
            </label>
          </div>
          {error && <div className={`${ui.error} mb-0 mt-4`}>{error}</div>}
          <footer className="flex justify-end gap-[9px] pt-5 max-[520px]:flex-col-reverse max-[520px]:[&>button]:w-full">
            <button type="button" className={ui.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button
              className={ui.primaryButton}
              disabled={saving || form.personnelEntries.some((entry) => !entry.name.trim()) || !form.eventKey}
            >
              <Icon name="calendar" size={17} />
              {saving
                ? "Saving assignment…"
                : isEditing
                  ? "Save changes"
                  : "Assign to Calendar event"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
