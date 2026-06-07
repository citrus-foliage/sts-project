"use client";

import { usePathname } from "next/navigation";

const pageMeta: Record<string, { breadcrumb: string; title: string }> = {
  "/dashboard": { breadcrumb: "Home", title: "Overview" },
  "/tasks": { breadcrumb: "Academics", title: "Task Manager" },
  "/schedule": { breadcrumb: "Academics", title: "Schedule" },
  "/timer": { breadcrumb: "Academics", title: "Focus Timer" },
  "/budget": { breadcrumb: "Finances", title: "Budget Planner" },
  "/survival": { breadcrumb: "Finances", title: "Daily Budget" },
  "/forum": { breadcrumb: "Community", title: "Discussion Hub" },
  "/resources": { breadcrumb: "Community", title: "Student Resources" },
  "/achievements": { breadcrumb: "Profile", title: "Achievements" },
  "/settings": { breadcrumb: "Profile", title: "Settings" },
};

export default function Topbar() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { breadcrumb: "", title: "Overview" };

  return (
    <header
      className="flex items-center gap-3 px-5 py-3.5 sticky top-0 z-10"
      style={{
        background: "#fff",
        borderBottom: "0.5px solid #ebebeb",
        minHeight: "56px",
      }}
    >
      {/* Breadcrumb + Title */}
      <div className="flex flex-col flex-1">
        {meta.breadcrumb && (
          <span
            className="text-xs"
            style={{ color: "#999", marginBottom: "1px" }}
          >
            {meta.breadcrumb}
          </span>
        )}
        <span className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
          {meta.title}
        </span>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        style={{
          background: "#f5f4f0",
          border: "0.5px solid #ebebeb",
          color: "#999",
          width: "180px",
          cursor: "text",
        }}
      >
        <SearchIcon />
        <span>Search anything...</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: "32px",
            height: "32px",
            border: "0.5px solid #ebebeb",
            background: "#fff",
            color: "#666",
            cursor: "pointer",
          }}
        >
          <BellIcon />
        </button>
        <button
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: "32px",
            height: "32px",
            border: "0.5px solid #ebebeb",
            background: "#fff",
            color: "#666",
            cursor: "pointer",
          }}
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
}

const SearchIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const BellIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
