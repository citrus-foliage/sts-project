"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskStatus } from "@/types/tasks";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import ListView from "@/components/tasks/ListView";
import TaskForm from "@/components/tasks/TaskForm";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import FeatureHidden from "@/components/layout/FeatureHidden";

type ViewMode = "board" | "list";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  // Feature visibility check
  const [showFeature, setShowFeature] = useState(true);
  const [checkingFeature, setCheckingFeature] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.show_tasks === false) setShowFeature(false);
      })
      .catch(() => {})
      .finally(() => setCheckingFeature(false));
  }, []);

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
    category_id: string;
    due_date: string;
    due_time: string;
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
    setSelectedTask(null);
  };

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : prev));
    }
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  if (checkingFeature) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (!showFeature) {
    return <FeatureHidden featureName="Task Manager" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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

      {/* Toolbar */}
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

      {/* Add Task Modal */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowForm(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 50,
              animation: "fadeIn 0.2s ease",
            }}
          />
          {/* Modal card */}
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
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)",
              animation: "popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <p
              className="text-sm font-medium mb-4"
              style={{ color: "#1a1a2e" }}
            >
              New task
            </p>
            <TaskForm
              defaultStatus={defaultStatus}
              onSubmit={handleAddTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes popIn {
              from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>
        </>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Board or List View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading tasks...</p>
        </div>
      ) : view === "board" ? (
        <KanbanBoard tasks={tasks} onRefresh={fetchTasks} />
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
