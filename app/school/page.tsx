"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { initialSchoolGoals } from "@/lib/mock-data";
import type { SchoolGoal } from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function SchoolPage() {
  const [goals, setGoals] = useLocalStorageState<SchoolGoal[]>("life-os-school-goals", initialSchoolGoals);
  const [className, setClassName] = useState("");
  const [target, setTarget] = useState("");
  const [priority, setPriority] = useState<SchoolGoal["priority"]>("Medium");

  function addGoal() {
    if (!className.trim()) return;
    setGoals((items) => [...items, { id: crypto.randomUUID(), className: className.trim(), target: target.trim(), priority, progress: 0, tasks: [] }]);
    setClassName("");
    setTarget("");
    setPriority("Medium");
  }

  function addTask(goalId: string, title: string, dueDate: string) {
    if (!title.trim()) return;
    setGoals((items) => items.map((goal) => goal.id === goalId ? {
      ...goal,
      tasks: [...goal.tasks, { id: crypto.randomUUID(), title: title.trim(), dueDate, done: false }]
    } : goal));
  }

  return (
    <>
      <SectionHeader eyebrow="School" title="Goals, classes, and deadlines" />
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Class or goal" value={className} onChange={(event) => setClassName(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Target" value={target} onChange={(event) => setTarget(event.target.value)} />
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as SchoolGoal["priority"])}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <button onClick={addGoal} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => (
          <SchoolGoalCard key={goal.id} goal={goal} onAddTask={addTask} onChange={setGoals} />
        ))}
      </div>
    </>
  );
}

function SchoolGoalCard({
  goal,
  onAddTask,
  onChange
}: {
  goal: SchoolGoal;
  onAddTask: (goalId: string, title: string, dueDate: string) => void;
  onChange: Dispatch<SetStateAction<SchoolGoal[]>>;
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const priorityClass = goal.priority === "High" ? "bg-clay/15 text-clay" : goal.priority === "Medium" ? "bg-gold/25 text-ink" : "bg-mint text-moss";

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{goal.className}</h2>
          <p className="mt-1 text-sm text-ink/60">{goal.target}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${priorityClass}`}>{goal.priority}</span>
      </div>
      <ProgressBar value={goal.progress} label="Progress" />
      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink/50">Update progress</label>
      <input
        type="range"
        min="0"
        max="100"
        value={goal.progress}
        onChange={(event) => onChange((items) => items.map((item) => item.id === goal.id ? { ...item, progress: Number(event.target.value) } : item))}
        className="mt-2 w-full accent-[#3b6650]"
      />
      <div className="mt-4 space-y-2">
        {goal.tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onChange((items) => items.map((item) => item.id === goal.id ? { ...item, tasks: item.tasks.map((row) => row.id === task.id ? { ...row, done: !row.done } : row) } : item))}
            className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-left text-sm"
          >
            <span className={task.done ? "text-ink/45 line-through" : "text-ink/75"}>{task.title}</span>
            <span className="flex items-center gap-2 text-xs font-semibold text-ink/50">
              {task.dueDate}
              <CheckCircle2 className={`size-4 ${task.done ? "text-moss" : "text-ink/25"}`} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_auto_auto]">
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="New task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
        <button
          onClick={() => {
            onAddTask(goal.id, taskTitle, taskDueDate);
            setTaskTitle("");
          }}
          className="focus-ring rounded-md bg-moss px-3 py-2 text-sm font-bold text-white"
        >
          Add task
        </button>
        <button aria-label={`Delete ${goal.className}`} onClick={() => onChange((items) => items.filter((item) => item.id !== goal.id))} className="focus-ring grid place-items-center rounded-md bg-clay/10 px-3 py-2 text-clay">
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
