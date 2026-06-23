"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Icons
function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ChecklistIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  );
}
function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function CalcIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="10" y2="18" />
      <line x1="14" y1="18" x2="16" y2="18" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="8 18 12 22 16 18" />
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Panel toggle icon — shows sidebar open/closed state
function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {/* Outer border */}
      <rect x="3" y="3" width="18" height="18" rx="2" />
      {/* Left panel divider */}
      <line x1="9" y1="3" x2="9" y2="21" />
      {/* Arrow inside right panel — points left when expanded, right when collapsed */}
      {collapsed ? (
        // Collapsed: arrow pointing right (expand)
        <polyline points="12 9 16 12 12 15" />
      ) : (
        // Expanded: arrow pointing left (collapse)
        <polyline points="14 9 10 12 14 15" />
      )}
    </svg>
  );
}

const navigation = [
  {
    items: [{ label: "Overview", href: "/dashboard", icon: <GridIcon /> }],
  },
  {
    label: "Academics",
    items: [
      { label: "Task Manager", href: "/tasks", icon: <ChecklistIcon /> },
      { label: "Schedule", href: "/schedule", icon: <CalendarIcon /> },
      { label: "Focus Timer", href: "/timer", icon: <ClockIcon /> },
    ],
  },
  {
    label: "Finances",
    items: [
      { label: "Budget Planner", href: "/budget", icon: <WalletIcon /> },
      { label: "Daily Budget", href: "/survival", icon: <CalcIcon /> },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Discussion Hub", href: "/forum", icon: <ChatIcon /> },
      { label: "Student Resources", href: "/resources", icon: <MapPinIcon /> },
    ],
  },
];

const bottomNav = [
  { label: "Achievements", href: "/achievements", icon: <TrophyIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

const FEATURE_KEYS: Record<string, string> = {
  "/tasks": "show_tasks",
  "/budget": "show_budget",
  "/survival": "show_survival",
  "/schedule": "show_schedule",
  "/timer": "show_timer",
  "/forum": "show_forum",
  "/resources": "show_resources",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);
  const [featureSettings, setFeatureSettings] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setFeatureSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (err) {
      console.error("Sign out error:", err);
      setSigningOut(false);
    }
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";
  const email = session?.user?.email ?? "";
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "SL";

  return (
    <aside
      className="flex flex-col h-screen sticky top-0"
      style={{
        width: collapsed ? "52px" : "220px",
        minWidth: collapsed ? "52px" : "220px",
        transition: "width 0.3s ease, min-width 0.3s ease",
        background: "#0f1117",
        borderRight: "0.5px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Logo + User */}
      <div
        className="px-4 pt-5 pb-2"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
      >
        {/* Top row: logo + panel toggle aligned together */}
        <div
          className="flex items-center mb-3"
          style={{
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {/* Logo mark — hidden when collapsed so toggle centers cleanly */}
          {!collapsed && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
              }}
            >
              SL
            </div>
          )}

          {/* App name — hidden when collapsed */}
          {!collapsed && (
            <span
              className="text-sm font-medium truncate flex-1 ml-2.5"
              style={{ color: "#e8e8ec" }}
            >
              Student Life Manager
            </span>
          )}

          {/* Panel toggle — sole element when collapsed so it centers naturally */}
          <button
            type="button"
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem("sidebar_collapsed", String(next));
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "6px",
              flexShrink: 0,
              width: collapsed ? "100%" : "auto",
              marginLeft: collapsed ? "0" : "4px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.25)")
            }
          >
            <PanelIcon collapsed={collapsed} />
          </button>
        </div>

        {/* User pill */}
        <div
          className="flex items-center gap-2 px-2 py-1"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          {/* Avatar — always visible */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "#4f8ef7", fontSize: "10px", fontWeight: 600 }}
          >
            {initials}
          </div>
          {/* Name + email — hidden when collapsed */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "#c0c0cc" }}
              >
                {firstName}
              </p>
              <p
                className="truncate"
                style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}
              >
                {email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5">
        {navigation.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.label && !collapsed && (
              <p
                className="px-2 mb-1 mt-3 uppercase tracking-widest"
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.08em",
                }}
              >
                {group.label}
              </p>
            )}
            {group.items
              .filter((item) => {
                const key = FEATURE_KEYS[item.href];
                if (!key) return true;
                return featureSettings[key] !== false;
              })
              .map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2 py-1.5 rounded-lg mb-0.5 relative transition-colors`}
                    style={{
                      background: active
                        ? "rgba(79,142,247,0.15)"
                        : "transparent",
                      textDecoration: "none",
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <span
                        className="absolute left-0 rounded-r"
                        style={{
                          width: "3px",
                          height: "16px",
                          background: "#4f8ef7",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: active ? "#4f8ef7" : "rgba(255,255,255,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span
                        className="text-sm flex-1"
                        style={{
                          color: active ? "#e8e8ec" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            {gi < navigation.length - 1 && group.label && (
              <div
                className="mx-2 mt-2"
                style={{
                  height: "0.5px",
                  background: "rgba(255,255,255,0.07)",
                }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div
        className="px-2.5 py-3"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
      >
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2 py-1.5 rounded-lg mb-0.5 transition-colors`}
            style={{ textDecoration: "none" }}
            title={collapsed ? item.label : undefined}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            {!collapsed && (
              <span
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {item.label}
              </span>
            )}
          </Link>
        ))}

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2 py-1.5 rounded-lg w-full mt-1 transition-colors`}
          style={{
            background: "transparent",
            border: "none",
            cursor: signingOut ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            opacity: signingOut ? 0.5 : 1,
            position: "relative",
            zIndex: 10,
          }}
          title={collapsed ? "Sign out" : undefined}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              flexShrink: 0,
            }}
          >
            <LogoutIcon />
          </span>
          {!collapsed && (
            <span
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </span>
          )}
        </button>

        {!collapsed && (
          <p
            className="text-center mt-3"
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.2)",
              fontFamily: "monospace",
            }}
          >
            Group 2 · STS
          </p>
        )}
      </div>
    </aside>
  );
}
