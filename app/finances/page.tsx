"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeader } from "@/components/SectionHeader";
import { useFinance } from "@/components/useFinance";

type TransactionKind = "Income" | "Expense" | "Savings";

function money(value: number) {
  return `$${Math.round(value)}`;
}

export default function FinancesPage() {
  const { accounts, transactions, goals, summary, status, error, createAccount, createTransaction, createGoal, deleteTransaction } = useFinance();
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("Checking");
  const [accountBalance, setAccountBalance] = useState("");
  const [kind, setKind] = useState<TransactionKind>("Expense");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [goalTitle, setGoalTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  async function addAccount() {
    if (!accountName.trim()) return;
    const saved = await createAccount({ name: accountName.trim(), type: accountType.trim(), balance: Number(accountBalance) || 0 });
    if (saved) {
      setAccountName("");
      setAccountType("Checking");
      setAccountBalance("");
    }
  }

  async function addTransaction() {
    const selectedAccount = accountId || accounts[0]?.id;
    const parsedAmount = Number(amount);
    if (!selectedAccount || !category.trim() || !description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    const saved = await createTransaction({
      accountId: selectedAccount,
      description: description.trim(),
      amount: parsedAmount,
      category: category.trim(),
      transactionDate,
      kind
    });
    if (saved) {
      setCategory("");
      setAmount("");
      setDescription("");
      setKind("Expense");
    }
  }

  async function addGoal() {
    const parsedTarget = Number(targetAmount);
    if (!goalTitle.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    const saved = await createGoal({ title: goalTitle.trim(), targetAmount: parsedTarget, currentAmount: Number(currentAmount) || 0, targetDate });
    if (saved) {
      setGoalTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Finances" title="Manual money tracking" />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MoneyBox label="Accounts" value={summary.totalAccountBalance} />
        <MoneyBox label="Income" value={summary.monthlyIncome} />
        <MoneyBox label="Expenses" value={summary.monthlyExpenses} />
        <MoneyBox label="Balance" value={summary.monthlyBalance} />
      </div>

      {status === "error" ? <p className="mb-6 rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load finances{error ? `: ${error}` : ""}.</p> : null}
      {status === "loading" ? <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 text-sm font-semibold text-ink/60 shadow-soft">Loading finances...</section> : null}

      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-bold">Accounts</h2>
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_140px_auto]">
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Account name" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={accountType} onChange={(event) => setAccountType(event.target.value)}>
            <option>Checking</option>
            <option>Savings</option>
            <option>Cash</option>
            <option>Other</option>
          </select>
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Balance" inputMode="decimal" value={accountBalance} onChange={(event) => setAccountBalance(event.target.value)} />
          <button onClick={addAccount} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Plus className="size-4" />
            Add
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-md border border-ink/10 px-3 py-2 text-sm">
              <p className="font-bold">{account.name}</p>
              <p className="text-ink/55">{account.type} - {money(account.balance)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-bold">Transactions</h2>
        <div className="grid gap-3 lg:grid-cols-[130px_1fr_1fr_120px_150px_150px_auto]">
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={kind} onChange={(event) => setKind(event.target.value as TransactionKind)}>
            <option>Income</option>
            <option>Expense</option>
            <option>Savings</option>
          </select>
          <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="">{accounts.length ? "Select account" : "Add account first"}</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
          <button onClick={addTransaction} disabled={!accounts.length} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold">Savings goals</h2>
          <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_130px_130px_150px_auto]">
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Goal title" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Target" inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" placeholder="Current" inputMode="decimal" value={currentAmount} onChange={(event) => setCurrentAmount(event.target.value)} />
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            <button onClick={addGoal} className="focus-ring rounded-md bg-moss px-3 py-2 text-sm font-bold text-white">Add goal</button>
          </div>
          <div className="space-y-4">
            {goals.length ? goals.map((goal) => (
              <div key={goal.id}>
                <ProgressBar value={goal.targetAmount ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0} label={`${goal.title}: ${money(goal.currentAmount)} of ${money(goal.targetAmount)}`} />
                <p className="mt-1 text-xs font-semibold text-ink/45">{goal.targetDate ? `Target date: ${goal.targetDate}` : "No target date"}</p>
              </div>
            )) : <p className="text-sm font-semibold text-ink/55">No savings goals yet.</p>}
          </div>
          <div className="mt-5 space-y-3">
            {transactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-sm">
                <div>
                  <p className="font-bold">{item.description}</p>
                  <p className="text-ink/55">{item.accountName} - {item.category} - {item.transactionDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${item.amount < 0 ? "text-clay" : "text-moss"}`}>{item.amount < 0 ? "-" : "+"}{money(Math.abs(item.amount))}</span>
                  <button aria-label={`Delete ${item.description}`} onClick={() => deleteTransaction(item.id)} className="focus-ring rounded-md p-2 text-clay hover:bg-clay/10">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <MiniBarChart data={summary.spendingByCategory.length ? summary.spendingByCategory : [{ label: "None", value: 0 }]} valueKey="value" label="Spending by category" />
      </div>
    </>
  );
}

function MoneyBox({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-bold">{money(value)}</p>
    </section>
  );
}
