"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UserStanding = {
  status: "good" | "warned" | "timeout" | "banned";
  timeout_until: string | null;
  ban_reason: string | null;
  actioned_by: string | null;
  updated_at?: string;
};

type AdminUser = {
  user_id: string;
  display_name: string | null;
  created_at: string;
  post_count: number;
  admin_role: string | null;
  standing: UserStanding;
};

type ActionModal = {
  user: AdminUser;
  type: "warn" | "timeout" | "ban" | "unban";
} | null;

const STANDING_CONFIG = {
  good: {
    label: "Good standing",
    color: "#639922",
    bg: "rgba(99,153,34,0.08)",
  },
  warned: { label: "Warned", color: "#BA7517", bg: "rgba(186,117,23,0.08)" },
  timeout: { label: "Timed out", color: "#D85A30", bg: "rgba(216,90,48,0.08)" },
  banned: { label: "Banned", color: "#A32D2D", bg: "rgba(163,45,45,0.08)" },
};

function UsersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [timeoutDays, setTimeoutDays] = useState(1);
  const [banReason, setBanReason] = useState("");
  const [modNote, setModNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isAdmin) router.replace("/dashboard");
        else setAdminRole(d.role);
      });
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (adminRole) fetchUsers();
  }, [fetchUsers, adminRole]);

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        action: actionModal.type,
        note: modNote || undefined,
      };
      if (actionModal.type === "timeout") body.timeout_days = timeoutDays;
      if (actionModal.type === "ban") body.ban_reason = banReason || undefined;

      await fetch(
        `/api/admin/users/${encodeURIComponent(actionModal.user.user_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      setActionModal(null);
      setTimeoutDays(1);
      setBanReason("");
      setModNote("");
      fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const formatEmail = (email: string) => {
    const [local] = email.split("@");
    return local;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isTimeoutExpired = (until: string | null) => {
    if (!until) return false;
    return new Date(until) < new Date();
  };

  if (!adminRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>
          Checking permissions...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
            padding: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666" }}>
            {users.length} users · manage standing and access
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex rounded-xl p-1 gap-0.5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          {(["all", "good", "warned", "timeout", "banned"] as const).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                style={{
                  background: statusFilter === s ? "#f5f4f0" : "transparent",
                  color: statusFilter === s ? "#1a1a2e" : "#999",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s === "all" ? "All" : STANDING_CONFIG[s].label}
              </button>
            ),
          )}
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
          style={{
            background: "#fff",
            border: "0.5px solid #ebebeb",
            minWidth: "200px",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by email or display name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs outline-none"
            style={{
              border: "none",
              background: "transparent",
              fontFamily: "inherit",
              color: "#1a1a2e",
            }}
          />
        </div>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p style={{ fontSize: "13px", color: "#999" }}>No users found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => {
            const standing = user.standing;
            const standingConfig = STANDING_CONFIG[standing.status];
            const timeoutExpired =
              standing.status === "timeout" &&
              isTimeoutExpired(standing.timeout_until);

            return (
              <div
                key={user.user_id}
                className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{
                    background: "#4f8ef7",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {user.user_id.charAt(0).toUpperCase()}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#1a1a2e" }}
                    >
                      {user.display_name ?? formatEmail(user.user_id)}
                    </span>
                    {user.admin_role && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "rgba(79,142,247,0.1)",
                          color: "#4f8ef7",
                        }}
                      >
                        {user.admin_role === "super_admin"
                          ? "Super Admin"
                          : "Moderator"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                    {user.user_id} · {user.post_count} post
                    {user.post_count !== 1 ? "s" : ""}
                  </p>
                  {standing.status === "timeout" && standing.timeout_until && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: timeoutExpired ? "#999" : "#D85A30" }}
                    >
                      {timeoutExpired
                        ? "Timeout expired"
                        : `Timed out until ${formatDate(standing.timeout_until)}`}
                    </p>
                  )}
                  {standing.status === "banned" && standing.ban_reason && (
                    <p className="text-xs mt-0.5" style={{ color: "#A32D2D" }}>
                      Ban reason: {standing.ban_reason}
                    </p>
                  )}
                </div>

                {/* Standing badge */}
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                  style={{
                    background: standingConfig.bg,
                    color: standingConfig.color,
                  }}
                >
                  {standingConfig.label}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {standing.status === "good" || timeoutExpired ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionModal({ user, type: "warn" })}
                        className="text-xs px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(186,117,23,0.08)",
                          border: "0.5px solid rgba(186,117,23,0.2)",
                          color: "#BA7517",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Warn
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({ user, type: "timeout" })
                        }
                        className="text-xs px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(216,90,48,0.08)",
                          border: "0.5px solid rgba(216,90,48,0.2)",
                          color: "#D85A30",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Timeout
                      </button>
                      {adminRole === "super_admin" && !user.admin_role && (
                        <button
                          type="button"
                          onClick={() => setActionModal({ user, type: "ban" })}
                          className="text-xs px-2.5 py-1.5 rounded-lg"
                          style={{
                            background: "rgba(163,45,45,0.08)",
                            border: "0.5px solid rgba(163,45,45,0.2)",
                            color: "#A32D2D",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Ban
                        </button>
                      )}
                    </>
                  ) : standing.status === "warned" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActionModal({ user, type: "timeout" })
                        }
                        className="text-xs px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(216,90,48,0.08)",
                          border: "0.5px solid rgba(216,90,48,0.2)",
                          color: "#D85A30",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Timeout
                      </button>
                      {adminRole === "super_admin" && !user.admin_role && (
                        <button
                          type="button"
                          onClick={() => setActionModal({ user, type: "ban" })}
                          className="text-xs px-2.5 py-1.5 rounded-lg"
                          style={{
                            background: "rgba(163,45,45,0.08)",
                            border: "0.5px solid rgba(163,45,45,0.2)",
                            color: "#A32D2D",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Ban
                        </button>
                      )}
                    </>
                  ) : standing.status === "banned" &&
                    adminRole === "super_admin" ? (
                    <button
                      type="button"
                      onClick={() => setActionModal({ user, type: "unban" })}
                      className="text-xs px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(99,153,34,0.08)",
                        border: "0.5px solid rgba(99,153,34,0.2)",
                        color: "#639922",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Unban
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <>
          <div
            onClick={() => {
              setActionModal(null);
              setTimeoutDays(1);
              setBanReason("");
              setModNote("");
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              background: "#fff",
              borderRadius: "20px",
              padding: "28px",
              width: "420px",
              maxWidth: "92vw",
              boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            }}
          >
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#1a1a2e" }}
            >
              {actionModal.type === "warn" && "Warn user"}
              {actionModal.type === "timeout" && "Timeout user"}
              {actionModal.type === "ban" && "Ban user"}
              {actionModal.type === "unban" && "Unban user"}
            </p>
            <p className="text-xs mb-4" style={{ color: "#666" }}>
              {actionModal.user.display_name ?? actionModal.user.user_id}
            </p>

            {/* Timeout days selector */}
            {actionModal.type === "timeout" && (
              <div className="flex flex-col gap-1.5 mb-4">
                <label
                  className="text-xs font-medium"
                  style={{ color: "#555" }}
                >
                  Duration
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTimeoutDays(d)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: timeoutDays === d ? "#1a1a2e" : "#f5f4f0",
                        color: timeoutDays === d ? "#fff" : "#666",
                        border: "0.5px solid #ebebeb",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {d} day{d !== 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ban reason */}
            {actionModal.type === "ban" && (
              <div className="flex flex-col gap-1.5 mb-4">
                <label
                  className="text-xs font-medium"
                  style={{ color: "#555" }}
                >
                  Ban reason
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Repeated harassment after multiple warnings"
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{
                    border: "1px solid #e5e5e5",
                    background: "#fafafa",
                    fontFamily: "inherit",
                    color: "#1a1a2e",
                  }}
                />
              </div>
            )}

            {/* Mod note */}
            {actionModal.type !== "unban" && (
              <div className="flex flex-col gap-1.5 mb-5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "#555" }}
                >
                  Internal note{" "}
                  <span style={{ color: "#bbb", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  rows={2}
                  placeholder="Add context for the audit log..."
                  className="px-3 py-2 rounded-xl text-xs outline-none resize-none"
                  style={{
                    border: "1px solid #e5e5e5",
                    background: "#fafafa",
                    fontFamily: "inherit",
                    color: "#1a1a2e",
                  }}
                />
              </div>
            )}

            {actionModal.type === "unban" && (
              <p
                className="text-xs mb-5"
                style={{ color: "#666", lineHeight: 1.6 }}
              >
                This will restore the user's standing to good and allow them to
                post again.
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setTimeoutDays(1);
                  setBanReason("");
                  setModNote("");
                }}
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
              <button
                type="button"
                disabled={submitting}
                onClick={handleAction}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: submitting
                    ? "#ccc"
                    : actionModal.type === "unban"
                      ? "#639922"
                      : actionModal.type === "warn"
                        ? "#BA7517"
                        : "#A32D2D",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Saving..." : `Confirm ${actionModal.type}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
        </div>
      }
    >
      <UsersPageInner />
    </Suspense>
  );
}
