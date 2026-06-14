"use client";

import { useState, useEffect, useRef } from "react";
import {
  Task,
  Subtask,
  PRIORITY_CONFIG,
  TASK_CATEGORIES,
  COLUMN_CONFIG,
} from "@/types/tasks";

type Props = {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
};

function getDueDateBadge(dueDate?: string, status?: string) {
  if (!dueDate || status === "completed") return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0)
    return { label: `${Math.abs(diffDays)}d overdue`, color: "#B91C1C" };
  if (diffDays === 0) return { label: "Due today", color: "#B45309" };
  if (diffDays === 1) return { label: "Due tomorrow", color: "#B45309" };
  if (diffDays <= 7)
    return { label: `${diffDays} days left`, color: "#166534" };
  return null;
}

export default function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [categoryId, setCategoryId] = useState(task.category_id ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const dueBadge = getDueDateBadge(dueDate, status);

  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.completed).length;
  const subtaskPct =
    subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0;

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/subtasks`)
      .then((r) => r.json())
      .then((d) => setSubtasks(d.subtasks ?? []))
      .catch(console.error)
      .finally(() => setLoadingSubtasks(false));
  }, [task.id]);

  useEffect(() => {
    if (showSubtaskInput) subtaskInputRef.current?.focus();
  }, [showSubtaskInput]);

  useEffect(() => {
    const changed =
      title !== task.title ||
      description !== (task.description ?? "") ||
      status !== task.status ||
      priority !== task.priority ||
      dueDate !== (task.due_date ?? "") ||
      categoryId !== (task.category_id ?? "");
    setIsDirty(changed);
  }, [title, description, status, priority, dueDate, categoryId, task]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<Task> = {
      title,
      description,
      status,
      priority,
      due_date: dueDate || undefined,
      category_id: categoryId || undefined,
    };
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        onUpdate(task.id, updates);
        setIsDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubtasks((prev) => [...prev, data.subtask]);
        setNewSubtask("");
        setShowSubtaskInput(false);
      }
    } catch (err) {
      console.error("Add subtask error:", err);
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtask.id ? { ...s, completed: !s.completed } : s,
      ),
    );
    try {
      await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtask_id: subtask.id,
          completed: !subtask.completed,
        }),
      });
    } catch {
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? { ...s, completed: subtask.completed } : s,
        ),
      );
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    try {
      await fetch(`/api/tasks/${task.id}/subtasks?subtask_id=${subtaskId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Delete subtask error:", err);
    }
  };

  const priorityConfig = PRIORITY_CONFIG.find((p) => p.id === priority) ?? {
    id: priority,
    label: priority,
    color: "#999",
  };
  const statusConfig = COLUMN_CONFIG.find((c) => c.id === status) ?? {
    id: status,
    label: status,
    color: "#999",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 11px",
    borderRadius: "9px",
    border: "0.5px solid #e5e5e5",
    background: "#fafafa",
    fontSize: "13px",
    fontFamily: "inherit",
    color: "#1a1a2e",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 50,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 51,
          background: "#fff",
          borderRadius: "20px",
          width: "580px",
          maxWidth: "92vw",
          maxHeight: "88vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 24px 60px rgba(0,0,0,0.15)",
          animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "0.5px solid #ebebeb",
            flexShrink: 0,
          }}
        >
          {/* Priority + status badges row */}
          <div
            className="flex items-center gap-2"
            style={{ marginBottom: "10px" }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "8px",
                background: `${priorityConfig?.color}18`,
                color: priorityConfig?.color,
              }}
            >
              {priorityConfig?.label} priority
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "8px",
                background: `${statusConfig?.color}18`,
                color: statusConfig?.color,
              }}
            >
              {statusConfig?.label}
            </span>
            {dueBadge && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "8px",
                  background: `${dueBadge.color}15`,
                  color: dueBadge.color,
                }}
              >
                {dueBadge.label}
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#f5f4f0",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Editable title */}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1a1a2e",
              fontFamily: "inherit",
              resize: "none",
              background: "transparent",
              lineHeight: 1.35,
              padding: 0,
            }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Fields grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {/* Status */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#999",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                style={selectStyle}
              >
                {COLUMN_CONFIG.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#999",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Task["priority"])
                }
                style={selectStyle}
              >
                {PRIORITY_CONFIG.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#999",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Category */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#999",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={selectStyle}
              >
                <option value="">No category</option>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#999",
                display: "block",
                marginBottom: "5px",
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.6,
                minHeight: "72px",
              }}
            />
          </div>

          {/* Subtasks */}
          <div>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "10px" }}
            >
              <div className="flex items-center gap-2">
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#999",
                  }}
                >
                  Subtasks
                </label>
                {subtaskTotal > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 7px",
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
              </div>
              <button
                type="button"
                onClick={() => setShowSubtaskInput(true)}
                style={{
                  background: "none",
                  border: "0.5px solid #e5e5e5",
                  borderRadius: "7px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
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
                Add
              </button>
            </div>

            {/* Progress bar */}
            {subtaskTotal > 0 && (
              <div
                style={{
                  height: "4px",
                  borderRadius: "2px",
                  background: "#f0eff0",
                  overflow: "hidden",
                  marginBottom: "10px",
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
            )}

            {/* Subtask list */}
            {loadingSubtasks ? (
              <p style={{ fontSize: "12px", color: "#bbb" }}>
                Loading subtasks...
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 group"
                    style={{
                      padding: "7px 10px",
                      borderRadius: "9px",
                      background: "#f5f4f0",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "#ebebeb")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background =
                        "#f5f4f0")
                    }
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(subtask)}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: subtask.completed ? "none" : "1.5px solid #ccc",
                        background: subtask.completed
                          ? "#4f8ef7"
                          : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {subtask.completed && (
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
                    </button>

                    {/* Title */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: "12px",
                        color: subtask.completed ? "#999" : "#1a1a2e",
                        textDecoration: subtask.completed
                          ? "line-through"
                          : "none",
                        lineHeight: 1.4,
                      }}
                    >
                      {subtask.title}
                    </span>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ccc",
                        padding: "2px",
                        display: "flex",
                        opacity: 0,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity =
                          "1";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#A32D2D";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity =
                          "0";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#ccc";
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* New subtask input */}
                {showSubtaskInput && (
                  <div
                    className="flex items-center gap-2"
                    style={{
                      padding: "6px 10px",
                      borderRadius: "9px",
                      background: "#f5f4f0",
                      border: "0.5px solid #4f8ef7",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: "1.5px solid #ccc",
                        flexShrink: 0,
                      }}
                    />
                    <input
                      ref={subtaskInputRef}
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a subtask..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") {
                          setShowSubtaskInput(false);
                          setNewSubtask("");
                        }
                      }}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        color: "#1a1a2e",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      disabled={addingSubtask || !newSubtask.trim()}
                      style={{
                        background:
                          addingSubtask || !newSubtask.trim()
                            ? "#ccc"
                            : "#1a1a2e",
                        border: "none",
                        borderRadius: "6px",
                        padding: "3px 9px",
                        fontSize: "11px",
                        color: "#fff",
                        cursor:
                          addingSubtask || !newSubtask.trim()
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {addingSubtask ? "..." : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubtaskInput(false);
                        setNewSubtask("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#999",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        padding: "2px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {!loadingSubtasks &&
                  subtasks.length === 0 &&
                  !showSubtaskInput && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#bbb",
                        textAlign: "center",
                        padding: "8px 0",
                      }}
                    >
                      No subtasks yet — click Add to break this down
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "0.5px solid #ebebeb",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          {/* Delete task */}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            style={{
              padding: "8px 14px",
              borderRadius: "9px",
              border: "0.5px solid rgba(163,45,45,0.2)",
              background: "rgba(163,45,45,0.05)",
              color: "#A32D2D",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Delete task
          </button>

          <div style={{ flex: 1 }} />

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "0.5px solid #e5e5e5",
              background: "#fff",
              color: "#666",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{
              padding: "8px 20px",
              borderRadius: "9px",
              border: "none",
              background: saved
                ? "#166534"
                : !isDirty || saving
                  ? "#e5e5e5"
                  : "#1a1a2e",
              color: !isDirty || saving ? "#bbb" : "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: !isDirty || saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 0.3s ease",
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save changes"}
          </button>
        </div>
      </div>
      {/* Delete confirmation modal */}
      {confirmingDelete && (
        <>
          <div
            onClick={() => setConfirmingDelete(false)}
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
                onClick={() => setConfirmingDelete(false)}
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
                onClick={() => {
                  setConfirmingDelete(false);
                  onDelete(task.id);
                  onClose();
                }}
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
    </>
  );
}
