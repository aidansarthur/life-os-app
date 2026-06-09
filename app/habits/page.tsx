"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { useHabits } from "@/components/useHabits";

export default function HabitsPage() {
  const { habits, status, error, createHabit, completeHabit, deleteHabit } = useHabits();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetFrequency, setTargetFrequency] = useState("daily");
  const [saving, setSaving] = useState(false);
  const completedToday = useMemo(() => habits.filter((habit) => habit.completedToday).length, [habits]);
  const completion = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  async function saveHabit() {
    if (!title.trim() || saving) return;
    setSaving(true);
    const saved = await createHabit({
      title: title.trim(),
      description: description.trim(),
      targetFrequency: targetFrequency.trim() || "daily"
    });
    setSaving(false);

    if (saved) {
      setTitle("");
      setDescription("");
      setTargetFrequency("daily");
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Habits" title="Daily actions and streaks" />
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <ProgressBar value={completion} label="Today complete" />
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Habit name" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={targetFrequency} onChange={(event) => setTargetFrequency(event.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekly">Weekly</option>
          </select>
          <button onClick={saveHabit} disabled={saving} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="size-4" />
            {saving ? "Adding" : "Add"}
          </button>
        </div>
        {status === "error" ? <p className="mt-4 rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load habits{error ? `: ${error}` : ""}.</p> : null}
      </section>

      {status === "loading" ? (
        <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">Loading habits...</section>
      ) : habits.length === 0 ? (
        <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">No habits yet. Add your first daily action above.</section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {habits.map((habit) => (
            <article key={habit.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{habit.title}</h2>
                  <p className="mt-1 text-sm text-ink/60">{habit.description || "No description set"}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{habit.targetFrequency}</p>
                </div>
                <button onClick={() => completeHabit(habit.id)} disabled={habit.completedToday} aria-label={`Complete ${habit.title}`} className={`focus-ring grid size-10 shrink-0 place-items-center rounded-md disabled:cursor-not-allowed ${habit.completedToday ? "bg-moss text-white" : "bg-ink/10 text-ink/60 hover:bg-mint hover:text-ink"}`}>
                  <Check className="size-5" />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-moss">{habit.streak} day streak</span>
                <button aria-label={`Delete ${habit.title}`} onClick={() => deleteHabit(habit.id)} className="focus-ring rounded-md p-2 text-clay hover:bg-clay/10">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
