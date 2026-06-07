"use client";

import { useState } from "react";

type Transaction = {
  id: string;
  category_id: string;
  label: string;
  amount: number;
  type: "expense" | "income";
  date: string;
  note?: string;
};

type Category = {
  category_id: string;
  category_label: string;
  color: string;
};

type Props = {
  transactions: Transaction[];
  categories: Category[];
  planId: string;
  onTransactionAdded: () => void;
  onTransactionDeleted: (id: string) => void;
};

export default function TransactionLog({
  transactions,
  categories,
  planId,
  onTransactionAdded,
  onTransactionDeleted,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories[0]?.category_id ?? "",
  );
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const handleAddTransaction = async () => {
    if (!label || !amount || !categoryId) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/budget/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          category_id: categoryId,
          label,
          amount: parseFloat(amount),
          type,
          date,
          note: note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLabel("");
      setAmount("");
      setNote("");
      setShowForm(false);
      onTransactionAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/budget/transactions?id=${id}`, { method: "DELETE" });
      onTransactionDeleted(id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Group transactions by date
  const grouped = transactions
    .filter((t) => activeFilter === "all" || t.category_id === activeFilter)
    .reduce(
      (acc, t) => {
        const key = t.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );

  const getCategoryColor = (id: string) =>
    categories.find((c) => c.category_id === id)?.color ?? "#999";

  const getCategoryLabel = (id: string) =>
    categories.find((c) => c.category_id === id)?.category_label ?? id;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return d.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "0.5px solid #ebebeb" }}
      >
        <span
          className="text-sm font-medium flex-1"
          style={{ color: "#1a1a2e" }}
        >
          Transactions
        </span>

        {/* Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="px-2.5 py-1 rounded-full text-xs flex-shrink-0"
            style={{
              background:
                activeFilter === "all" ? "rgba(79,142,247,0.1)" : "#f5f4f0",
              color: activeFilter === "all" ? "#4f8ef7" : "#666",
              border: `0.5px solid ${activeFilter === "all" ? "rgba(79,142,247,0.3)" : "#ebebeb"}`,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            All
          </button>
          {categories.slice(0, 3).map((cat) => (
            <button
              type="button"
              key={cat.category_id}
              onClick={() => setActiveFilter(cat.category_id)}
              className="px-2.5 py-1 rounded-full text-xs flex-shrink-0"
              style={{
                background:
                  activeFilter === cat.category_id
                    ? `${cat.color}18`
                    : "#f5f4f0",
                color: activeFilter === cat.category_id ? cat.color : "#666",
                border: `0.5px solid ${
                  activeFilter === cat.category_id
                    ? `${cat.color}44`
                    : "#ebebeb"
                }`,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {cat.category_label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0"
          style={{
            background: "#1a1a2e",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <div
          className="flex flex-col gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "0.5px solid #ebebeb", background: "#fafafa" }}
        >
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#555" }}>
                Label *
              </label>
              <input
                type="text"
                placeholder="e.g. Morning meal"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#555" }}>
                Amount (₱) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#555" }}>
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#555" }}>
                Type
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "expense" | "income")
                }
                className="px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "#555" }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
          {error && (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg text-xs"
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
            <button
              type="button"
              onClick={handleAddTransaction}
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
              style={{
                background: loading ? "#ccc" : "#1a1a2e",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Saving..." : "Save transaction"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {Object.keys(grouped).length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-16"
            style={{ color: "#bbb" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <circle cx="16" cy="12" r="1" fill="currentColor" />
            </svg>
            <p style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>
              No transactions yet — click Add to log your first expense
            </p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([dateKey, txns]) => (
              <div key={dateKey} className="mb-4">
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: "#999", letterSpacing: "0.06em" }}
                >
                  {formatDate(dateKey)}
                </p>
                {txns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 group"
                    style={{ background: "#f5f4f0" }}
                  >
                    {/* Category dot */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${getCategoryColor(txn.category_id)}18`,
                      }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: getCategoryColor(txn.category_id),
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "#1a1a2e" }}
                      >
                        {txn.label}
                      </p>
                      <p className="text-xs" style={{ color: "#999" }}>
                        {getCategoryLabel(txn.category_id)}
                      </p>
                    </div>
                    {/* Amount */}
                    <p
                      className="text-sm font-medium flex-shrink-0"
                      style={{
                        color: txn.type === "income" ? "#639922" : "#1a1a2e",
                        fontFamily: "monospace",
                      }}
                    >
                      {txn.type === "income" ? "+" : "-"}₱
                      {txn.amount.toLocaleString()}
                    </p>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(txn.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#999",
                        padding: "2px",
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
