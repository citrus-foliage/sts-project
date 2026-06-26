import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Nudge Bar ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
        style={{
          background: "rgba(99,153,34,0.08)",
          border: "0.5px solid rgba(99,153,34,0.18)",
        }}
      >
        <span style={{ fontSize: "16px" }}>👋</span>
        <p style={{ color: "#3B6D11", flex: 1 }}>
          <strong>Welcome to Student Life Manager.</strong> Start by setting up
          your budget or adding your first task.
        </p>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#639922",
            fontSize: "16px",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          Good day, <span style={{ color: "#4f8ef7" }}>{firstName}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Here&apos;s an overview of your student life today.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      {/* 2 columns on mobile, 4 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Pending Tasks",
            value: "—",
            sub: "No tasks added yet",
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <polyline points="3 6 4 7 6 5" />
                <polyline points="3 12 4 13 6 11" />
                <polyline points="3 18 4 19 6 17" />
              </svg>
            ),
          },
          {
            label: "Available Balance",
            value: "—",
            sub: "Set up your budget",
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                <circle cx="16" cy="12" r="1" fill="currentColor" />
              </svg>
            ),
          },
          {
            label: "Daily Allowance",
            value: "—",
            sub: "Configure daily budget",
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="16" y2="10" />
              </svg>
            ),
          },
          {
            label: "Activity Streak",
            value: "0d",
            sub: "Log in daily to build streak",
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            ),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
            }}
          >
            <div
              className="flex items-center gap-1.5 mb-2"
              style={{ color: "#666" }}
            >
              {card.icon}
              <span style={{ fontSize: "11px" }}>{card.label}</span>
            </div>
            <p
              className="font-medium"
              style={{ fontSize: "20px", color: "#1a1a2e" }}
            >
              {card.value}
            </p>
            <p style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main Row ── */}
      {/* Stacked on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* Left — Today's Tasks */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
              Today&apos;s Tasks
            </span>
            <Link
              href="/tasks"
              className="text-xs"
              style={{ color: "#4f8ef7", textDecoration: "none" }}
            >
              View all
            </Link>
          </div>

          {/* Empty state */}
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            style={{ color: "#bbb" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <polyline points="3 6 4 7 6 5" />
              <polyline points="3 12 4 13 6 11" />
              <polyline points="3 18 4 19 6 17" />
            </svg>
            <p style={{ fontSize: "13px", color: "#999" }}>
              No tasks for today
            </p>
            <Link
              href="/tasks"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: "#f5f4f0",
                color: "#666",
                textDecoration: "none",
                border: "0.5px solid #ebebeb",
              }}
            >
              + Add your first task
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Daily Budget Calculator */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-medium"
                style={{ color: "#1a1a2e" }}
              >
                Daily Budget Calculator
              </span>
              <Link
                href="/survival"
                className="text-xs"
                style={{ color: "#4f8ef7", textDecoration: "none" }}
              >
                Set up
              </Link>
            </div>

            {/* Empty state */}
            <div
              className="flex flex-col items-center justify-center py-6 gap-3"
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
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="10" y2="14" />
                <line x1="14" y1="14" x2="16" y2="14" />
              </svg>
              <p
                style={{ fontSize: "12px", color: "#999", textAlign: "center" }}
              >
                Set your balance and allowance date to get started
              </p>
              <Link
                href="/survival"
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "#f5f4f0",
                  color: "#666",
                  textDecoration: "none",
                  border: "0.5px solid #ebebeb",
                }}
              >
                Configure
              </Link>
            </div>
          </div>

          {/* Discussion Hub */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-medium"
                style={{ color: "#1a1a2e" }}
              >
                Discussion Hub
              </span>
              <Link
                href="/forum"
                className="text-xs"
                style={{ color: "#4f8ef7", textDecoration: "none" }}
              >
                Browse
              </Link>
            </div>

            {/* Empty state */}
            <div
              className="flex flex-col items-center justify-center py-6 gap-3"
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p
                style={{ fontSize: "12px", color: "#999", textAlign: "center" }}
              >
                No recent posts yet — be the first to share something
              </p>
              <Link
                href="/forum"
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "#f5f4f0",
                  color: "#666",
                  textDecoration: "none",
                  border: "0.5px solid #ebebeb",
                }}
              >
                Go to Discussion Hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
