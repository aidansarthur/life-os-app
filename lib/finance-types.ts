export type FinanceAccountSummary = {
  id: string;
  name: string;
  type: string;
  balance: number;
  createdAt: string;
};

export type FinanceTransactionSummary = {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  amount: number;
  category: string;
  transactionDate: string;
  createdAt: string;
};

export type FinanceGoalSummary = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
};

export type FinanceSummary = {
  totalAccountBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  monthlyBalance: number;
  spendingByCategory: { label: string; value: number }[];
};

export type FinanceResponse =
  | { ok: true; accounts: FinanceAccountSummary[]; transactions: FinanceTransactionSummary[]; goals: FinanceGoalSummary[]; summary: FinanceSummary }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };
