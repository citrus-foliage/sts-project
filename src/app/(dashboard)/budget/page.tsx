"use client";

import { useState, useEffect, useCallback } from "react";
import BudgetSetup from "@/components/budget/BudgetSetup";
import CategoryList from "@/components/budget/CategoryList";
import DonutChart from "@/components/budget/DonutChart";
import DailyBudgetWidget from "@/components/budget/DailyBudgetWidget";
import TransactionLog from "@/components/budget/TransactionLog";
import FeatureHidden from "@/components/layout/FeatureHidden";
import BudgetHistory from "@/components/budget/BudgetHistory";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSettings } from "@/contexts/SettingsContext";

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

type CarryOverResult = {
  success?: boolean;
  skipped?: boolean;
  overspent?: boolean;
  overspent_amount?: number;
  carried_over?: number;
  last_month_label?: string;
};

function BudgetSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton style={{ width: "90px", height: "12px" }} />
          <Skeleton style={{ width: "180px", height: "16px" }} />
        </div>
        <Skeleton
          style={{ width: "90px", height: "30px", borderRadius: "8px" }}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex gap-4"
        style={{ borderBottom: "0.5px solid #ebebeb" }}
      >
        <Skeleton
          style={{ width: "80px", height: "16px", marginBottom: "10px" }}
        />
        <Skeleton
          style={{ width: "60px", height: "16px", marginBottom: "10px" }}
        />
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl p-4 flex items-center justify-center"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              height: "220px",
            }}
          >
            <Skeleton
              style={{ width: "140px", height: "140px", borderRadius: "50%" }}
            />
          </div>
          <Skeleton
            style={{ width: "100%", height: "48px", borderRadius: "12px" }}
          />
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              minHeight: "300px",
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ width: "100%", height: "40px" }} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="flex gap-4 rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            border: "0.5px solid #ebebeb",
            minHeight: "600px",
          }}
        >
          {/* Left — donut + categories */}
          <div
            className="p-5 flex flex-col items-center gap-4"
            style={{
              width: "300px",
              minWidth: "300px",
              borderRight: "0.5px solid #ebebeb",
            }}
          >
            <Skeleton
              style={{ width: "160px", height: "160px", borderRadius: "50%" }}
            />
            <div className="flex flex-col gap-2 w-full">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ width: "100%", height: "28px" }} />
              ))}
            </div>
          </div>
          {/* Right — transaction log */}
          <div className="flex-1 p-5 flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ width: "100%", height: "44px" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [carryOver, setCarryOver] = useState<CarryOverResult | null>(null);
  const [carryOverLoading, setCarryOverLoading] = useState(false);
  const [carryOverAttempted, setCarryOverAttempted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Feature visibility now comes from the shared SettingsContext (fetched
  // once per session in the layout) instead of a page-local fetch.
  const { settings, loading: checkingFeature } = useSettings();
  const showFeature = settings.show_budget !== false;

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

  const tryCarryOver = useCallback(async () => {
    setCarryOverAttempted(true);
    setCarryOverLoading(true);
    try {
      const res = await fetch("/api/budget/carry-over", { method: "POST" });
      const data: CarryOverResult = await res.json();
      if (data.success) {
        setCarryOver(data);
        await fetchPlan();
      }
      // If skipped (no previous plan or already exists), just show setup
    } catch (err) {
      console.error("Carry-over error:", err);
    } finally {
      setCarryOverLoading(false);
    }
  }, [fetchPlan]);

  useEffect(() => {
    const init = async () => {
      await fetchPlan();
    };
    init();
  }, [fetchPlan]);

  useEffect(() => {
    if (
      !loading &&
      !plan &&
      !carryOverLoading &&
      !carryOverAttempted &&
      !isEditing
    ) {
      tryCarryOver();
    }
  }, [
    loading,
    plan,
    carryOverLoading,
    carryOverAttempted,
    isEditing,
    tryCarryOver,
  ]);

  const handleTransactionAdded = () => {
    fetchPlan();
    setRefreshKey((k) => k + 1);
  };

  const handleTransactionDeleted = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    fetchPlan();
    setRefreshKey((k) => k + 1);
  };

  const currentMonth = new Date().toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  if (checkingFeature) {
    return <BudgetSkeleton isMobile={isMobile} />;
  }

  if (!showFeature) {
    return <FeatureHidden featureName="Budget Planner" />;
  }

  if (loading || carryOverLoading) {
    return <BudgetSkeleton isMobile={isMobile} />;
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
            setCarryOverAttempted(false);
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

      {/* Tabs */}
      <div
        className="flex gap-1"
        style={{ borderBottom: "0.5px solid #ebebeb" }}
      >
        {(["current", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm"
            style={{
              border: "none",
              background: "transparent",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#1a1a2e" : "#888",
              cursor: "pointer",
              fontFamily: "inherit",
              borderBottom:
                activeTab === tab
                  ? "2px solid #1a1a2e"
                  : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s",
            }}
          >
            {tab === "current" ? "This Month" : "History"}
          </button>
        ))}
      </div>

      {/* History tab */}
      {activeTab === "history" ? (
        <BudgetHistory />
      ) : isMobile ? (
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
              overspentAmount={
                carryOver?.overspent ? carryOver.overspent_amount : undefined
              }
              overspentMonthLabel={
                carryOver?.overspent ? carryOver.last_month_label : undefined
              }
            />
          </div>
        </div>
      ) : (
        /* Desktop: side-by-side layout */
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
              overspentAmount={
                carryOver?.overspent ? carryOver.overspent_amount : undefined
              }
              overspentMonthLabel={
                carryOver?.overspent ? carryOver.last_month_label : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Daily Budget Widget */}
      {activeTab === "current" && (
        <DailyBudgetWidget compact={true} refreshKey={refreshKey} />
      )}
    </div>
  );
}
