"use client";

import { useState, useEffect, useCallback } from "react";
import BudgetSetup from "@/components/budget/BudgetSetup";
import CategoryList from "@/components/budget/CategoryList";
import DailyBudgetWidget from "@/components/budget/DailyBudgetWidget";
import TransactionLog from "@/components/budget/TransactionLog";
import FeatureHidden from "@/components/layout/FeatureHidden";

type Category = {
  id: string;
  category_id: string;
  category_label: string;
  allocated: number;
  color: string;
  spent: number;
};

type Transaction = {
  id: string;
  category_id: string;
  label: string;
  amount: number;
  type: "expense" | "income";
  date: string;
  note?: string;
};

type Plan = {
  id: string;
  total_budget: number;
  allowance_date: string;
  month: string;
};

export default function BudgetPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Feature visibility check
  const [showFeature, setShowFeature] = useState(true);
  const [checkingFeature, setCheckingFeature] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.show_budget === false) setShowFeature(false);
      })
      .catch(() => {})
      .finally(() => setCheckingFeature(false));
  }, []);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/budget/plan");
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        const txns: Transaction[] = data.plan.transactions ?? [];
        const cats: Category[] = (data.plan.budget_categories ?? []).map(
          (cat: Omit<Category, "spent">) => ({
            ...cat,
            spent: txns
              .filter(
                (t) =>
                  t.category_id === cat.category_id && t.type === "expense",
              )
              .reduce((sum, t) => sum + t.amount, 0),
          }),
        );
        setCategories(cats);
        setTransactions(txns);
      }
    } catch (err) {
      console.error("Fetch plan error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleTransactionAdded = () => fetchPlan();

  const handleTransactionDeleted = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    fetchPlan();
  };

  const currentMonth = new Date().toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  // Block render until feature visibility is confirmed
  if (checkingFeature) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (!showFeature) {
    return <FeatureHidden featureName="Budget Planner" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>
          Loading your budget...
        </p>
      </div>
    );
  }

  // No plan — show setup
  if (!plan) {
    return (
      <div
        className="rounded-2xl p-8"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <BudgetSetup
          onSetupComplete={() => {
            setLoading(true);
            fetchPlan();
          }}
        />
      </div>
    );
  }

  // Plan exists — show full budget planner
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "#999" }}>
            {currentMonth}
          </p>
          <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Total budget: ₱{plan.total_budget.toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPlan(null)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: "#f5f4f0",
            border: "0.5px solid #ebebeb",
            color: "#666",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Edit budget
        </button>
      </div>

      {/* Split layout */}
      <div
        className="flex gap-4 rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          border: "0.5px solid #ebebeb",
          minHeight: "600px",
        }}
      >
        {/* Left — Donut + categories */}
        <div
          className="p-5"
          style={{
            width: "300px",
            minWidth: "300px",
            borderRight: "0.5px solid #ebebeb",
          }}
        >
          <CategoryList
            categories={categories}
            totalBudget={plan.total_budget}
          />
        </div>

        {/* Right — Transaction log */}
        <div className="flex-1">
          <TransactionLog
            transactions={transactions}
            categories={categories}
            planId={plan.id}
            onTransactionAdded={handleTransactionAdded}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </div>
      </div>

      {/* Daily Budget Widget */}
      <DailyBudgetWidget compact={true} />
    </div>
  );
}
