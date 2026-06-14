"use client";

import { Task, PRIORITY_CONFIG, TASK_CATEGORIES } from "@/types/tasks";

type Props = {
  task: Task;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
  isDragging?: boolean;
};

function getDueDateBadge(dueDate?: string, status?: string) {
  if (!dueDate || status === "completed") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      color: "#B91C1C",
      bg: "rgba(185,28,28,0.1)",
    };
  }
  if (diffDays === 0) {
    return { label: "Due today", color: "#B45309", bg: "rgba(180,83,9,0.1)" };
  }
  if (diffDays === 1) {
    return {
      label: "Due tomorrow",
      color: "#B45309",
      bg: "rgba(180,83,9,0.08)",
    };
  }
  if (diffDays <= 3) {
    return {
      label: `${diffDays}d left`,
      color: "#B45309",
      bg: "rgba(180,83,9,0.06)",
    };
  }
  if (diffDays <= 7) {
    return {
      label: `${diffDays}d left`,
      color: "#166534",
      bg: "rgba(22,101,52,0.08)",
    };
  }
  return null;
}

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onClick,
  isDragging,
}: Props) {
  const priority = PRIORITY_CONFIG.find((p) => p.id === task.priority) ?? {
    id: task.priority,
    label: task.priority,
    color: "#999",
  };
  const category = TASK_CATEGORIES.find((c) => c.id === task.category_id);
  const dueBadge = getDueDateBadge(task.due_date, task.status);

  const subtaskTotal = task.subtask_count ?? 0;
  const subtaskDone = task.completed_subtask_count ?? 0;
  const hasSubtasks = subtaskTotal > 0;
  const subtaskPct = hasSubtasks
    ? Math.round((subtaskDone / subtaskTotal) * 100)
    : 0;

  return (
    <div
      onClick={() => onClick(task)}
      draggable
      style={{
        background: "#fff",
        border: "0.5px solid #ebebeb",
        borderLeft: `3px solid ${priority?.color ?? "#e5e5e5"}`,
        borderRadius: "12px",
        padding: "12px 14px",
        cursor: "pointer",
        opacity: isDragging ? 0.4 : 1,
        transition: "box-shadow 0.15s, opacity 0.15s",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 2px 12px rgba(0,0,0,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Title row */}
      <p
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: task.status === "completed" ? "#999" : "#1a1a2e",
          lineHeight: 1.4,
          textDecoration: task.status === "completed" ? "line-through" : "none",
          marginBottom: "8px",
        }}
      >
        {task.title}
      </p>

      {/* Subtask progress bar */}
      {hasSubtasks && (
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              height: "3px",
              borderRadius: "2px",
              background: "#f0eff0",
              overflow: "hidden",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${subtaskPct}%`,
                borderRadius: "2px",
                background: subtaskPct === 100 ? "#166534" : "#4f8ef7",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Tag row */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        style={{ marginBottom: "4px" }}
      >
        {/* Category tag */}
        {category && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: "6px",
              background: `${category.color}15`,
              color: category.color,
            }}
          >
            {category.label}
          </span>
        )}

        {/* Subtask count chip */}
        {hasSubtasks && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: "6px",
              background:
                subtaskPct === 100
                  ? "rgba(22,101,52,0.1)"
                  : "rgba(79,142,247,0.1)",
              color: subtaskPct === 100 ? "#166534" : "#4f8ef7",
            }}
          >
            {subtaskDone}/{subtaskTotal}
          </span>
        )}

        {/* Due date countdown badge */}
        {dueBadge && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: "6px",
              background: dueBadge.bg,
              color: dueBadge.color,
            }}
          >
            {dueBadge.label}
          </span>
        )}
      </div>

      {/* Footer row*/}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: "6px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick status dropdown */}
        <select
          value={task.status}
          onChange={(e) =>
            onStatusChange(task.id, e.target.value as Task["status"])
          }
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "6px",
            border: "0.5px solid #e5e5e5",
            background: "#f5f4f0",
            color: "#555",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_review">Pending Review</option>
          <option value="completed">Completed</option>
        </select>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#ccc",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#A32D2D")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#ccc")
          }
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
    </div>
  );
}
