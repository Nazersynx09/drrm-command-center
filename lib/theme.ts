export function theme(dark: boolean) {
  return {
    pageBg: dark ? 'bg-[#00111f]' : 'bg-slate-100',
    pageText: dark ? 'text-white' : 'text-slate-900',
    cardBg: dark ? 'bg-[#071a2b]' : 'bg-white',
    cardBorder: dark ? 'border-white/[0.07]' : 'border-slate-200',
    panelBg: dark ? 'bg-[#040f1b]' : 'bg-white',
    panelBorder: dark ? 'border-white/[0.07]' : 'border-slate-200',
    subheadBg: dark ? 'bg-black/30' : 'bg-slate-50',
    subheadBorder: dark ? 'border-white/[0.06]' : 'border-slate-200',
    muted: dark ? 'text-white/40' : 'text-slate-400',
    body: dark ? 'text-white/70' : 'text-slate-700',
    rowBorder: dark ? 'border-white/[0.05]' : 'border-slate-100',
    rowHover: dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
    chip: dark ? 'bg-white/[0.06]' : 'bg-slate-100',
    mapBg: dark ? 'bg-[#030d18]' : 'bg-slate-200',
    select: dark ? 'bg-[#040f1b] border-white/20 text-white/70' : 'bg-white border-slate-300 text-slate-600',
  };
}

export type Theme = ReturnType<typeof theme>;
