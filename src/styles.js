export const ui = {
  panel: "rounded-[14px] border border-[#eae2e4] bg-white shadow-[0_2px_8px_#55313a08]",
  iconButton: "grid place-items-center rounded-[10px] border-0 bg-transparent p-2 text-inherit",
  primaryButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border-0 bg-gradient-to-br from-[#741b32] to-[#81243d] px-4 py-[11px] text-[11px] font-semibold text-white shadow-[0_7px_18px_#741b322b] transition hover:-translate-y-px hover:shadow-[0_9px_22px_#741b323b] disabled:cursor-wait disabled:opacity-65",
  secondaryButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#eae2e4] bg-white px-[14px] py-[10px] text-[11px] font-semibold text-[#675459] disabled:cursor-wait disabled:opacity-65",
  textButton: "inline-flex items-center justify-center gap-2 rounded-[9px] border-0 bg-transparent text-[11px] font-semibold text-[#741b32]",
  pageHeading: "mb-6 flex items-end justify-between max-[520px]:block",
  pill: "text-[9px] font-bold tracking-[.16em] text-[#81243d]",
  pageTitle: "my-1.5 font-[Manrope] text-[26px] font-extrabold tracking-[-.035em] text-[#341d23] max-[520px]:text-[23px]",
  pageSubtitle: "m-0 text-xs text-[#89767b]",
  toolbar: "mb-4 flex gap-2.5 max-[760px]:flex-wrap",
  search: "flex h-[38px] min-w-[260px] items-center gap-2 rounded-[9px] border border-[#eae2e4] bg-white px-3 text-[#a49398] max-[760px]:min-w-full [&_input]:w-full [&_input]:border-0 [&_input]:text-[11px] [&_input]:outline-0",
  error: "mb-[14px] flex items-center justify-between gap-3 rounded-[9px] border border-[#f1c8c8] bg-[#fff0f0] px-[14px] py-[11px] text-[11px] text-[#a74343]",
  backdrop: "fixed inset-0 z-[110] grid place-items-center bg-[#2211156b] p-5 backdrop-blur-[2px] max-[520px]:p-2",
  status: "inline-flex items-center rounded-[10px] px-[7px] py-1 text-[8px] font-semibold",
  formControl: "w-full rounded-[9px] border border-[#e8dde1] bg-[#fbfcfe] px-[11px] py-[10px] text-[11px] text-[#443237] outline-none focus:border-[#a54b63] focus:shadow-[0_0_0_3px_#741b3214]",
}

export const statusClass = (status) => {
  const variants = {
    "happening now": "bg-[#fff0f0] text-[#c14646] [&_i]:bg-[#ef6363]",
    upcoming: "bg-[#f8edf0] text-[#741b32] [&_i]:bg-[#a54b63]",
    confirmed: "bg-[#e7f8f1] text-[#15996a] [&_i]:bg-[#37c992]",
    accomplished: "bg-[#f8f1f3] text-[#8a7278] [&_i]:bg-[#a39498]",
    pending: "bg-[#fff3e2] text-[#bf7824] [&_i]:bg-[#e49a3f]",
    draft: "bg-[#f3eff0] text-[#87757a] [&_i]:bg-[#a39498]",
  }
  return `${ui.status} ${variants[status] || variants.draft} [&_i]:mr-[5px] [&_i]:inline-block [&_i]:size-1.5 [&_i]:rounded-full`
}

export const colorClass = (color) => ({
  blue: "bg-[#f8edf0] text-[#741b32]",
  violet: "bg-[#fff1f5] text-[#db7d95]",
  green: "bg-[#e7f8f1] text-[#21a875]",
  orange: "bg-[#fff2df] text-[#d88727]",
  amber: "bg-[#fff2df] text-[#d88727]",
}[color])
