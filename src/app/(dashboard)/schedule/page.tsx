"use client";

import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CalendarSetup from "@/components/schedule/CalendarSetup";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  source: "task" | "google" | "canvas";
  completed?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  classNames?: string[];
  extendedProps?: Record<string, unknown>;
};

type EventSources = {
  tasks: number;
  google: number;
  canvas: number;
  holidays: number;
};

type LegendItem = {
  label: string;
  count: number | null;
  color: string;
};

export default function SchedulePage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sources, setSources] = useState<EventSources>({
    tasks: 0,
    google: 0,
    canvas: 0,
    holidays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasCanvasUrl, setHasCanvasUrl] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Check Canvas connection status
      const canvasRes = await fetch("/api/schedule/canvas");
      const canvasData = await canvasRes.json();
      setHasCanvasUrl(canvasData.hasUrl ?? false);

      // Fetch Google Calendar events directly
      let googleEvts: CalendarEvent[] = [];
      const googleRes = await fetch("/api/schedule/google-events");
      if (googleRes.ok) {
        const googleData = await googleRes.json();
        googleEvts = googleData.events ?? [];
        setGoogleError("");
      } else {
        const err = await googleRes.json();
        setGoogleError(err.error ?? "Google Calendar unavailable");
      }

      // Fetch tasks with due dates
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      const taskEvents: CalendarEvent[] = (tasksData.tasks ?? [])
        .filter((t: { due_date?: string }) => t.due_date)
        .map(
          (task: {
            id: string;
            title: string;
            due_date: string;
            status: string;
            priority: string;
          }) => {
            const isCompleted = task.status === "completed";
            const priorityColors: Record<string, string> = {
              high: "#B91C1C",
              medium: "#B45309",
              low: "#166534",
            };
            const color = isCompleted
              ? "#6B7280"
              : (priorityColors[task.priority] ?? "#555");
            return {
              id: `task_${task.id}`,
              title: task.title,
              start: task.due_date,
              allDay: true,
              source: "task" as const,
              completed: isCompleted,
              backgroundColor: color,
              borderColor: color,
              textColor: "#fff",
              classNames: isCompleted ? ["task-completed"] : [],
              extendedProps: {
                type: "task",
                status: task.status,
                priority: task.priority,
              },
            };
          },
        );

      const canvasEvts: CalendarEvent[] = canvasData.events ?? [];

      // Fetch Philippine holidays
      let holidayEvts: CalendarEvent[] = [];
      try {
        const holidaysRes = await fetch("/api/schedule/holidays");
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          holidayEvts = holidaysData.events ?? [];
        }
      } catch {
        // Holidays unavailable — continue without them
      }

      const allEvents = [
        ...taskEvents,
        ...googleEvts,
        ...canvasEvts,
        ...holidayEvts,
      ];
      setEvents(allEvents);
      setSources({
        tasks: taskEvents.length,
        google: googleEvts.length,
        canvas: canvasEvts.length,
        holidays: holidayEvts.length,
      });
    } catch (err) {
      console.error("Fetch events error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const totalEvents = sources.tasks + sources.google + sources.canvas;

  const legendItems: LegendItem[] = [
    { label: "High priority tasks", count: null, color: "#B91C1C" },
    { label: "Medium priority tasks", count: null, color: "#B45309" },
    { label: "Low priority tasks", count: null, color: "#166534" },
    { label: "Completed tasks", count: null, color: "#6B7280" },
    { label: "Google Calendar", count: sources.google, color: "#4f8ef7" },
    { label: "Canvas deadlines", count: sources.canvas, color: "#E24B4A" },
    { label: "PH Public Holidays", count: sources.holidays, color: "#7C3AED" },
  ];

  return (
    <div className="flex gap-5 h-full">
      {/* ── Main calendar ── */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
              Schedule
            </h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              {loading
                ? "Loading your schedule..."
                : `${totalEvents} events — ${sources.tasks} tasks, ${sources.google} from Google, ${sources.canvas} from Canvas`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSetup(!showSetup)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs flex-shrink-0"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: "#666",
              cursor: "pointer",
              fontFamily: "inherit",
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Integrations
          </button>
        </div>

        {/* Google error notice */}
        {googleError && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{
              background: "rgba(186,117,23,0.08)",
              border: "0.5px solid rgba(186,117,23,0.2)",
              color: "#BA7517",
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Google Calendar: {googleError}. Try signing out and back in.
          </div>
        )}

        {/* Calendar */}
        <div
          className="rounded-2xl overflow-hidden flex-1"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <style>{`
            .fc { font-family: 'DM Sans', sans-serif; }
            .fc-toolbar-title { font-size: 15px !important; font-weight: 500 !important; color: #1a1a2e !important; }
            .fc-button { font-family: 'DM Sans', sans-serif !important; font-size: 12px !important; border-radius: 8px !important; }
            .fc-button-primary { background: #1a1a2e !important; border-color: #1a1a2e !important; }
            .fc-button-primary:hover { background: #2d2d4e !important; }
            .fc-button-active { background: #4f8ef7 !important; border-color: #4f8ef7 !important; }
            .fc-day-today { background: rgba(79,142,247,0.05) !important; }
            .fc-event { border-radius: 5px !important; font-size: 11px !important; padding: 1px 4px !important; cursor: pointer !important; }
            .task-completed { text-decoration: line-through !important; opacity: 0.75 !important; }
            .fc-col-header-cell { font-size: 12px !important; font-weight: 500 !important; color: #666 !important; }
            .fc-daygrid-day-number { font-size: 12px !important; color: #666 !important; }
            .fc-toolbar { padding: 16px !important; }
            .fc-view-harness { padding: 0 !important; }
            .ph-holiday .fc-event-title { font-weight: 500 !important; }
          `}</style>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p style={{ fontSize: "13px", color: "#999" }}>
                Loading your schedule...
              </p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              height="auto"
              eventClick={(info) => {
                if (info.event.url) {
                  info.jsEvent.preventDefault();
                  window.open(info.event.url, "_blank");
                }
              }}
              eventContent={(arg) => {
                const isCompleted =
                  arg.event.extendedProps?.status === "completed";
                return (
                  <div
                    style={{
                      padding: "1px 4px",
                      fontSize: "11px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textDecoration: isCompleted ? "line-through" : "none",
                      opacity: isCompleted ? 0.75 : 1,
                      color: "#fff",
                      fontWeight: 500,
                    }}
                  >
                    {arg.event.title}
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div
        className="flex-shrink-0 flex flex-col gap-4"
        style={{ width: "240px" }}
      >
        {showSetup && (
          <CalendarSetup
            hasCanvasUrl={hasCanvasUrl}
            onCanvasSaved={() => {
              setHasCanvasUrl(true);
              fetchEvents();
            }}
            onCanvasRemoved={() => {
              setHasCanvasUrl(false);
              fetchEvents();
            }}
          />
        )}

        {/* Event sources legend */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
            Event sources
          </p>
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: 8, height: 8, background: item.color }}
              />
              <span className="text-xs flex-1" style={{ color: "#666" }}>
                {item.label}
              </span>
              {item.count !== null && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "#1a1a2e", fontFamily: "monospace" }}
                >
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Canvas setup prompt if not connected */}
        {!hasCanvasUrl && !showSetup && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: "rgba(226,75,74,0.05)",
              border: "0.5px solid rgba(226,75,74,0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E24B4A"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-xs font-medium" style={{ color: "#E24B4A" }}>
                Canvas not connected
              </p>
            </div>
            <p className="text-xs" style={{ color: "#666", lineHeight: 1.55 }}>
              Connect your Canvas iCal feed to automatically import your
              assignment deadlines.
            </p>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="text-xs py-2 rounded-xl font-medium text-white"
              style={{
                background: "#E24B4A",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Connect Canvas
            </button>
          </div>
        )}

        {/* Tip */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            background: "rgba(79,142,247,0.05)",
            border: "0.5px solid rgba(79,142,247,0.15)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "#4f8ef7" }}>
            Tip
          </p>
          <p className="text-xs" style={{ color: "#666", lineHeight: 1.55 }}>
            Tasks with due dates appear on the calendar. Completed tasks are
            shown with a strikethrough. Add due dates in the Task Manager to see
            them here.
          </p>
        </div>
      </div>
    </div>
  );
}
