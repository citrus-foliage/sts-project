"use client";

import { useState, useEffect, useCallback } from "react";

type Config = {
  id: string;
  remaining_balance: number;
  next_budget_cycle: string;
};

type Props = {
  compact?: boolean; // true = dashboard widget, false = full page
};

export default function DailyBudgetWidget({ compact = false }: Props) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [balance, setBalance] = useState("");
  const [cycleDate, setCycleDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-budget");
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setBalance(data.config.remaining_balance.toString());
        setCycleDate(data.config.next_budget_cycle);
      }
    } catch (err) {
      console.error("Fetch config error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!balance || !cycleDate) {
      setError("Please fill in both fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/daily-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remaining_balance: parseFloat(balance),
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

  // ── Computed values ──
  const computeDailyAllowance = () => {
    if (!config) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cycle = new Date(config.next_budget_cycle);
    cycle.setHours(0, 0, 0, 0);
    const diffMs = cycle.getTime() - today.getTime();
    const daysLeft = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
    const daily = config.remaining_balance / daysLeft;
    return { daily, daysLeft };
  };

  const computed = computeDailyAllowance();

  const formatCycleDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

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

  // ── Setup / Edit Form ──
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
            Enter your remaining balance and next allowance or payday to
            calculate how much you can safely spend each day.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#555" }}>
              Current remaining balance (₱)
            </label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontFamily: "inherit",
              }}
            />
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
      </div>
    );
  }

  // ── Result Display ──
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
            <span style={{ color: "#666" }}>Available balance</span>
            <span
              style={{
                color: "#1a1a2e",
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              ₱{config.remaining_balance.toLocaleString()}
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
