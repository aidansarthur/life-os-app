export function ReportCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-moss">{title}</h2>
      <p className="leading-7 text-ink/75">{body}</p>
    </section>
  );
}
