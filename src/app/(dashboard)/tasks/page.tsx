"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus } from "@/types/tasks";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import ListView from "@/components/tasks/ListView";
import TaskForm from "@/components/tasks/TaskForm";

type ViewMode = "board" | "list";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: string;
    category: string;
    due_date: string;
  }) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setTasks((prev) => [data.task, ...prev]);
    setShowForm(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: status as TaskStatus } : t,
      ),
    );
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const handleAddFromColumn = (status: TaskStatus) => {
    setDefaultStatus(status);
    setShowForm(true);
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            Task Manager
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            {loading
              ? "Loading..."
              : `${pendingCount} pending · ${completedCount} completed`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDefaultStatus("todo");
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{
            background: "#1a1a2e",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New task
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          {(["board", "list"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: view === v ? "#f5f4f0" : "transparent",
                color: view === v ? "#1a1a2e" : "#999",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {v === "board" ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="18" />
                  <rect x="14" y="3" width="7" height="18" />
                </svg>
              ) : (
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
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              )}
              {v === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>

        {/* Filter — list view only */}
        {view === "list" && (
          <div className="flex items-center gap-1">
            {(
              [
                "all",
                "todo",
                "in_progress",
                "pending_review",
                "completed",
              ] as const
            ).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="px-2.5 py-1.5 rounded-lg text-xs capitalize"
                style={{
                  background: filter === f ? "#1a1a2e" : "#fff",
                  color: filter === f ? "#fff" : "#666",
                  border: "0.5px solid #ebebeb",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f === "all"
                  ? "All"
                  : f === "in_progress"
                    ? "In Progress"
                    : f === "pending_review"
                      ? "Pending Review"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Task Form ── */}
      {showForm && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p className="text-sm font-medium mb-4" style={{ color: "#1a1a2e" }}>
            New task
          </p>
          <TaskForm
            defaultStatus={defaultStatus}
            onSubmit={handleAddTask}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* ── Task Detail Panel ── */}
      {selectedTask && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
              {selectedTask.title}
            </p>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          {selectedTask.description && (
            <p className="text-sm" style={{ color: "#666", lineHeight: 1.6 }}>
              {selectedTask.description}
            </p>
          )}
          <div className="flex gap-4 mt-3">
            <span className="text-xs" style={{ color: "#999" }}>
              Status:{" "}
              <strong style={{ color: "#1a1a2e" }}>
                {COLUMN_LABELS[selectedTask.status]}
              </strong>
            </span>
            {selectedTask.due_date && (
              <span className="text-xs" style={{ color: "#999" }}>
                Due:{" "}
                <strong style={{ color: "#1a1a2e" }}>
                  {new Date(selectedTask.due_date).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Board or List View ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading tasks...</p>
        </div>
      ) : view === "board" ? (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddFromColumn}
        />
      ) : (
        <ListView
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onTaskClick={setSelectedTask}
        />
      )}
    </div>
  );
}

const COLUMN_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  completed: "Completed",
};
