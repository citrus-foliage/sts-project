"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ModLog = {
  id: string;
  mod_id: string;
  mod_display_name: string | null;
  target_user_id: string | null;
  target_display_name: string | null;
  target_post_id: string | null;
  action: string;
  violated_rules: number[] | null;
  generated_message: string | null;
  note: string | null;
  created_at: string;
};

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  remove: { label: "Removed", color: "#A32D2D", bg: "rgba(163,45,45,0.08)" },
  restore: { label: "Restored", color: "#639922", bg: "rgba(99,153,34,0.08)" },
  approve: { label: "Approved", color: "#639922", bg: "rgba(99,153,34,0.08)" },
  warn: { label: "Warned", color: "#BA7517", bg: "rgba(186,117,23,0.08)" },
  timeout: { label: "Timeout", color: "#D85A30", bg: "rgba(216,90,48,0.08)" },
  ban: { label: "Banned", color: "#A32D2D", bg: "rgba(163,45,45,0.08)" },
  unban: { label: "Unbanned", color: "#639922", bg: "rgba(99,153,34,0.08)" },
  pin: { label: "Pinned", color: "#4f8ef7", bg: "rgba(79,142,247,0.08)" },
  unpin: { label: "Unpinned", color: "#666", bg: "#f5f4f0" },
  lock: { label: "Locked", color: "#BA7517", bg: "rgba(186,117,23,0.08)" },
  unlock: { label: "Unlocked", color: "#639922", bg: "rgba(99,153,34,0.08)" },
};

// Maps each action to a proper past-tense verb for the sentence
const ACTION_VERB: Record<string, string> = {
  remove: "removed",
  restore: "restored",
  approve: "approved",
  warn: "warned",
  timeout: "timed out",
  ban: "banned",
  unban: "unbanned",
  pin: "pinned",
  unpin: "unpinned",
  lock: "locked",
  unlock: "unlocked",
};

import { FORUM_RULES } from "@/types/forum";

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ModLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const LIMIT = 30;

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isAdmin) router.replace("/dashboard");
        else setAdminRole(d.role);
      });
  }, [router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter !== "all") params.set("action", actionFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    if (adminRole) fetchLogs();
  }, [fetchLogs, adminRole]);

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatEmail = (email: string) => email.split("@")[0];

  const totalPages = Math.ceil(total / LIMIT);

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
            Mod Logs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#666" }}>
            {total} action{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {/* Action filter */}
      <div
        className="flex flex-wrap rounded-xl p-1 gap-0.5"
        style={{
          background: "#fff",
          border: "0.5px solid #ebebeb",
          width: "fit-content",
        }}
      >
        {[
          "all",
          "remove",
          "restore",
          "approve",
          "warn",
          "timeout",
          "ban",
          "unban",
          "pin",
          "lock",
          "unlock",
        ].map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setActionFilter(a);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
            style={{
              background: actionFilter === a ? "#f5f4f0" : "transparent",
              color: actionFilter === a ? "#1a1a2e" : "#999",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {a === "all" ? "All" : (ACTION_CONFIG[a]?.label ?? a)}
          </button>
        ))}
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p style={{ fontSize: "13px", color: "#999" }}>
            No actions logged yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => {
            const actionConfig = ACTION_CONFIG[log.action] ?? {
              label: log.action,
              color: "#666",
              bg: "#f5f4f0",
            };
            const isExpanded = expanded === log.id;

            return (
              <div
                key={log.id}
                className="rounded-2xl px-5 py-4 flex flex-col gap-2"
                style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Action badge */}
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: actionConfig.bg,
                      color: actionConfig.color,
                    }}
                  >
                    {actionConfig.label}
                  </span>

                  {/* Mod → target */}
                  <span className="text-xs flex-1" style={{ color: "#666" }}>
                    <span style={{ color: "#1a1a2e", fontWeight: 500 }}>
                      {log.mod_display_name ?? formatEmail(log.mod_id)}
                    </span>{" "}
                    {ACTION_VERB[log.action] ?? log.action}{" "}
                    {log.target_user_id ? (
                      <span style={{ color: "#1a1a2e", fontWeight: 500 }}>
                        {log.target_display_name ??
                          formatEmail(log.target_user_id)}
                      </span>
                    ) : (
                      <span style={{ color: "#bbb" }}>deleted user</span>
                    )}
                    {"'s "}
                    {log.target_post_id && (
                      <span style={{ color: "#999" }}>post</span>
                    )}
                  </span>

                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "#bbb" }}
                  >
                    {formatTime(log.created_at)}
                  </span>

                  {/* Expand if there's extra detail */}
                  {(log.violated_rules?.length ||
                    log.generated_message ||
                    log.note) && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#bbb",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="flex flex-col gap-2 pt-1">
                    {log.violated_rules && log.violated_rules.length > 0 && (
                      <div
                        className="rounded-xl px-3 py-2.5 text-xs"
                        style={{
                          background: "#f5f4f0",
                          border: "0.5px solid #ebebeb",
                        }}
                      >
                        <p
                          className="font-medium mb-1.5"
                          style={{ color: "#555" }}
                        >
                          Violated rules:
                        </p>
                        <ul className="flex flex-col gap-1">
                          {log.violated_rules.map((i) => (
                            <li
                              key={i}
                              style={{ color: "#666", lineHeight: 1.5 }}
                            >
                              <strong style={{ color: "#1a1a2e" }}>
                                Rule {i + 1}:
                              </strong>{" "}
                              {FORUM_RULES[i]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {log.generated_message && (
                      <div
                        className="rounded-xl px-3 py-2.5 text-xs"
                        style={{
                          background: "rgba(163,45,45,0.04)",
                          border: "0.5px solid rgba(163,45,45,0.12)",
                          color: "#666",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <p
                          className="font-medium mb-1"
                          style={{ color: "#A32D2D" }}
                        >
                          Generated removal message:
                        </p>
                        {log.generated_message}
                      </div>
                    )}
                    {log.note && (
                      <div
                        className="rounded-xl px-3 py-2.5 text-xs"
                        style={{
                          background: "#f5f4f0",
                          border: "0.5px solid #ebebeb",
                          color: "#666",
                        }}
                      >
                        <span className="font-medium" style={{ color: "#555" }}>
                          Mod note:{" "}
                        </span>
                        {log.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: page === 1 ? "#ccc" : "#666",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: "#999" }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: page === totalPages ? "#ccc" : "#666",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
