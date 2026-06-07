export function MiniBarChart({
  data,
  valueKey,
  label,
  max
}: {
  data: Record<string, string | number>[];
  valueKey: string;
  label: string;
  max?: number;
}) {
  const highest = max ?? Math.max(...data.map((item) => Number(item[valueKey])), 1);

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="mb-4 text-sm font-bold text-ink">{label}</p>
      <div className="flex h-44 items-end gap-3">
        {data.map((item) => {
          const value = Number(item[valueKey]);
          const height = Math.max(8, (value / highest) * 100);
          return (
            <div key={String(item.date ?? item.label)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div className="w-full rounded-t-md bg-moss" style={{ height: `${height}%` }} title={`${value}`} />
              </div>
              <span className="text-xs font-semibold text-ink/55">{String(item.date ?? item.label)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
