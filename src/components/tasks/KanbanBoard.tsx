"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus, COLUMN_CONFIG } from "@/types/tasks";
import TaskCard from "./TaskCard";

type Props = {
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
};

export default function KanbanBoard({
  tasks,
  onStatusChange,
  onDelete,
  onTaskClick,
  onAddTask,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const columns = Object.entries(COLUMN_CONFIG) as [
    TaskStatus,
    { label: string; color: string },
  ][];

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        paddingBottom: "16px",
        minHeight: "500px",
        // Snap scrolling on mobile
        scrollSnapType: isMobile ? "x mandatory" : undefined,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {columns.map(([status, config]) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="flex flex-col gap-2 flex-shrink-0"
            style={{
              // On mobile: each column snaps and is ~85vw so next column peeks
              // On desktop: fixed 240px
              width: isMobile ? "85vw" : "240px",
              scrollSnapAlign: isMobile ? "start" : undefined,
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: 8, height: 8, background: config.color }}
              />
              <span
                className="text-xs font-medium flex-1"
                style={{ color: "#1a1a2e" }}
              >
                {config.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#f5f4f0", color: "#666" }}
              >
                {columnTasks.length}
              </span>
              <button
                type="button"
                onClick={() => onAddTask(status)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  padding: "2px",
                  lineHeight: 1,
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
              </button>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2 flex-1">
              {columnTasks.length === 0 ? (
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    height: "80px",
                    border: "0.5px dashed #e5e5e5",
                    color: "#ccc",
                    fontSize: "12px",
                  }}
                >
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onClick={onTaskClick}
                  />
                ))
              )}
            </div>

            {/* Add task button */}
            <button
              type="button"
              onClick={() => onAddTask(status)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs w-full"
              style={{
                border: "0.5px dashed #e5e5e5",
                background: "transparent",
                color: "#999",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}
