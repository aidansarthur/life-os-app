export function SectionHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-wide text-moss">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}
