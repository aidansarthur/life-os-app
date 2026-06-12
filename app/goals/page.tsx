"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { useGoals } from "@/components/useGoals";
import type { GoalCategory, GoalSummary } from "@/lib/goal-types";

const categories: GoalCategory[] = ["Fitness", "School", "Finance", "Career", "Personal", "Faith", "Custom"];

const emptyForm = { title: "", description: "", category: "Personal" as GoalCategory, targetValue: "", currentValue: "", unit: "", targetDate: "", status: "active" };

export default function GoalsPage() {
  const { goals, status, error, createGoal, updateGoal, deleteGoal, createMilestone, completeMilestone } = useGoals();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function saveGoal() {
    if (!form.title.trim()) return;
    const input = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      targetValue: Number(form.targetValue) || 0,
      currentValue: Number(form.currentValue) || 0,
      unit: form.unit.trim(),
      targetDate: form.targetDate,
      status: form.status
    };
    const saved = editingId ? await updateGoal(editingId, input) : await createGoal(input);
    if (saved) {
      setForm(emptyForm);
      setEditingId(null);
    }
  }

  function editGoal(goal: GoalSummary) {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category,
      targetValue: String(goal.targetValue || ""),
      currentValue: String(goal.currentValue || ""),
      unit: goal.unit,
      targetDate: goal.targetDate ?? "",
      status: goal.status
    });
  }

  return (
    <>
      <SectionHeader eyebrow="Goals" title="Long-term goals and milestones" />
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_140px_110px_110px_100px_150px_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Goal title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as GoalCategory })}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Target" inputMode="decimal" value={form.targetValue} onChange={(event) => setForm({ ...form, targetValue: event.target.value })} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Current" inputMode="decimal" value={form.currentValue} onChange={(event) => setForm({ ...form, currentValue: event.target.value })} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} />
          <button onClick={saveGoal} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Plus className="size-4" />
            {editingId ? "Update" : "Add"}
          </button>
        </div>
        {editingId ? <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="mt-3 text-sm font-bold text-ink/55 hover:text-ink">Cancel edit</button> : null}
        {status === "error" ? <p className="mt-4 rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load goals{error ? `: ${error}` : ""}.</p> : null}
      </section>

      {status === "loading" ? <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">Loading goals...</section> : null}
      {status !== "loading" && goals.length === 0 ? <section className="rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">No goals yet. Add one long-term target above.</section> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onEdit={editGoal} onDelete={deleteGoal} onAddMilestone={createMilestone} onCompleteMilestone={completeMilestone} />
        ))}
      </div>
    </>
  );
}

function GoalCard({ goal, onEdit, onDelete, onAddMilestone, onCompleteMilestone }: {
  goal: GoalSummary;
  onEdit: (goal: GoalSummary) => void;
  onDelete: (id: string) => Promise<boolean>;
  onAddMilestone: (goalId: string, input: { title: string; targetValue?: number }) => Promise<boolean>;
  onCompleteMilestone: (id: string) => Promise<boolean>;
}) {
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneTarget, setMilestoneTarget] = useState("");
  const statusClass = goal.scheduleStatus === "behind" ? "bg-clay/10 text-clay" : goal.scheduleStatus === "ahead" ? "bg-mint text-moss" : "bg-gold/25 text-ink";

  async function addMilestone() {
    if (!milestoneTitle.trim()) return;
    const saved = await onAddMilestone(goal.id, { title: milestoneTitle.trim(), targetValue: Number(milestoneTarget) || 0 });
    if (saved) {
      setMilestoneTitle("");
      setMilestoneTarget("");
    }
  }

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{goal.title}</h2>
          <p className="mt-1 text-sm text-ink/60">{goal.description || "No description set"}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{goal.category} {goal.targetDate ? `- target ${goal.targetDate}` : ""}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusClass}`}>{goal.scheduleStatus.replace("_", " ")}</span>
      </div>
      <ProgressBar value={goal.progress} label={`${goal.currentValue} of ${goal.targetValue} ${goal.unit}`.trim()} />
      <div className="mt-4 space-y-2">
        {goal.milestones.map((milestone) => (
          <button key={milestone.id} onClick={() => onCompleteMilestone(milestone.id)} disabled={milestone.completed} className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-left text-sm disabled:cursor-not-allowed">
            <span className={milestone.completed ? "text-ink/45 line-through" : "text-ink/75"}>{milestone.title}</span>
            <span className="flex items-center gap-2 text-xs font-semibold text-ink/50">
              {milestone.targetValue ? milestone.targetValue : ""}
              <Check className={`size-4 ${milestone.completed ? "text-moss" : "text-ink/25"}`} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_auto_auto_auto]">
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Milestone" value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} />
        <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Target" inputMode="decimal" value={milestoneTarget} onChange={(event) => setMilestoneTarget(event.target.value)} />
        <button onClick={addMilestone} className="focus-ring rounded-md bg-moss px-3 py-2 text-sm font-bold text-white">Add</button>
        <button aria-label={`Edit ${goal.title}`} onClick={() => onEdit(goal)} className="focus-ring grid place-items-center rounded-md bg-mint px-3 py-2 text-moss"><Pencil className="size-4" /></button>
        <button aria-label={`Delete ${goal.title}`} onClick={() => onDelete(goal.id)} className="focus-ring grid place-items-center rounded-md bg-clay/10 px-3 py-2 text-clay"><Trash2 className="size-4" /></button>
      </div>
    </article>
  );
}
