"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { categorySpend, financeSummary } from "@/lib/calculations";
import { initialTransactions, today } from "@/lib/mock-data";
import type { FinancialTransaction } from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function FinancesPage() {
  const [transactions, setTransactions] = useLocalStorageState<FinancialTransaction[]>("life-os-transactions", initialTransactions);
  const [type, setType] = useState<FinancialTransaction["type"]>("Expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const summary = useMemo(() => financeSummary(transactions), [transactions]);
  const spend = useMemo(() => categorySpend(transactions), [transactions]);
  const chartData = Object.entries(spend).map(([label, value]) => ({ label, value }));

  function addTransaction() {
    const parsedAmount = Number(amount);
    if (!category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setTransactions((items) => [...items, { id: crypto.randomUUID(), date: today, type, category: category.trim(), amount: parsedAmount, note: note.trim() }]);
    setCategory("");
    setAmount("");
    setNote("");
  }

  return (
    <>
      <SectionHeader eyebrow="Finances" title="Manual money tracking" />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MoneyBox label="Income" value={summary.income} />
        <MoneyBox label="Expenses" value={summary.expenses} />
        <MoneyBox label="Savings" value={summary.savings} />
        <MoneyBox label="Balance" value={summary.balance} />
      </div>
      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[150px_1fr_120px_1fr_auto]">
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={type} onChange={(event) => setType(event.target.value as FinancialTransaction["type"])}>
            <option>Income</option>
            <option>Expense</option>
            <option>Savings</option>
          </select>
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Note" value={note} onChange={(event) => setNote(event.target.value)} />
          <button onClick={addTransaction} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold">Savings progress</h2>
          <ProgressBar value={Math.min(100, Math.round((summary.savings / 300) * 100))} label="$300 monthly savings target" />
          <div className="mt-5 space-y-3">
            {transactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-sm">
                <div>
                  <p className="font-bold">{item.category}</p>
                  <p className="text-ink/55">{item.type} - {item.note || item.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">${item.amount}</span>
                  <button aria-label={`Delete ${item.category}`} onClick={() => setTransactions((items) => items.filter((row) => row.id !== item.id))} className="focus-ring rounded-md p-2 text-clay hover:bg-clay/10">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <MiniBarChart data={chartData.length ? chartData : [{ label: "None", value: 0 }]} valueKey="value" label="Spending by category" />
      </div>
    </>
  );
}

function MoneyBox({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-bold">${value}</p>
    </section>
  );
}
