import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { FinanceAccountSummary, FinanceResponse, FinanceSummary, FinanceTransactionSummary } from "@/lib/finance-types";

type AccountRow = {
  id: string;
  name: string;
  type: string;
  balance: number | string;
  created_at: string;
};

type TransactionRow = {
  id: string;
  account_id: string;
  description: string;
  amount: number | string;
  category: string;
  transaction_date: string;
  created_at: string;
};

type GoalRow = {
  id: string;
  title: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date: string | null;
  created_at: string;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

function summarize(accounts: FinanceAccountSummary[], transactions: FinanceTransactionSummary[]): FinanceSummary {
  const currentMonth = monthKey(new Date());
  const monthly = transactions.filter((transaction) => transaction.transactionDate.slice(0, 7) === currentMonth);
  const monthlyIncome = monthly.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = monthly
    .filter((transaction) => transaction.amount < 0 && transaction.category.toLowerCase() !== "savings")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const monthlySavings = monthly
    .filter((transaction) => transaction.amount < 0 && transaction.category.toLowerCase() === "savings")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const spending = monthly
    .filter((transaction) => transaction.amount < 0 && transaction.category.toLowerCase() !== "savings")
    .reduce<Record<string, number>>((groups, transaction) => {
      groups[transaction.category] = (groups[transaction.category] ?? 0) + Math.abs(transaction.amount);
      return groups;
    }, {});

  return {
    totalAccountBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    monthlyBalance: monthlyIncome - monthlyExpenses - monthlySavings,
    spendingByCategory: Object.entries(spending).map(([label, value]) => ({ label, value }))
  };
}

function buildResponse(accounts: AccountRow[], transactions: TransactionRow[], goals: GoalRow[]): FinanceResponse {
  const accountSummaries = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: toNumber(account.balance),
    createdAt: account.created_at
  }));
  const accountNames = new Map(accountSummaries.map((account) => [account.id, account.name]));
  const transactionSummaries = transactions.map((transaction) => ({
    id: transaction.id,
    accountId: transaction.account_id,
    accountName: accountNames.get(transaction.account_id) ?? "Account",
    description: transaction.description,
    amount: toNumber(transaction.amount),
    category: transaction.category,
    transactionDate: transaction.transaction_date,
    createdAt: transaction.created_at
  }));
  const goalSummaries = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    targetAmount: toNumber(goal.target_amount),
    currentAmount: toNumber(goal.current_amount),
    targetDate: goal.target_date,
    createdAt: goal.created_at
  }));

  return {
    ok: true,
    accounts: accountSummaries,
    transactions: transactionSummaries,
    goals: goalSummaries,
    summary: summarize(accountSummaries, transactionSummaries)
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const [{ data: accounts, error: accountsError }, { data: transactions, error: transactionsError }, { data: goals, error: goalsError }] = await Promise.all([
    supabase
      .from("finance_accounts")
      .select("id, name, type, balance, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("finance_transactions")
      .select("id, account_id, description, amount, category, transaction_date, created_at")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("finance_goals")
      .select("id, title, target_amount, current_amount, target_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
  ]);

  if (accountsError || transactionsError || goalsError) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json(buildResponse(accounts ?? [], transactions ?? [], goals ?? []));
}

