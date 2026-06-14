import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { TASK_CATEGORIES } from "@/types/tasks";
import { FLAIR_CONFIG } from "@/types/forum";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";
  const userId = session?.user?.email ?? "";

  const { data: tasksData } = await supabaseAdmin
    .from("tasks_with_subtask_count")
    .select(
      "id, title, status, priority, due_date, created_at, subtask_count, completed_subtask_count",
    )
    .eq("user_id", userId)
    .neq("status", "completed")
    .order("due_date", { ascending: true, nullsFirst: false });

  const tasks = tasksData ?? [];

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const activeCount = activeTasks.length;

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(now.getDate() + 7);
  const dueThisWeek = tasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    const due = new Date(t.due_date);
    return due >= now && due <= weekFromNow;
  }).length;

  const recentTasks = tasks.slice(0, 7);

  // Fetch latest forum posts
  const { data: postsData } = await supabaseAdmin
    .from("forum_posts")
    .select(
      "id, title, flair, anon_code, is_anonymous, upvotes, created_at, author_id",
    )
    .neq("status", "removed")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch comment counts for those posts
  const postIds = (postsData ?? []).map((p) => p.id);
  let commentCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: commentData } = await supabaseAdmin
      .from("forum_comments")
      .select("post_id")
      .in("post_id", postIds);
    commentCounts = (commentData ?? []).reduce(
      (acc, c) => {
        acc[c.post_id] = (acc[c.post_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  const recentPosts = (postsData ?? []).map((p) => ({
    ...p,
    comment_count: commentCounts[p.id] ?? 0,
  }));

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const priorityColor: Record<string, string> = {
    high: "#B91C1C",
    medium: "#B45309",
    low: "#166534",
  };

  const statusLabel: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    pending_review: "Pending Review",
    completed: "Completed",
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Nudge Bar */}
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
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          Good day, <span style={{ color: "#4f8ef7" }}>{firstName}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Here&apos;s an overview of your student life today.
        </p>
      </div>

      {/* Stat Cards */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {/* Tasks card — real data */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div
            className="flex items-center gap-1.5 mb-2"
            style={{ color: "#666" }}
          >
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
            <span style={{ fontSize: "11px" }}>Tasks</span>
          </div>
          <p
            className="font-medium"
            style={{ fontSize: "20px", color: "#1a1a2e" }}
          >
            {activeCount}
          </p>
          <p style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
            {activeCount === 0
              ? "No active tasks"
              : `${activeCount} active · ${dueThisWeek} due this week`}
          </p>
        </div>

        {/* Remaining stat cards — static for now */}
        {[
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
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
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

      {/* Main Row */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "1.2fr 0.8fr", alignItems: "start" }}
      >
        {/* Left — Task Manager preview */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
              Task Manager
            </span>
            <Link
              href="/tasks"
              className="text-xs"
              style={{ color: "#4f8ef7", textDecoration: "none" }}
            >
              View all
            </Link>
          </div>

          {recentTasks.length === 0 ? (
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
              <p style={{ fontSize: "13px", color: "#999" }}>No tasks yet</p>
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
          ) : (
            <div className="flex flex-col gap-0">
              {recentTasks.map((task, i) => {
                const subtaskTotal = task.subtask_count ?? 0;
                const subtaskDone = task.completed_subtask_count ?? 0;
                const subtaskPct =
                  subtaskTotal > 0
                    ? Math.round((subtaskDone / subtaskTotal) * 100)
                    : 0;
                const isOverdue =
                  task.due_date &&
                  new Date(task.due_date) < now &&
                  task.status !== "completed";

                return (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="flex items-center gap-3"
                    style={{
                      borderBottom:
                        i < recentTasks.length - 1
                          ? "0.5px solid #f5f4f0"
                          : "none",
                      borderLeft: `3px solid ${priorityColor[task.priority] ?? "#e5e5e5"}`,
                      paddingLeft: "10px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      paddingRight: "12px",
                      textDecoration: "none",
                    }}
                  >
                    {/* Left: title + subtask progress */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p
                        className="text-sm truncate"
                        style={{
                          color: "#1a1a2e",
                          fontWeight: 400,
                        }}
                      >
                        {task.title}
                      </p>
                      {subtaskTotal > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              flex: 1,
                              height: "3px",
                              borderRadius: "2px",
                              background: "#f0eff0",
                              overflow: "hidden",
                              maxWidth: "80px",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${subtaskPct}%`,
                                borderRadius: "2px",
                                background:
                                  subtaskPct === 100 ? "#166534" : "#4f8ef7",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "10px", color: "#bbb" }}>
                            {subtaskDone}/{subtaskTotal}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Due date */}
                    {task.due_date && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: isOverdue ? "#B91C1C" : "#999",
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(task.due_date)}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 500,
                        background:
                          task.status === "in_progress"
                            ? "rgba(79,142,247,0.08)"
                            : task.status === "pending_review"
                              ? "rgba(83,74,183,0.08)"
                              : "rgba(0,0,0,0.04)",
                        color:
                          task.status === "in_progress"
                            ? "#4f8ef7"
                            : task.status === "pending_review"
                              ? "#534AB7"
                              : "#666",
                      }}
                    >
                      {statusLabel[task.status] ?? task.status}
                    </span>
                  </Link>
                );
              })}
              {tasks.length > 7 && (
                <Link
                  href="/tasks"
                  className="text-xs mt-3 text-center block"
                  style={{ color: "#4f8ef7", textDecoration: "none" }}
                >
                  +{tasks.length - 7} more tasks
                </Link>
              )}
            </div>
          )}
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
                style={{
                  fontSize: "12px",
                  color: "#999",
                  textAlign: "center",
                }}
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

            {recentPosts.length === 0 ? (
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
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    textAlign: "center",
                  }}
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
            ) : (
              <div className="flex flex-col">
                {recentPosts.map((post, i) => {
                  const flair =
                    FLAIR_CONFIG[post.flair as keyof typeof FLAIR_CONFIG];
                  const author = post.is_anonymous
                    ? post.anon_code
                    : post.author_id.split("@")[0];

                  return (
                    <Link
                      key={post.id}
                      href={`/forum/${post.id}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        padding: "8px 0",
                        borderBottom:
                          i < recentPosts.length - 1
                            ? "1px solid #f0eff0"
                            : "none",
                        textDecoration: "none",
                      }}
                    >
                      {/* Flair + title */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {flair && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background: flair.bg,
                              color: flair.color,
                              flexShrink: 0,
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                            }}
                          >
                            {flair.label}
                          </span>
                        )}
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#1a1a2e",
                            fontWeight: 500,
                            lineHeight: 1.35,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {post.title}
                        </p>
                      </div>

                      {/* Meta row: author · time · comments · upvotes */}
                      <div
                        className="flex items-center gap-1.5"
                        style={{ fontSize: "10px", color: "#bbb" }}
                      >
                        <span>{author}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(post.created_at)}</span>
                        <span>·</span>
                        <span>
                          {post.comment_count} comment
                          {post.comment_count !== 1 ? "s" : ""}
                        </span>
                        <span>·</span>
                        <span>
                          {post.upvotes} upvote{post.upvotes !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
