"use client";

import { useState } from "react";
import { TASK_CATEGORIES, TaskStatus, TaskPriority } from "@/types/tasks";

type Props = {
  defaultStatus?: TaskStatus;
  onSubmit: (task: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    category_id: string;
    due_date: string;
  }) => Promise<void>;
  onCancel: () => void;
};

export default function TaskForm({
  defaultStatus = "todo",
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        description,
        status,
        priority,
        category_id: categoryId,
        due_date: dueDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1px solid #e5e5e5",
    background: "#fafafa",
    fontFamily: "inherit",
    color: "#1a1a2e",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Title *
        </label>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Description
        </label>
        <textarea
          placeholder="Add more details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Row — Status + Priority */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "#555" }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "#555" }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Row — Category + Due date */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "#555" }}>
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            <option value="">No category</option>
            {TASK_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "#555" }}>
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
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
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{
            background: loading ? "#ccc" : "#1a1a2e",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Saving..." : "Add task"}
        </button>
      </div>
    </div>
  );
}
