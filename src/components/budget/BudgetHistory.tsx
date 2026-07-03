"use client";

import { useState, useEffect } from "react";

type HistoryCategory = {
  category_id: string;
  category_label: string;
  allocated: number;
  color: string;
};

type HistoryTransaction = {
  type: "expense" | "income";
  amount: number;
  category_id: string;
};

type HistoryPlan = {
  id: string;
  month: string;
  total_budget: number;
  allowance_date: string;
  budget_categories: HistoryCategory[];
  transactions: HistoryTransaction[];
};

export default function BudgetHistory() {
  const [plans, setPlans] = useState<HistoryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/budget/history")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const d = new Date(parseInt(year), parseInt(m) - 1, 1);
    return d.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Compute stats per plan
  const plansWithStats = plans.map((plan) => {
    const txns = plan.transactions ?? [];
    const totalSpent = txns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = txns
      .filter((t) => t.type === "income" && t.category_id !== "rollover")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const saved = plan.total_budget + totalIncome - totalSpent;

    const categoriesWithSpent = (plan.budget_categories ?? []).map((cat) => {
      const spent = txns
        .filter(
          (t) => t.type === "expense" && t.category_id === cat.category_id,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...cat, spent };
    });

    return {
      ...plan,
      totalSpent,
      saved,
      categoriesWithSpent,
      isCurrent: plan.month === currentMonth,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading history...</p>
      </div>
    );
  }

  if (plansWithStats.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p style={{ fontSize: "13px", color: "#999" }}>
          No history yet — past months will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: "#999" }}>
        {plansWithStats.length} past month
        {plansWithStats.length !== 1 ? "s" : ""}
      </p>

      {plansWithStats.map((plan) => {
        const isExpanded = expanded === plan.id;
        const isOverall = plan.saved < 0;

        return (
          <div
            key={plan.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : plan.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {/* Chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  flexShrink: 0,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>

              {/* Month name */}
              <span className="flex items-center gap-2 flex-1 text-left">
                <span
                  className="text-sm font-medium"
                  style={{ color: "#1a1a2e" }}
                >
                  {formatMonth(plan.month)}
                </span>
                {plan.isCurrent && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "rgba(79,142,247,0.1)",
                      color: "#4f8ef7",
                    }}
                  >
                    Current
                  </span>
                )}
              </span>

              {/* Stats summary */}
              <div
                className="flex items-center gap-3 text-xs flex-shrink-0"
                style={{ color: "#999" }}
              >
                <span>₱{plan.total_budget.toLocaleString()} budget</span>
                <span>·</span>
                <span>₱{plan.totalSpent.toLocaleString()} spent</span>
                <span>·</span>
                <span
                  style={{
                    color: isOverall ? "#A32D2D" : "#639922",
                    fontWeight: 500,
                  }}
                >
                  {isOverall
                    ? `₱${Math.abs(plan.saved).toLocaleString()} over`
                    : `₱${plan.saved.toLocaleString()} saved`}
                </span>
              </div>

              {/* Overall progress bar */}
              <div
                className="rounded-full overflow-hidden flex-shrink-0"
                style={{ width: "80px", height: "4px", background: "#f0eff0" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((plan.totalSpent / plan.total_budget) * 100, 100)}%`,
                    background: isOverall ? "#E24B4A" : "#4f8ef7",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </button>

            {/* Expanded category breakdown */}
            {isExpanded && (
              <div style={{ borderTop: "0.5px solid #f5f4f0" }}>
                {plan.categoriesWithSpent.map((cat, idx) => {
                  const pct =
                    cat.allocated > 0
                      ? Math.min((cat.spent / cat.allocated) * 100, 100)
                      : 0;
                  const isOver = cat.spent > cat.allocated;
                  const isLast = idx === plan.categoriesWithSpent.length - 1;

                  return (
                    <div
                      key={cat.category_id}
                      className="flex items-center gap-4 px-5 py-3"
                      style={{
                        borderBottom: isLast ? "none" : "0.5px solid #f5f4f0",
                      }}
                    >
                      {/* Tree connector */}
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: "#ddd", width: "16px" }}
                      >
                        {isLast ? "└─" : "├─"}
                      </span>

                      {/* Color dot */}
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: 8,
                          height: 8,
                          background: cat.color,
                        }}
                      />

                      {/* Category name */}
                      <span
                        className="text-xs flex-1"
                        style={{ color: "#1a1a2e" }}
                      >
                        {cat.category_label}
                      </span>

                      {/* Spent / Allocated */}
                      <span
                        className="text-xs flex-shrink-0"
                        style={{
                          color: "#999",
                          fontFamily: "monospace",
                          width: "160px",
                          textAlign: "right",
                        }}
                      >
                        ₱{cat.spent.toLocaleString()} / ₱
                        {cat.allocated.toLocaleString()}
                      </span>

                      {/* Progress bar */}
                      <div
                        className="rounded-full overflow-hidden flex-shrink-0"
                        style={{
                          width: "80px",
                          height: "4px",
                          background: "#f0eff0",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: isOver ? "#E24B4A" : cat.color,
                          }}
                        />
                      </div>

                      {/* Percentage */}
                      <span
                        className="text-xs flex-shrink-0"
                        style={{
                          color: isOver ? "#A32D2D" : "#999",
                          fontFamily: "monospace",
                          width: "48px",
                          textAlign: "right",
                        }}
                      >
                        {Math.round(pct)}%{isOver ? " ⚠" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
