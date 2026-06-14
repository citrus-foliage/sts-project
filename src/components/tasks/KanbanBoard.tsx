"use client";

import { useState, useEffect, useRef } from "react";
import { Task, COLUMN_CONFIG, TaskStatus } from "@/types/tasks";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";

type Props = {
  tasks: Task[];
  onRefresh: () => void;
};

export default function KanbanBoard({ tasks, onRefresh }: Props) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showFormInColumn, setShowFormInColumn] = useState<TaskStatus | null>(
    null,
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragSourceColumn, setDragSourceColumn] = useState<TaskStatus | null>(
    null,
  );
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below">("below");
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const dragOverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const handleUpdate = (id: string, updates: Partial<Task>) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleAddTask = async (columnId: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          status: columnId,
          priority: "medium",
          position: localTasks.filter((t) => t.status === columnId).length,
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setLocalTasks((prev) => [...prev, data.task]);
        setNewTaskTitle("");
        setShowFormInColumn(null);
      }
    } catch (err) {
      console.error("Add task error:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTaskId(task.id);
    setDragSourceColumn(task.status);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragSourceColumn(null);
    setDragOverTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOverTask = (
    e: React.DragEvent<HTMLDivElement>,
    task: Task,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (task.id === draggedTaskId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverTaskId(task.id);
    setDropPosition(e.clientY < midY ? "above" : "below");
    setDragOverColumn(task.status);
  };

  const handleDragOverColumn = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: TaskStatus,
  ) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    setDragOverTaskId(null);
  };

  const handleDropOnTask = async (targetTask: Task) => {
    if (!draggedTaskId || draggedTaskId === targetTask.id) return;

    const draggedTask = localTasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    const sameColumn = draggedTask.status === targetTask.status;

    if (sameColumn) {
      const columnTasks = localTasks
        .filter((t) => t.status === targetTask.status)
        .sort((a, b) => a.position - b.position);

      const withoutDragged = columnTasks.filter((t) => t.id !== draggedTaskId);
      const targetIndex = withoutDragged.findIndex(
        (t) => t.id === targetTask.id,
      );
      const insertIndex =
        dropPosition === "above" ? targetIndex : targetIndex + 1;

      withoutDragged.splice(insertIndex, 0, draggedTask);

      const reordered = withoutDragged.map((t, i) => ({ ...t, position: i }));

      setLocalTasks((prev) => {
        const otherColumnTasks = prev.filter(
          (t) => t.status !== targetTask.status,
        );
        return [...otherColumnTasks, ...reordered];
      });

      await Promise.all(
        reordered.map((t) =>
          fetch(`/api/tasks/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: t.position }),
          }),
        ),
      );
    } else {
      const targetColumnTasks = localTasks
        .filter((t) => t.status === targetTask.status)
        .sort((a, b) => a.position - b.position);

      const withoutDragged = targetColumnTasks.filter(
        (t) => t.id !== draggedTaskId,
      );
      const targetIndex = withoutDragged.findIndex(
        (t) => t.id === targetTask.id,
      );
      const insertIndex =
        dropPosition === "above" ? targetIndex : targetIndex + 1;

      const movedTask = {
        ...draggedTask,
        status: targetTask.status,
        position: insertIndex,
      };

      withoutDragged.splice(insertIndex, 0, movedTask);
      const reordered = withoutDragged.map((t, i) => ({ ...t, position: i }));

      setLocalTasks((prev) => {
        const others = prev.filter(
          (t) => t.id !== draggedTaskId && t.status !== targetTask.status,
        );
        return [...others, ...reordered];
      });

      await fetch(`/api/tasks/${draggedTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetTask.status,
          position: insertIndex,
        }),
      });
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragSourceColumn(null);
    setDragOverColumn(null);
  };

  const handleDropOnColumn = async (columnId: TaskStatus) => {
    if (!draggedTaskId) return;

    const draggedTask = localTasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask || draggedTask.status === columnId) return;

    const colTasks = localTasks.filter((t) => t.status === columnId);
    const position = colTasks.length;

    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTaskId ? { ...t, status: columnId, position } : t,
      ),
    );

    await fetch(`/api/tasks/${draggedTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: columnId, position }),
    });

    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <>
      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedTask(null);
          }}
        />
      )}

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

      {/* Kanban columns */}
      <div
        className="flex gap-4 h-full overflow-x-auto"
        style={{ minHeight: 0 }}
      >
        {COLUMN_CONFIG.map((column) => {
          const columnTasks = localTasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.position - b.position);

          const isColumnDragOver =
            dragOverColumn === column.id && dragOverTaskId === null;

          return (
            <div
              key={column.id}
              className="flex flex-col flex-shrink-0"
              style={{ width: "280px" }}
              onDragOver={(e) => handleDragOverColumn(e, column.id)}
              onDrop={() => handleDropOnColumn(column.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: column.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1a1a2e",
                    }}
                  >
                    {column.label}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#bbb",
                      fontFamily: "monospace",
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormInColumn(column.id);
                    setNewTaskTitle("");
                  }}
                  style={{
                    background: "none",
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "6px",
                    width: "22px",
                    height: "22px",
                    cursor: "pointer",
                    color: "#999",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  title="Add task"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Column body */}
              <div
                className="flex flex-col gap-2 flex-1 overflow-y-auto"
                style={{
                  padding: "2px 1px",
                  borderRadius: "14px",
                  background: isColumnDragOver
                    ? "rgba(79,142,247,0.04)"
                    : "transparent",
                  border: isColumnDragOver
                    ? "1.5px dashed rgba(79,142,247,0.3)"
                    : "1.5px dashed transparent",
                  transition: "all 0.15s",
                  minHeight: "80px",
                }}
                ref={dragOverRef}
              >
                {/* Add task inline form */}
                {showFormInColumn === column.id && (
                  <div
                    style={{
                      background: "#fff",
                      border: "0.5px solid #4f8ef7",
                      borderRadius: "12px",
                      padding: "10px 12px",
                    }}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask(column.id);
                        if (e.key === "Escape") {
                          setShowFormInColumn(null);
                          setNewTaskTitle("");
                        }
                      }}
                      placeholder="Task title..."
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        color: "#1a1a2e",
                        marginBottom: "8px",
                        background: "transparent",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddTask(column.id)}
                        disabled={addingTask || !newTaskTitle.trim()}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "8px",
                          border: "none",
                          background:
                            addingTask || !newTaskTitle.trim()
                              ? "#e5e5e5"
                              : "#1a1a2e",
                          color:
                            addingTask || !newTaskTitle.trim()
                              ? "#bbb"
                              : "#fff",
                          fontSize: "12px",
                          cursor:
                            addingTask || !newTaskTitle.trim()
                              ? "not-allowed"
                              : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {addingTask ? "Adding..." : "Add task"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFormInColumn(null);
                          setNewTaskTitle("");
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "0.5px solid #e5e5e5",
                          background: "#fff",
                          color: "#666",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Task cards */}
                {columnTasks.map((task) => {
                  const isOverAbove =
                    dragOverTaskId === task.id && dropPosition === "above";
                  const isOverBelow =
                    dragOverTaskId === task.id && dropPosition === "below";

                  return (
                    <div
                      key={task.id}
                      onDragOver={(e) => handleDragOverTask(e, task)}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDropOnTask(task);
                      }}
                    >
                      {/* Drop indicator — above */}
                      {isOverAbove && draggedTaskId !== task.id && (
                        <div
                          style={{
                            height: "2px",
                            borderRadius: "1px",
                            background: "#4f8ef7",
                            marginBottom: "4px",
                            boxShadow: "0 0 6px rgba(79,142,247,0.5)",
                          }}
                        />
                      )}

                      {/* Task card wrapper with drag events */}
                      <div
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        style={{ cursor: "grab" }}
                      >
                        <TaskCard
                          task={task}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          onClick={() => setSelectedTask(task)}
                          isDragging={draggedTaskId === task.id}
                        />
                      </div>

                      {/* Drop indicator — below */}
                      {isOverBelow && draggedTaskId !== task.id && (
                        <div
                          style={{
                            height: "2px",
                            borderRadius: "1px",
                            background: "#4f8ef7",
                            marginTop: "4px",
                            boxShadow: "0 0 6px rgba(79,142,247,0.5)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Empty column state */}
                {columnTasks.length === 0 && showFormInColumn !== column.id && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      minHeight: "80px",
                      color: "#ddd",
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "#ccc" }}>
                      Drop tasks here
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
