export const GOOGLE_EVENT_COLORS = [
  { id: "1", name: "Lavender", background: "#bb8492", foreground: "#ffffff" },
  { id: "2", name: "Sage", background: "#33b679", foreground: "#ffffff" },
  { id: "3", name: "Grape", background: "#8e24aa", foreground: "#ffffff" },
  { id: "4", name: "Flamingo", background: "#e67c73", foreground: "#1f1f1f" },
  { id: "5", name: "Banana", background: "#f6bf26", foreground: "#1f1f1f" },
  { id: "6", name: "Tangerine", background: "#f4511e", foreground: "#ffffff" },
  { id: "7", name: "Peacock", background: "#e5426b", foreground: "#ffffff" },
  { id: "8", name: "Graphite", background: "#616161", foreground: "#ffffff" },
  { id: "9", name: "Blueberry", background: "#a7586c", foreground: "#ffffff" },
  { id: "10", name: "Basil", background: "#0b8043", foreground: "#ffffff" },
  { id: "11", name: "Tomato", background: "#d50000", foreground: "#ffffff" },
]

export const displayEventColor = (event) =>
  GOOGLE_EVENT_COLORS.find((color) => color.id === String(event.colorId)) || event.color
