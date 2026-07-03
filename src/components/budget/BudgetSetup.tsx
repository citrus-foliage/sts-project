"use client";

import { useState } from "react";

const DEFAULT_CATEGORIES = [
  {
    category_id: "transport",
    category_label: "Transportation",
    color: "#4f8ef7",
    allocated: 0,
  },
  {
    category_id: "food",
    category_label: "Food & Dining",
    color: "#639922",
    allocated: 0,
  },
  {
    category_id: "mobile",
    category_label: "Mobile & Internet",
    color: "#BA7517",
    allocated: 0,
  },
  {
    category_id: "shared",
    category_label: "Shared Expenses",
    color: "#534AB7",
    allocated: 0,
  },
  {
    category_id: "debt",
    category_label: "Debt & Obligations",
    color: "#E24B4A",
    allocated: 0,
  },
  {
    category_id: "leisure",
    category_label: "Leisure & Entertainment",
    color: "#0F6E56",
    allocated: 0,
  },
  {
    category_id: "contrib",
    category_label: "Personal Contributions",
    color: "#D85A30",
    allocated: 0,
  },
  {
    category_id: "savings",
    category_label: "Savings & Investments",
    color: "#1D9E75",
    allocated: 0,
  },
];

type Props = {
  onSetupComplete: () => void;
};

export default function BudgetSetup({ onSetupComplete }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [totalBudget, setTotalBudget] = useState("");
  const [allowanceDate, setAllowanceDate] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalAllocated = categories.reduce(
    (sum, c) => sum + (c.allocated || 0),
    0,
  );
  const remaining = parseFloat(totalBudget || "0") - totalAllocated;

  const updateCategory = (id: string, value: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.category_id === id ? { ...c, allocated: parseFloat(value) || 0 } : c,
      ),
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/budget/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_budget: parseFloat(totalBudget),
          allowance_date: allowanceDate,
          categories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-96 gap-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(79,142,247,0.1)" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="2"
          >
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <circle cx="16" cy="12" r="1" fill="#4f8ef7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "#1a1a2e" }}>
          {step === 1 ? "Set Up Your Budget" : "Allocate by Category"}
        </h2>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          {step === 1
            ? "Enter your total budget for this month and your next allowance date."
            : "Decide how much goes to each spending category."}
        </p>
      </div>

      {/* Step 1 — Total budget */}
      {step === 1 && (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "#555" }}>
              Total monthly budget (₱)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: "#555" }}>
              Next allowance or payday
            </label>
            <input
              type="date"
              value={allowanceDate}
              onChange={(e) => setAllowanceDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!totalBudget || !allowanceDate}
            className="py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: !totalBudget || !allowanceDate ? "#ccc" : "#1a1a2e",
              border: "none",
              cursor:
                !totalBudget || !allowanceDate ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Next — Allocate categories
          </button>
        </div>
      )}

      {/* Step 2 — Category allocation */}
      {step === 2 && (
        <div className="flex flex-col gap-3 w-full">
          {/* Remaining indicator */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{
              background:
                remaining < 0 ? "rgba(163,45,45,0.08)" : "rgba(99,153,34,0.08)",
              border: `0.5px solid ${
                remaining < 0 ? "rgba(163,45,45,0.2)" : "rgba(99,153,34,0.2)"
              }`,
            }}
          >
            <span style={{ color: "#555" }}>
              Total budget: ₱{parseFloat(totalBudget).toLocaleString()}
            </span>
            <span
              style={{
                color: remaining < 0 ? "#A32D2D" : "#639922",
                fontWeight: 500,
              }}
            >
              {remaining < 0
                ? `Over by ₱${Math.abs(remaining).toLocaleString()}`
                : `₱${remaining.toLocaleString()} unallocated`}
            </span>
          </div>

          {/* Category inputs */}
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "320px" }}
          >
            {categories.map((cat) => (
              <div
                key={cat.category_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "#fafafa", border: "0.5px solid #ebebeb" }}
              >
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 10, height: 10, background: cat.color }}
                />
                <span className="text-sm flex-1" style={{ color: "#1a1a2e" }}>
                  {cat.category_label}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: "#999" }}>
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={cat.allocated || ""}
                    onChange={(e) =>
                      updateCategory(cat.category_id, e.target.value)
                    }
                    className="text-sm outline-none text-right"
                    style={{
                      width: "80px",
                      border: "none",
                      background: "transparent",
                      fontFamily: "inherit",
                      color: "#1a1a2e",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "#f5f4f0",
                border: "0.5px solid #ebebeb",
                color: "#666",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || remaining < 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{
                background: loading || remaining < 0 ? "#ccc" : "#1a1a2e",
                border: "none",
                cursor: loading || remaining < 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Saving..." : "Save budget"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
