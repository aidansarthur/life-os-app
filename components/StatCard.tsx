import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "mint"
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "mint" | "sky" | "gold" | "clay";
}) {
  const tones = {
    mint: "bg-mint text-moss",
    sky: "bg-sky text-ink",
    gold: "bg-gold/20 text-ink",
    clay: "bg-clay/15 text-clay"
  };

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/60">{label}</p>
        <span className={`grid size-9 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/60">{detail}</p>
    </article>
  );
}
