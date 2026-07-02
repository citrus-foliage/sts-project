"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FLAIR_CONFIG, FORUM_RULES, ForumFlair } from "@/types/forum";

type AdminPost = {
  id: string;
  author_id: string;
  real_author_id: string;
  author_display_name: string | null;
  author_standing: string;
  is_anonymous: boolean;
  anon_code: string;
  flair: ForumFlair;
  title: string;
  body: string;
  image_url?: string;
  upvotes: number;
  flag_count: number;
  status: "active" | "pending_review" | "removed";
  is_pinned: boolean;
  is_locked: boolean;
  removed_reason: string | null;
  removed_by: string | null;
  created_at: string;
  comment_count: number;
};

type AdminRole = "moderator" | "super_admin";

type ActionModal = {
  post: AdminPost;
  type: "remove" | "warn_user" | "delete";
} | null;

const STATUS_CONFIG = {
  active: { label: "Active", color: "#639922", bg: "rgba(99,153,34,0.1)" },
  pending_review: {
    label: "Flagged",
    color: "#BA7517",
    bg: "rgba(186,117,23,0.1)",
  },
  removed: { label: "Removed", color: "#A32D2D", bg: "rgba(163,45,45,0.1)" },
};

const STANDING_CONFIG = {
  good: { label: "Good", color: "#639922" },
  warned: { label: "Warned", color: "#BA7517" },
  timeout: { label: "Timeout", color: "#D85A30" },
  banned: { label: "Banned", color: "#A32D2D" },
};

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [selectedRules, setSelectedRules] = useState<number[]>([]);
  const [modNote, setModNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  // Check admin role
  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isAdmin) router.replace("/dashboard");
        else setAdminRole(d.role);
      });
  }, [router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    if (adminRole) fetchPosts();
  }, [fetchPosts, adminRole]);

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatEmail = (email: string) => {
    const [local] = email.split("@");
    return local;
  };

  const handleAction = async (
    postId: string,
    action: string,
    extra?: Record<string, unknown>,
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.generated_message) setGeneratedMessage(data.generated_message);
      else {
        setActionModal(null);
        setSelectedRules([]);
        setModNote("");
        fetchPosts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Permanently delete this post? This cannot be undone."))
      return;
    setSubmitting(true);
    try {
      await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: modNote }),
      });
      setActionModal(null);
      fetchPosts();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRule = (i: number) => {
    setSelectedRules((prev) =>
      prev.includes(i) ? prev.filter((r) => r !== i) : [...prev, i],
    );
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            Mod Queue
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            {adminRole === "super_admin" ? "Super Admin" : "Moderator"} ·{" "}
            {total}{" "}
            {statusFilter === "all" ? "total" : statusFilter.replace("_", " ")}{" "}
            posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: "#666",
              cursor: "pointer",
              fontFamily: "inherit",
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/logs")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: "#666",
              cursor: "pointer",
              fontFamily: "inherit",
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div
          className="flex rounded-xl p-1 gap-0.5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          {(["all", "pending_review", "active", "removed"] as const).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: statusFilter === s ? "#f5f4f0" : "transparent",
                  color: statusFilter === s ? "#1a1a2e" : "#999",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s === "all"
                  ? "All"
                  : s === "pending_review"
                    ? "Flagged"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ),
          )}
        </div>

        {/* Search */}
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
            placeholder="Search by title, content, or author email..."
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

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ccc"
            strokeWidth="1.5"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p style={{ fontSize: "13px", color: "#999" }}>
            No posts in this queue
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => {
            const flairConfig = FLAIR_CONFIG[post.flair] ?? {
              label: post.flair,
              color: "#999",
              bg: "#f5f4f0",
            };
            const statusConfig = STATUS_CONFIG[post.status];
            const standingConfig =
              STANDING_CONFIG[
                post.author_standing as keyof typeof STANDING_CONFIG
              ] ?? STANDING_CONFIG.good;

            return (
              <div
                key={post.id}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: "#fff",
                  border:
                    post.status === "pending_review"
                      ? "0.5px solid rgba(186,117,23,0.4)"
                      : "0.5px solid #ebebeb",
                }}
              >
                {/* Top row: flair + status + flag count */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: flairConfig.bg,
                      color: flairConfig.color,
                    }}
                  >
                    {flairConfig.label}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: statusConfig.bg,
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                  {post.is_pinned && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(79,142,247,0.1)",
                        color: "#4f8ef7",
                      }}
                    >
                      Pinned
                    </span>
                  )}
                  {post.is_locked && (
                    <span
                      className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "#f5f4f0", color: "#666" }}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Locked
                    </span>
                  )}
                  {post.flag_count > 0 && (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(163,45,45,0.08)",
                        color: "#A32D2D",
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      {post.flag_count} flag{post.flag_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "#bbb" }}>
                    {formatTime(post.created_at)}
                  </span>
                </div>

                {/* Author identity — always visible to admins */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "#f5f4f0",
                    border: "0.5px solid #ebebeb",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{
                      background: "#4f8ef7",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {post.real_author_id.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#1a1a2e" }}
                    >
                      {post.author_display_name ??
                        formatEmail(post.real_author_id)}
                    </span>
                    <span className="text-xs" style={{ color: "#999" }}>
                      {post.real_author_id}
                      {post.is_anonymous && (
                        <span style={{ color: "#bbb" }}>
                          {" "}
                          · posted as Anonymous {post.anon_code}
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Standing badge */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{
                      background: `${standingConfig.color}15`,
                      color: standingConfig.color,
                    }}
                  >
                    {standingConfig.label}
                  </span>
                  {/* User actions shortcut */}
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/admin/users?search=${post.real_author_id}`)
                    }
                    className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                    style={{
                      background: "#fff",
                      border: "0.5px solid #ebebeb",
                      color: "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Manage user
                  </button>
                </div>

                {/* Post content */}
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#1a1a2e" }}
                  >
                    {post.title}
                  </p>
                  <p
                    className="text-xs line-clamp-3"
                    style={{ color: "#666", lineHeight: 1.6 }}
                  >
                    {post.body}
                  </p>
                </div>

                {/* Removed reason — shown if removed */}
                {post.status === "removed" && post.removed_reason && (
                  <div
                    className="rounded-xl px-3 py-2.5 text-xs"
                    style={{
                      background: "rgba(163,45,45,0.05)",
                      border: "0.5px solid rgba(163,45,45,0.15)",
                      color: "#A32D2D",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <p className="font-medium mb-1">Removal reason:</p>
                    {post.removed_reason}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => router.push(`/forum/${post.id}`)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: "#f5f4f0",
                      border: "0.5px solid #ebebeb",
                      color: "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View post
                  </button>

                  {post.status !== "removed" && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ post, type: "remove" })}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(163,45,45,0.08)",
                        border: "0.5px solid rgba(163,45,45,0.2)",
                        color: "#A32D2D",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      Remove
                    </button>
                  )}

                  {post.status === "removed" && (
                    <button
                      type="button"
                      onClick={() => handleAction(post.id, "restore")}
                      disabled={submitting}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(99,153,34,0.08)",
                        border: "0.5px solid rgba(99,153,34,0.2)",
                        color: "#639922",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Restore
                    </button>
                  )}

                  {post.status === "pending_review" && (
                    <button
                      type="button"
                      onClick={() => handleAction(post.id, "approve")}
                      disabled={submitting}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(79,142,247,0.08)",
                        border: "0.5px solid rgba(79,142,247,0.2)",
                        color: "#4f8ef7",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Approve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(post.id, post.is_pinned ? "unpin" : "pin")
                    }
                    disabled={submitting}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: post.is_pinned
                        ? "rgba(79,142,247,0.08)"
                        : "#f5f4f0",
                      border: `0.5px solid ${post.is_pinned ? "rgba(79,142,247,0.2)" : "#ebebeb"}`,
                      color: post.is_pinned ? "#4f8ef7" : "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {post.is_pinned ? "Unpin" : "Pin"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(post.id, post.is_locked ? "unlock" : "lock")
                    }
                    disabled={submitting}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: post.is_locked
                        ? "rgba(186,117,23,0.08)"
                        : "#f5f4f0",
                      border: `0.5px solid ${post.is_locked ? "rgba(186,117,23,0.2)" : "#ebebeb"}`,
                      color: post.is_locked ? "#BA7517" : "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {post.is_locked ? "Unlock" : "Lock"}
                  </button>

                  {adminRole === "super_admin" && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ post, type: "delete" })}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ml-auto"
                      style={{
                        background: "rgba(163,45,45,0.05)",
                        border: "0.5px solid rgba(163,45,45,0.15)",
                        color: "#A32D2D",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        opacity: 0.7,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                      Delete permanently
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remove action modal */}
      {actionModal && actionModal.type === "remove" && !generatedMessage && (
        <>
          <div
            onClick={() => {
              setActionModal(null);
              setSelectedRules([]);
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
              width: "540px",
              maxWidth: "92vw",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            }}
          >
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#1a1a2e" }}
            >
              Remove post
            </p>
            <p className="text-xs mb-4" style={{ color: "#666" }}>
              Select the rules this post violates. A removal notice will be
              auto-generated.
            </p>

            {/* Post preview */}
            <div
              className="rounded-xl px-3 py-2.5 mb-4"
              style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
            >
              <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                {actionModal.post.title}
              </p>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: "#666" }}
              >
                {actionModal.post.body}
              </p>
            </div>

            {/* Rule picker */}
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xs font-medium" style={{ color: "#555" }}>
                Violated rules
              </p>
              {FORUM_RULES.map((rule, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleRule(i)}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left"
                  style={{
                    background: selectedRules.includes(i)
                      ? "rgba(163,45,45,0.06)"
                      : "#f5f4f0",
                    border: `0.5px solid ${selectedRules.includes(i) ? "rgba(163,45,45,0.25)" : "#ebebeb"}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: `1.5px solid ${selectedRules.includes(i) ? "#A32D2D" : "#ccc"}`,
                      background: selectedRules.includes(i)
                        ? "#A32D2D"
                        : "transparent",
                      flexShrink: 0,
                      marginTop: "1px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedRules.includes(i) && (
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "#1a1a2e", lineHeight: 1.55 }}
                  >
                    <strong>Rule {i + 1}:</strong> {rule}
                  </span>
                </button>
              ))}
            </div>

            {/* Mod note */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-medium" style={{ color: "#555" }}>
                Internal note{" "}
                <span style={{ color: "#bbb", fontWeight: 400 }}>
                  (optional — not shown to user)
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setSelectedRules([]);
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
                onClick={() =>
                  handleAction(actionModal.post.id, "remove", {
                    violated_rules: selectedRules,
                    note: modNote || undefined,
                  })
                }
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: submitting ? "#ccc" : "#A32D2D",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Removing..." : "Remove post"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Generated message preview */}
      {generatedMessage && (
        <>
          <div
            onClick={() => {
              setGeneratedMessage(null);
              setActionModal(null);
              setSelectedRules([]);
              setModNote("");
              fetchPosts();
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
              width: "480px",
              maxWidth: "92vw",
              boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(99,153,34,0.1)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#639922"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
                Post removed
              </p>
            </div>
            <p className="text-xs mb-3" style={{ color: "#666" }}>
              The following notice was logged as the removal reason:
            </p>
            <div
              className="rounded-xl px-4 py-3 text-xs mb-5"
              style={{
                background: "#f5f4f0",
                border: "0.5px solid #ebebeb",
                color: "#1a1a2e",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {generatedMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                setGeneratedMessage(null);
                setActionModal(null);
                setSelectedRules([]);
                setModNote("");
                fetchPosts();
              }}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "#1a1a2e",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Done
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {actionModal && actionModal.type === "delete" && (
        <>
          <div
            onClick={() => setActionModal(null)}
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
              width: "400px",
              maxWidth: "92vw",
              boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            }}
          >
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "#1a1a2e" }}
            >
              Permanently delete post?
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "#666", lineHeight: 1.6 }}
            >
              This removes the post and all its comments from the database
              entirely. Unlike removal, this cannot be undone or restored.
            </p>
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-medium" style={{ color: "#555" }}>
                Reason{" "}
                <span style={{ color: "#bbb", fontWeight: 400 }}>
                  (for audit log)
                </span>
              </label>
              <input
                type="text"
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                placeholder="e.g. duplicate spam post"
                className="px-3 py-2 rounded-xl text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fafafa",
                  fontFamily: "inherit",
                  color: "#1a1a2e",
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
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
                onClick={() => handleDelete(actionModal.post.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: submitting ? "#ccc" : "#A32D2D",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
