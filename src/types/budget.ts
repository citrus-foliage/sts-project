export type BudgetCategory = {
  id: string;
  plan_id: string;
  category_id: string;
  category_label: string;
  allocated: number;
  spent: number;
  color?: string;
};

export type BudgetTransaction = {
  id: string;
  label: string;
  amount: number;
  type: "expense" | "income";
  category_id: string;
  date: string;
  note?: string;
};

export type BudgetPlan = {
  id: string;
  total_budget: number;
  next_allowance_date: string;
  month: string;
};
