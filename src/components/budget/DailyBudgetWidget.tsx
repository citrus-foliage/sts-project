"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Config = {
  id: string;
  remaining_balance: number;
  next_budget_cycle: string;
};

type Props = {
  compact?: boolean;
};

export default function DailyBudgetWidget({ compact = false }: Props) {
  const [config, setConfig] = useState<Config | null>(null);
  const [budgetBalance, setBudgetBalance] = useState<number | null>(null);
  const [hasBudgetPlan, setHasBudgetPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cycleDate, setCycleDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      // Fetch daily budget config and budget plan in parallel
      const [dailyRes, planRes] = await Promise.all([
        fetch("/api/daily-budget"),
        fetch("/api/budget/plan"),
      ]);

      const [dailyData, planData] = await Promise.all([
        dailyRes.json(),
        planRes.json(),
      ]);

      // Compute remaining balance from Budget Planner
      if (planData.plan) {
        setHasBudgetPlan(true);
        const totalSpent = (planData.plan.transactions ?? [])
          .filter((t: { type: string }) => t.type === "expense")
          .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
        const remaining = planData.plan.total_budget - totalSpent;
        setBudgetBalance(remaining);
      } else {
        setHasBudgetPlan(false);
      }

      // Load existing cycle date config
      if (dailyData.config) {
        setConfig(dailyData.config);
        setCycleDate(dailyData.config.next_budget_cycle);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!cycleDate) {
      setError("Please set your next allowance or payday date");
      return;
    }
    if (budgetBalance === null) {
      setError("Set up your Budget Planner first to get your balance");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/daily-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remaining_balance: budgetBalance,
          next_budget_cycle: cycleDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfig(data.config);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Computed values
  // Always use live budget balance instead of stored one
  const effectiveBalance = budgetBalance ?? config?.remaining_balance ?? null;

  const computeDailyAllowance = () => {
    if (!effectiveBalance || !config?.next_budget_cycle) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cycle = new Date(config.next_budget_cycle);
    cycle.setHours(0, 0, 0, 0);
    const diffMs = cycle.getTime() - today.getTime();
    const daysLeft = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
    const daily = effectiveBalance / daysLeft;
    return { daily, daysLeft };
  };

  const computed = computeDailyAllowance();

  const isCycleExpired =
    !!config?.next_budget_cycle &&
    new Date(config.next_budget_cycle) < new Date(new Date().toDateString());

  // Suggest same day next month as the new cycle date
  const suggestedNextCycle = (() => {
    if (!config?.next_budget_cycle) return "";
    const prev = new Date(config.next_budget_cycle);
    const next = new Date(
      prev.getFullYear(),
      prev.getMonth() + 1,
      prev.getDate(),
    );
    return next.toISOString().slice(0, 10);
  })();

  const formatCycleDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const getStatusColor = () => {
    if (!computed) return "#999";
    if (computed.daily < 100) return "#A32D2D";
    if (computed.daily < 200) return "#BA7517";
    return "#639922";
  };

  const getStatusLabel = () => {
    if (!computed) return "";
    if (computed.daily < 100) return "Very tight — spend carefully";
    if (computed.daily < 200) return "Moderate — watch your spending";
    return "You are on track";
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          background: "#fff",
          border: "0.5px solid #ebebeb",
          height: compact ? "120px" : "200px",
        }}
      >
        <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  // No budget plan yet
  if (!hasBudgetPlan) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
          Daily Budget Calculator
        </p>
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{
            background: "rgba(79,142,247,0.05)",
            border: "0.5px solid rgba(79,142,247,0.15)",
          }}
        >
          <p className="text-xs" style={{ color: "#4f8ef7", lineHeight: 1.6 }}>
            This calculator pulls your remaining balance automatically from your
            Budget Planner. Set up your budget first to get started.
          </p>
          <Link
            href="/budget"
            className="text-xs px-3 py-2 rounded-lg text-center font-medium"
            style={{
              background: "#4f8ef7",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Set up Budget Planner →
          </Link>
        </div>
      </div>
    );
  }

  // Setup / Edit Form
  if (!config || editing) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            {editing ? "Update Daily Budget" : "Set Up Daily Budget Calculator"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#666" }}>
            Your remaining balance is pulled automatically from your Budget
            Planner. Just set your next allowance or payday date.
          </p>
        </div>

        {/* Balance pulled from Budget Planner — read only */}
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{
            background: "rgba(99,153,34,0.06)",
            border: "0.5px solid rgba(99,153,34,0.18)",
          }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: "#639922" }}>
              Remaining balance
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#888" }}>
              Pulled from Budget Planner
            </p>
          </div>
          <p
            className="text-sm font-semibold"
            style={{ color: "#1a1a2e", fontFamily: "monospace" }}
          >
            ₱
            {budgetBalance?.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "#555" }}>
            Next allowance or payday
          </label>
          <input
            type="date"
            value={cycleDate}
            onChange={(e) => setCycleDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid #e5e5e5",
              background: "#fafafa",
              fontFamily: "inherit",
            }}
          />
        </div>

        {error && (
          <p className="text-xs" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{
                background: "#f5f4f0",
                border: "0.5px solid #ebebeb",
                color: "#666",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background: saving ? "#ccc" : "#1a1a2e",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {saving ? "Saving..." : "Calculate"}
          </button>
        </div>
      </div>
    );
  }

  // Result display
  return (
    <div
      className="rounded-2xl flex flex-col gap-4"
      style={{
        background: "#fff",
        border: "0.5px solid #ebebeb",
        padding: compact ? "16px" : "24px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Daily Budget Calculator
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#999" }}>
            Until {formatCycleDate(config.next_budget_cycle)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs px-2.5 py-1.5 rounded-lg"
          style={{
            background: "#f5f4f0",
            border: "0.5px solid #ebebeb",
            color: "#666",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Update
        </button>
      </div>

      {/* Stale cycle warning */}
      {isCycleExpired && (
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{
            background: "rgba(186,117,23,0.06)",
            border: "0.5px solid rgba(186,117,23,0.2)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BA7517"
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: "1px" }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: "#BA7517" }}>
              Your budget cycle has ended
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "#666", lineHeight: 1.5 }}
            >
              Update your deadline to keep your daily limit accurate.
            </p>
            <button
              type="button"
              onClick={() => {
                setCycleDate(suggestedNextCycle);
                setEditing(true);
              }}
              className="text-xs mt-1.5 px-2.5 py-1 rounded-lg font-medium"
              style={{
                background: "rgba(186,117,23,0.1)",
                border: "0.5px solid rgba(186,117,23,0.25)",
                color: "#BA7517",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Update deadline →
            </button>
          </div>
        </div>
      )}

      {/* Main result */}
      <div className="flex flex-col items-center gap-2 py-2">
        <p
          className="font-semibold"
          style={{
            fontSize: compact ? "36px" : "48px",
            color: getStatusColor(),
            fontFamily: "monospace",
            lineHeight: 1,
          }}
        >
          ₱{computed?.daily.toFixed(2)}
        </p>
        <p className="text-xs" style={{ color: "#999" }}>
          recommended daily spend
        </p>
      </div>

      {/* Status badge */}
      <div
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
        style={{
          background: `${getStatusColor()}12`,
          border: `0.5px solid ${getStatusColor()}30`,
          color: getStatusColor(),
        }}
      >
        {getStatusLabel()}
      </div>

      {/* Breakdown */}
      {!compact && (
        <div
          className="flex flex-col gap-2 rounded-xl p-4"
          style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
        >
          <div className="flex justify-between text-xs">
            <span style={{ color: "#666" }}>Remaining balance</span>
            <span
              style={{
                color: "#1a1a2e",
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              ₱
              {effectiveBalance?.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#666" }}>Source</span>
            <span style={{ color: "#639922", fontWeight: 500 }}>
              Budget Planner
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#666" }}>Days remaining</span>
            <span
              style={{
                color: "#1a1a2e",
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              {computed?.daysLeft} {computed?.daysLeft === 1 ? "day" : "days"}
            </span>
          </div>
          <div
            className="flex justify-between text-xs pt-2"
            style={{ borderTop: "0.5px solid #ebebeb" }}
          >
            <span style={{ color: "#666" }}>Next budget cycle</span>
            <span style={{ color: "#1a1a2e", fontWeight: 500 }}>
              {formatCycleDate(config.next_budget_cycle)}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs" style={{ color: "#999" }}>
          <span>Budget cycle progress</span>
          <span>{computed?.daysLeft} days left</span>
        </div>
        <div
          className="rounded-full overflow-hidden"
          style={{ height: "6px", background: "#f0eff0" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(
                100 - ((computed?.daysLeft ?? 0) / 30) * 100,
                100,
              )}%`,
              background: getStatusColor(),
            }}
          />
        </div>
      </div>
    </div>
  );
}
