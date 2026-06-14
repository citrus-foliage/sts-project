"use client";

import { useState } from "react";
import {
  Task,
  COLUMN_CONFIG,
  TASK_CATEGORIES,
  PRIORITY_CONFIG,
} from "@/types/tasks";

type Props = {
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
};

type SortOption =
  | "recent"
  | "priority_high"
  | "priority_low"
  | "due_earliest"
  | "due_latest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "priority_high", label: "Priority: High to Low" },
  { value: "priority_low", label: "Priority: Low to High" },
  { value: "due_earliest", label: "Due date: Earliest first" },
  { value: "due_latest", label: "Due date: Latest first" },
];

// Higher number = higher priority
const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function ListView({
  tasks,
  onStatusChange,
  onDelete,
  onTaskClick,
}: Props) {
  const [sort, setSort] = useState<SortOption>("recent");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    onDelete(confirmDeleteId);
    setConfirmDeleteId(null);
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

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sort) {
      case "priority_high":
        return (
          (PRIORITY_WEIGHT[b.priority] ?? 0) -
          (PRIORITY_WEIGHT[a.priority] ?? 0)
        );
      case "priority_low":
        return (
          (PRIORITY_WEIGHT[a.priority] ?? 0) -
          (PRIORITY_WEIGHT[b.priority] ?? 0)
        );
      case "due_earliest": {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      case "due_latest": {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      }
      case "recent":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{
          height: "300px",
          background: "#fff",
          border: "0.5px solid #ebebeb",
          color: "#bbb",
        }}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sort control */}
      <div className="flex items-center justify-end gap-2">
        <span style={{ fontSize: "12px", color: "#999" }}>Sort by</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
          style={{
            border: "0.5px solid #ebebeb",
            background: "#fff",
            color: "#1a1a2e",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        {/* Table header */}
        <div
          className="grid text-xs font-medium px-4 py-3"
          style={{
            gridTemplateColumns: "1fr 120px 120px 100px 80px 70px",
            color: "#999",
            borderBottom: "0.5px solid #ebebeb",
            background: "#fafafa",
          }}
        >
          <span>Task</span>
          <span>Status</span>
          <span>Category</span>
          <span>Due date</span>
          <span>Priority</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        {sortedTasks.map((task, i) => {
          const priority = PRIORITY_CONFIG.find(
            (p) => p.id === task.priority,
          ) ?? {
            id: task.priority,
            label: task.priority,
            color: "#999",
          };
          const category = TASK_CATEGORIES.find(
            (c) => c.id === task.category_id,
          );
          const statusConfig = COLUMN_CONFIG.find(
            (c) => c.id === task.status,
          ) ?? {
            id: task.status,
            label: task.status,
            color: "#999",
          };
          const isOverdue =
            task.due_date &&
            new Date(task.due_date) < new Date() &&
            task.status !== "completed";

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="grid items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 relative"
              style={{
                gridTemplateColumns: "1fr 120px 120px 100px 80px 70px",
                borderBottom:
                  i < sortedTasks.length - 1 ? "0.5px solid #f5f4f0" : "none",
                borderLeft: `3px solid ${priority.color}`,
              }}
            >
              {/* Title */}
              <div className="flex flex-col gap-0.5 min-w-0 pr-4 pl-2">
                <p
                  className="text-sm truncate"
                  style={{
                    color: task.status === "completed" ? "#999" : "#1a1a2e",
                    textDecoration:
                      task.status === "completed" ? "line-through" : "none",
                    fontWeight: 400,
                  }}
                >
                  {task.title}
                </p>
                {(task.subtask_count ?? 0) > 0 && (
                  <p style={{ fontSize: "10px", color: "#bbb" }}>
                    {task.completed_subtask_count ?? 0}/{task.subtask_count}{" "}
                    subtasks
                  </p>
                )}
              </div>

              {/* Status */}
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 outline-none w-full"
                  style={{
                    border: "0.5px solid #ebebeb",
                    background: `${statusConfig.color}14`,
                    color: statusConfig.color,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Category */}
              <div className="pr-2">
                {category ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-medium inline-block truncate max-w-full"
                    style={{
                      background: `${category.color}14`,
                      color: category.color,
                    }}
                  >
                    {category.label}
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#ccc" }}>—</span>
                )}
              </div>

              {/* Due date */}
              <span
                className="text-xs"
                style={{ color: isOverdue ? "#A32D2D" : "#666" }}
              >
                {task.due_date ? formatDate(task.due_date) : "—"}
              </span>

              {/* Priority */}
              <span
                className="text-xs font-medium"
                style={{ color: priority.color }}
              >
                {priority.label.split(" ")[0]}
              </span>

              {/* Actions */}
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => onTaskClick(task)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#999",
                    padding: "2px",
                  }}
                  title="Edit task"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(task.id);
                  }}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#999",
                    padding: "2px",
                  }}
                  title="Delete task"
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
        })}
      </div>
      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <>
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 60,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 61,
              background: "#fff",
              borderRadius: "16px",
              padding: "28px",
              width: "360px",
              maxWidth: "90vw",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "#1a1a2e" }}
            >
              Delete task?
            </p>
            <p className="text-sm mb-6" style={{ color: "#666" }}>
              This action cannot be undone. The task and all its subtasks will
              be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
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
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: "#A32D2D",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
