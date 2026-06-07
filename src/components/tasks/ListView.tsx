"use client";

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

export default function ListView({
  tasks,
  onStatusChange,
  onDelete,
  onTaskClick,
}: Props) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
    >
      {/* Table header */}
      <div
        className="grid text-xs font-medium px-4 py-3"
        style={{
          gridTemplateColumns: "1fr 120px 120px 100px 80px 32px",
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
        <span />
      </div>

      {/* Rows */}
      {tasks.map((task, i) => {
        const priority = PRIORITY_CONFIG[task.priority];
        const category = TASK_CATEGORIES.find((c) => c.id === task.category);
        const statusConfig = COLUMN_CONFIG[task.status];
        const isOverdue =
          task.due_date &&
          new Date(task.due_date) < new Date() &&
          task.status !== "completed";

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="grid items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
            style={{
              gridTemplateColumns: "1fr 120px 120px 100px 80px 32px",
              borderBottom:
                i < tasks.length - 1 ? "0.5px solid #f5f4f0" : "none",
            }}
          >
            {/* Title */}
            <div className="flex flex-col gap-0.5 min-w-0 pr-4">
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
              {task.subtask_total > 0 && (
                <p style={{ fontSize: "10px", color: "#bbb" }}>
                  {task.subtask_completed}/{task.subtask_total} subtasks
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
            <div>
              {category ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
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

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: "2px",
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
