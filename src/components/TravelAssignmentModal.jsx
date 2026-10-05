import { useState } from "react"
import Icon from "./Icon"
import { ui } from "../styles"

const initialForm = { eventKey: "", personnel: [], personnelEmail: "", notes: "" }

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
    personnel: selectedEvent?.personnel || [],
    personnelEmail: selectedEvent?.personnelEmail || "",
    notes: selectedEvent?.assignmentNotes || "",
  }))
  const isEditing = Boolean(selectedEvent?.personnel?.length)
  if (!open) return null
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const changeCalendarEvent = (input) => {
    setForm((current) => ({
      ...current,
      eventKey: input.target.value,
    }))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!form.personnel.length) return
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
      personnel: form.personnel.join(", "),
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
            <fieldset className="col-span-full m-0 min-w-0 border-0 p-0">
              <legend className="mb-2 text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">
                Personnel *
              </legend>
              <input
                className={ui.formControl}
                name="personnel"
                value={form.personnel.join(", ")}
                onChange={(event) => setForm((current) => ({ ...current, personnel: [event.target.value] }))}
                placeholder="Type the assigned personnel name"
                required
              />
            </fieldset>
            <label className="col-span-full grid w-full gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[.05em] text-[#79666a]">Personnel email *</span>
              <input
                className={ui.formControl}
                type="email"
                name="personnelEmail"
                value={form.personnelEmail}
                onChange={change}
                placeholder="name@example.com"
                required
              />
            </label>
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
              disabled={saving || !form.personnel.length || !form.eventKey}
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
