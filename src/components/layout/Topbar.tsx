"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

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
  "/admin": { breadcrumb: "Administration", title: "Moderation" },
  "/admin/users": { breadcrumb: "Administration", title: "User Management" },
  "/admin/logs": { breadcrumb: "Administration", title: "Mod Logs" },
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const meta = pageMeta[pathname] ?? { breadcrumb: "", title: "" };

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Check push support and register service worker
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setPushSupported(true);
      setPushGranted(Notification.permission === "granted");
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const subscribeToPush = async () => {
    if (!pushSupported || pushLoading) return;
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setPushGranted(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setPushLoading(false);
    }
  };

  const handleBellClick = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) await markRead(notif.id);
    if (notif.link) router.push(notif.link);
    setOpen(false);
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const TYPE_ICON: Record<string, string> = {
    forum_reply: "💬",
    announcement: "📣",
    task_due: "✅",
    budget_alert: "💰",
    canvas_due: "📅",
  };

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

      {/* Bell button */}
      <div className="relative">
        <button
          ref={bellRef}
          type="button"
          onClick={handleBellClick}
          className="flex items-center justify-center rounded-lg transition-colors relative"
          style={{
            width: "32px",
            height: "32px",
            border: "0.5px solid #ebebeb",
            background: open ? "#f5f4f0" : "#fff",
            color: "#666",
            cursor: "pointer",
          }}
        >
          <BellIcon />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="absolute flex items-center justify-center text-white font-bold"
              style={{
                top: "-5px",
                right: "-5px",
                minWidth: "16px",
                height: "16px",
                borderRadius: "8px",
                background: "#E24B4A",
                fontSize: "9px",
                padding: "0 3px",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification panel */}
        {open && (
          <div
            ref={panelRef}
            className="absolute right-0 flex flex-col rounded-2xl overflow-hidden"
            style={{
              top: "calc(100% + 8px)",
              width: "340px",
              background: "#fff",
              border: "0.5px solid #ebebeb",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100,
              maxHeight: "480px",
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "0.5px solid #ebebeb" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
                Notifications
              </p>
              <div className="flex items-center gap-2">
                {pushSupported && !pushGranted && (
                  <button
                    type="button"
                    onClick={subscribeToPush}
                    disabled={pushLoading}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: "rgba(79,142,247,0.08)",
                      border: "0.5px solid rgba(79,142,247,0.2)",
                      color: "#4f8ef7",
                      cursor: pushLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {pushLoading ? "..." : "🔔 Enable"}
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#4f8ef7",
                      fontFamily: "inherit",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ccc"
                    strokeWidth="1.5"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p style={{ fontSize: "13px", color: "#999" }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotifClick(notif)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: notif.read ? "#fff" : "rgba(79,142,247,0.04)",
                      borderBottom: "0.5px solid #f5f4f0",
                      cursor: notif.link ? "pointer" : "default",
                      fontFamily: "inherit",
                      border: "none",
                      borderBottomWidth: "0.5px",
                      borderBottomStyle: "solid",
                      borderBottomColor: "#f5f4f0",
                    }}
                  >
                    {/* Type emoji */}
                    <span
                      style={{
                        fontSize: "16px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      {TYPE_ICON[notif.type] ?? "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xs font-medium"
                          style={{ color: "#1a1a2e", lineHeight: 1.4 }}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div
                            className="rounded-full flex-shrink-0 mt-1"
                            style={{
                              width: 6,
                              height: 6,
                              background: "#4f8ef7",
                            }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5 line-clamp-2"
                        style={{ color: "#666", lineHeight: 1.5 }}
                      >
                        {notif.body}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#bbb" }}>
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

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
