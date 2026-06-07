"use client";

import { Task, TASK_CATEGORIES, PRIORITY_CONFIG } from "@/types/tasks";

type Props = {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
};

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onClick,
}: Props) {
  const priority = PRIORITY_CONFIG[task.priority];
  const category = TASK_CATEGORIES.find((c) => c.id === task.category);

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const subtaskPct =
    task.subtask_total > 0
      ? (task.subtask_completed / task.subtask_total) * 100
      : 0;

  return (
    <div
      onClick={() => onClick(task)}
      className="group flex flex-col gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: "#fff",
        border: "0.5px solid #ebebeb",
        borderLeft: `2.5px solid ${priority.color}`,
      }}
    >
      {/* Title + kebab */}
      <div className="flex items-start gap-2">
        <p
          className="text-xs font-medium flex-1 leading-relaxed"
          style={{
            color: task.status === "completed" ? "#999" : "#1a1a2e",
            textDecoration:
              task.status === "completed" ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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

      {/* Description */}
      {task.description && (
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: "#999" }}
        >
          {task.description}
        </p>
      )}

      {/* Category tag */}
      {category && (
        <div className="flex flex-wrap gap-1">
          <span
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{
              background: `${category.color}14`,
              color: category.color,
            }}
          >
            {category.label}
          </span>
        </div>
      )}

      {/* Subtask progress bar */}
      {task.subtask_total > 0 && (
        <div className="flex flex-col gap-1">
          <div
            className="flex justify-between"
            style={{ fontSize: "10px", color: "#999" }}
          >
            <span>Subtasks</span>
            <span>
              {task.subtask_completed}/{task.subtask_total}
            </span>
          </div>
          <div
            className="rounded-full overflow-hidden"
            style={{ height: "3px", background: "#f0eff0" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${subtaskPct}%`, background: "#4f8ef7" }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2">
        {/* Due date */}
        {task.due_date && (
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: isOverdue ? "#A32D2D" : "#999" }}
          >
            <svg
              width="11"
              height="11"
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
            {formatDate(task.due_date)}
          </span>
        )}

        <div className="flex-1" />

        {/* Priority badge */}
        <span
          className="text-xs flex items-center gap-1 font-medium"
          style={{ color: priority.color }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M5 3l14 0 0 13-14 0z M5 16l14 0" />
          </svg>
          {priority.label.split(" ")[0]}
        </span>
      </div>

      {/* Quick status change */}
      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, e.target.value);
        }}
        className="text-xs rounded-lg px-2 py-1 outline-none w-full"
        style={{
          border: "0.5px solid #ebebeb",
          background: "#f5f4f0",
          color: "#666",
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
  );
}
