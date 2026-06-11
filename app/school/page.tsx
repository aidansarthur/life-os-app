"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { useSchool } from "@/components/useSchool";
import type { SchoolGoalSummary } from "@/lib/school-types";

type Priority = "Low" | "Medium" | "High";

export default function SchoolPage() {
  const { goals, status, error, createGoal, createTask, completeTask, deleteGoal } = useSchool();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Class");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [saving, setSaving] = useState(false);

  async function addGoal() {
    if (!title.trim() || saving) return;
    setSaving(true);
    const saved = await createGoal({ title: title.trim(), description: description.trim(), category: category.trim(), priority });
    setSaving(false);

    if (saved) {
      setTitle("");
      setDescription("");
      setCategory("Class");
      setPriority("Medium");
    }
  }

  return (
    <>
      <SectionHeader eyebrow="School" title="Goals, classes, and deadlines" />
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_160px_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Class or goal" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <button onClick={addGoal} disabled={saving} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="size-4" />
            {saving ? "Adding" : "Add"}
          </button>
        </div>
        {status === "error" ? <p className="mt-4 rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load school goals{error ? `: ${error}` : ""}.</p> : null}
      </section>

      {status === "loading" ? (
        <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">Loading school goals...</section>
      ) : goals.length === 0 ? (
        <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">No school goals yet. Add your first class or deadline above.</section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {goals.map((goal) => (
            <SchoolGoalCard key={goal.id} goal={goal} onAddTask={createTask} onCompleteTask={completeTask} onDeleteGoal={deleteGoal} />
          ))}
        </div>
      )}
    </>
  );
}

function SchoolGoalCard({
  goal,
  onAddTask,
  onCompleteTask,
  onDeleteGoal
}: {
  goal: SchoolGoalSummary;
  onAddTask: (goalId: string, input: { title: string; dueDate?: string; priority?: string }) => Promise<boolean>;
  onCompleteTask: (taskId: string) => Promise<boolean>;
  onDeleteGoal: (goalId: string) => Promise<boolean>;
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [taskPriority, setTaskPriority] = useState<Priority>("Medium");
  const priorityClass = goal.priority === "High" ? "bg-clay/15 text-clay" : goal.priority === "Medium" ? "bg-gold/25 text-ink" : "bg-mint text-moss";

  async function addTask() {
    if (!taskTitle.trim()) return;
    const saved = await onAddTask(goal.id, { title: taskTitle.trim(), dueDate: taskDueDate, priority: taskPriority });
    if (saved) {
      setTaskTitle("");
      setTaskPriority("Medium");
    }
  }

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{goal.title}</h2>
          <p className="mt-1 text-sm text-ink/60">{goal.description || "No description set"}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{goal.category}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${priorityClass}`}>{goal.priority}</span>
      </div>
      <ProgressBar value={goal.progress} label="Progress" />
      <div className="mt-4 space-y-2">
        {goal.tasks.map((task) => {
          const complete = task.status === "completed";
          return (
            <button
              key={task.id}
              onClick={() => onCompleteTask(task.id)}
              disabled={complete}
              className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-left text-sm disabled:cursor-not-allowed"
            >
              <span className={complete ? "text-ink/45 line-through" : "text-ink/75"}>{task.title}</span>
              <span className="flex items-center gap-2 text-xs font-semibold text-ink/50">
                {task.dueDate ?? "No date"}
                <CheckCircle2 className={`size-4 ${complete ? "text-moss" : "text-ink/25"}`} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_150px_130px_auto_auto]">
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="New task" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
        <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as Priority)}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button onClick={addTask} className="focus-ring rounded-md bg-moss px-3 py-2 text-sm font-bold text-white">
          Add task
        </button>
        <button aria-label={`Delete ${goal.title}`} onClick={() => onDeleteGoal(goal.id)} className="focus-ring grid place-items-center rounded-md bg-clay/10 px-3 py-2 text-clay">
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
