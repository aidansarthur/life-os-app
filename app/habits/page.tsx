"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { habitCompletion } from "@/lib/calculations";
import { initialHabits, today } from "@/lib/mock-data";
import type { Habit } from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function HabitsPage() {
  const [habits, setHabits] = useLocalStorageState<Habit[]>("life-os-habits", initialHabits);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const completion = useMemo(() => habitCompletion(habits, today), [habits]);

  function saveHabit() {
    if (!name.trim()) return;
    if (editingId) {
      setHabits((items) => items.map((item) => item.id === editingId ? { ...item, name: name.trim(), target: target.trim() } : item));
      setEditingId(null);
    } else {
      setHabits((items) => [...items, { id: crypto.randomUUID(), name: name.trim(), target: target.trim(), completions: [], streak: 0 }]);
    }
    setName("");
    setTarget("");
  }

  function toggleHabit(id: string) {
    setHabits((items) => items.map((item) => {
      if (item.id !== id) return item;
      const complete = item.completions.includes(today);
      return {
        ...item,
        completions: complete ? item.completions.filter((date) => date !== today) : [...item.completions, today],
        streak: complete ? Math.max(0, item.streak - 1) : item.streak + 1
      };
    }));
  }

  return (
    <>
      <SectionHeader eyebrow="Habits" title="Daily actions and streaks" />
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <ProgressBar value={completion} label="Today complete" />
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Habit name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Target" value={target} onChange={(event) => setTarget(event.target.value)} />
          <button onClick={saveHabit} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Plus className="size-4" />
            {editingId ? "Update" : "Add"}
          </button>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {habits.map((habit) => {
          const complete = habit.completions.includes(today);
          return (
            <article key={habit.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{habit.name}</h2>
                  <p className="mt-1 text-sm text-ink/60">{habit.target || "No target set"}</p>
                </div>
                <button onClick={() => toggleHabit(habit.id)} aria-label={`Toggle ${habit.name}`} className={`focus-ring grid size-10 shrink-0 place-items-center rounded-md ${complete ? "bg-moss text-white" : "bg-ink/10 text-ink/60"}`}>
                  <Check className="size-5" />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-moss">{habit.streak} day streak</span>
                <div className="flex gap-2">
                  <button
                    aria-label={`Edit ${habit.name}`}
                    onClick={() => {
                      setEditingId(habit.id);
                      setName(habit.name);
                      setTarget(habit.target);
                    }}
                    className="focus-ring rounded-md p-2 text-ink/60 hover:bg-mint hover:text-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button aria-label={`Delete ${habit.name}`} onClick={() => setHabits((items) => items.filter((item) => item.id !== habit.id))} className="focus-ring rounded-md p-2 text-clay hover:bg-clay/10">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
