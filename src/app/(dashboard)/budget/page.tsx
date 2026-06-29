"use client";

import { useState, useEffect, useCallback } from "react";
import BudgetSetup from "@/components/budget/BudgetSetup";
import CategoryList from "@/components/budget/CategoryList";
import DonutChart from "@/components/budget/DonutChart";
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
  const [isMobile, setIsMobile] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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
      <div className="flex flex-col gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setLoading(true);
              fetchPlan();
            }}
            className="flex items-center gap-2 text-sm self-start"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              fontFamily: "inherit",
              padding: "4px 0",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Budget
          </button>
        )}
        <div
          className="rounded-2xl p-8"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <BudgetSetup
            onSetupComplete={() => {
              setIsEditing(false);
              setLoading(true);
              fetchPlan();
            }}
          />
        </div>
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
          onClick={() => {
            setPlan(null);
            setIsEditing(true);
          }}
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

      {isMobile ? (
        /* Mobile: stacked layout */
        <div className="flex flex-col gap-3">
          {/* Donut chart — always visible */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            {(() => {
              const totalSpent = categories.reduce(
                (sum, c) => sum + c.spent,
                0,
              );
              const remaining = plan.total_budget - totalSpent;
              const segments = categories.map((cat) => ({
                color: cat.color,
                percentage:
                  plan.total_budget > 0 ? cat.allocated / plan.total_budget : 0,
                label: cat.category_label,
              }));
              return (
                <DonutChart
                  segments={segments}
                  remaining={remaining}
                  total={plan.total_budget}
                  spent={totalSpent}
                />
              );
            })()}
          </div>

          {/* Categories toggle */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setShowCategories((v) => !v)}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium"
              style={{
                background: "#fff",
                border: "0.5px solid #ebebeb",
                borderRadius: showCategories ? "12px 12px 0 0" : "12px",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#1a1a2e",
              }}
            >
              <span className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <polyline points="3 6 4 7 6 5" />
                </svg>
                Categories
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
                style={{
                  transform: showCategories ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showCategories && (
              <div
                style={{
                  background: "#fff",
                  border: "0.5px solid #ebebeb",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  padding: "16px",
                }}
              >
                <CategoryList
                  categories={categories}
                  totalBudget={plan.total_budget}
                  categoriesOnly
                />
              </div>
            )}
          </div>

          {/* Transactions — always visible on mobile */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              minHeight: "400px",
            }}
          >
            <TransactionLog
              transactions={transactions}
              categories={categories}
              planId={plan.id}
              onTransactionAdded={handleTransactionAdded}
              onTransactionDeleted={handleTransactionDeleted}
            />
          </div>
        </div>
      ) : (
        /* Desktop: side-by-side layout (your fixed version) */
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
      )}

      {/* Daily Budget Widget */}
      <DailyBudgetWidget compact={true} />
    </div>
  );
}
