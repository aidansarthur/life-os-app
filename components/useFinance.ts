"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceAccountSummary, FinanceGoalSummary, FinanceResponse, FinanceSummary, FinanceTransactionSummary } from "@/lib/finance-types";

type FinanceStatus = "loading" | "ready" | "error";

type CreateAccountInput = { name: string; type?: string; balance?: number };
type CreateTransactionInput = { accountId: string; description: string; amount: number; category: string; transactionDate?: string; kind?: string };
type CreateGoalInput = { title: string; targetAmount: number; currentAmount?: number; targetDate?: string };

const emptySummary: FinanceSummary = {
  totalAccountBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlySavings: 0,
  monthlyBalance: 0,
  spendingByCategory: []
};

export function useFinance() {
  const [accounts, setAccounts] = useState<FinanceAccountSummary[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransactionSummary[]>([]);
  const [goals, setGoals] = useState<FinanceGoalSummary[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [status, setStatus] = useState<FinanceStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadFinance = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/finance", { cache: "no-store" });
      const data = (await response.json()) as FinanceResponse;

      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "request_failed" : data.error);
        return;
      }

      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setGoals(data.goals);
      setSummary(data.summary);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("request_failed");
    }
  }, []);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const createAccount = useCallback(async (input: CreateAccountInput) => {
    const response = await fetch("/api/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadFinance();
    return true;
  }, [loadFinance]);

  const createTransaction = useCallback(async (input: CreateTransactionInput) => {
    const response = await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadFinance();
    return true;
  }, [loadFinance]);

  const createGoal = useCallback(async (input: CreateGoalInput) => {
    const response = await fetch("/api/finance/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadFinance();
    return true;
  }, [loadFinance]);

  const deleteTransaction = useCallback(async (id: string) => {
    const response = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadFinance();
    return true;
  }, [loadFinance]);

  return { accounts, transactions, goals, summary, status, error, loadFinance, createAccount, createTransaction, createGoal, deleteTransaction };
}
