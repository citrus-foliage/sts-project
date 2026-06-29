"use client";

import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CalendarSetup from "@/components/schedule/CalendarSetup";
import FeatureHidden from "@/components/layout/FeatureHidden";

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

function fmt12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#B91C1C",
  medium: "#B45309",
  low: "#166534",
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

  const [showFeature, setShowFeature] = useState(true);
  const [checkingFeature, setCheckingFeature] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.show_schedule === false) setShowFeature(false);
      })
      .catch(() => {})
      .finally(() => setCheckingFeature(false));
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const canvasRes = await fetch("/api/schedule/canvas");
      const canvasData = await canvasRes.json();
      setHasCanvasUrl(canvasData.hasUrl ?? false);

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

      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();

      // Task events: timed tasks (with due_time) are placed in the hourly grid;
      // tasks without a due_time remain allDay chips in the all-day banner.
      const taskEvents: CalendarEvent[] = (tasksData.tasks ?? [])
        .filter((t: { due_date?: string }) => t.due_date)
        .map(
          (task: {
            id: string;
            title: string;
            due_date: string;
            due_time?: string;
            status: string;
            priority: string;
          }) => {
            const isCompleted = task.status === "completed";
            const color = isCompleted
              ? "#6B7280"
              : (PRIORITY_COLORS[task.priority] ?? "#555");
            const hasDueTime = !!task.due_time;
            const start = hasDueTime
              ? `${task.due_date}T${task.due_time}`
              : task.due_date;

            return {
              id: `task_${task.id}`,
              title: task.title,
              start,
              allDay: !hasDueTime,
              source: "task" as const,
              completed: isCompleted,
              backgroundColor: color,
              borderColor: color,
              textColor: "#fff",
              classNames: [
                "slm-deadline",
                ...(isCompleted ? ["task-completed"] : []),
              ],
              extendedProps: {
                type: "task",
                status: task.status,
                priority: task.priority,
                due_time: task.due_time ?? null,
              },
            };
          },
        );

      // Fetch which Canvas events the user has manually marked done
      let completedUids = new Set<string>();
      try {
        const completionsRes = await fetch("/api/schedule/canvas-completions");
        if (completionsRes.ok) {
          const completionsData = await completionsRes.json();
          completedUids = new Set<string>(completionsData.completedUids ?? []);
        }
      } catch {
        // Completions unavailable — continue without them
      }

      // Canvas events: already allDay from route — tag as deadline chips
      const canvasEvts: CalendarEvent[] = (canvasData.events ?? []).map(
        (evt: CalendarEvent) => {
          const uid = evt.extendedProps?.uid as string | undefined;
          const isCompleted = !!uid && completedUids.has(uid);
          return {
            ...evt,
            classNames: [
              ...(evt.classNames ?? []),
              "slm-deadline",
              ...(isCompleted ? ["task-completed"] : []),
            ],
            extendedProps: {
              ...(evt.extendedProps ?? {}),
              type: "canvas",
              status: isCompleted ? "completed" : "pending",
            },
          };
        },
      );

      // Holidays: already allDay — tag as deadline chips
      let holidayEvts: CalendarEvent[] = [];
      try {
        const holidaysRes = await fetch("/api/schedule/holidays");
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          holidayEvts = (holidaysData.events ?? []).map(
            (evt: CalendarEvent) => ({
              ...evt,
              classNames: [...(evt.classNames ?? []), "slm-deadline"],
              extendedProps: {
                ...(evt.extendedProps ?? {}),
                type: "holiday",
              },
            }),
          );
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
    { label: "Canvas Calendar", count: sources.canvas, color: "#E24B4A" },
    { label: "PH Public Holidays", count: sources.holidays, color: "#7C3AED" },
  ];

  if (checkingFeature) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[13px] text-[#999]">Loading...</p>
      </div>
    );
  }

  if (!showFeature) {
    return <FeatureHidden featureName="Schedule" />;
  }

  return (
    <div className="flex gap-5 items-start">
      {/* Main calendar */}
      <div className="flex flex-col gap-4 flex-1 min-w-0 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Schedule</h1>
            <p className="text-sm mt-1 text-[#666]">
              {loading
                ? "Loading your schedule..."
                : `${totalEvents} events — ${sources.tasks} tasks, ${sources.google} from Google, ${sources.canvas} from Canvas`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSetup(!showSetup)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs flex-shrink-0 bg-white border border-[#ebebeb] text-[#666] cursor-pointer font-[inherit]"
            style={{ borderWidth: "0.5px" }}
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
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-[#BA7517] bg-[rgba(186,117,23,0.08)]"
            style={{ border: "0.5px solid rgba(186,117,23,0.2)" }}
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
          className="rounded-2xl overflow-hidden bg-white"
          style={{ border: "0.5px solid #ebebeb" }}
        >
          <style>{`
            .fc { font-family: 'DM Sans', sans-serif; }
            .fc-toolbar-title { font-size: 15px !important; font-weight: 500 !important; color: #1a1a2e !important; }
            .fc-button { font-family: 'DM Sans', sans-serif !important; font-size: 12px !important; border-radius: 8px !important; }
            .fc-button-primary { background: #1a1a2e !important; border-color: #1a1a2e !important; }
            .fc-button-primary:hover { background: #2d2d4e !important; }
            .fc-button-active { background: #4f8ef7 !important; border-color: #4f8ef7 !important; }

            /* Today indicators */
            .fc-day-today { background: transparent !important; border-top: 2px solid #4f8ef7 !important; }
            .fc-day-today .fc-daygrid-day-number { color: #4f8ef7 !important; font-weight: 700 !important; }
            .fc-timegrid-col.fc-day-today { background: rgba(79,142,247,0.03) !important; }
            .fc-col-header-cell.fc-day-today { background: transparent !important; }
            .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion { color: #4f8ef7 !important; font-weight: 700 !important; }

            /* Timed events (Google Calendar) */
            .fc-timegrid-event { border-radius: 6px !important; font-size: 11px !important; cursor: pointer !important; }
            .fc-event { opacity: 1 !important; }
            .fc-event.task-completed { opacity: 0.65 !important; }

            /* Deadline chips (tasks, canvas, holidays) —
               Strip FullCalendar's default background so the custom chip shows through.
               Only .slm-deadline events get this treatment — Google Calendar timed
               events in month view keep their solid colored background. */
            .slm-deadline.fc-event { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
            .slm-deadline.fc-daygrid-event { margin: 1px 2px !important; }

            /* All-day row in timeGrid views */
            .fc-timegrid-all-day-main { padding: 3px 0 !important; }
            .fc-daygrid-event-harness { margin-bottom: 2px !important; }

            /*  Typography */
            .fc-col-header-cell { font-size: 12px !important; font-weight: 500 !important; color: #666 !important; }
            .fc-daygrid-day-number { font-size: 12px !important; color: #666 !important; }
            .fc-toolbar { padding: 16px !important; }
            .fc-view-harness { padding: 0 !important; }
            .fc-timegrid-slot-label { font-size: 11px !important; color: #999 !important; }
          `}</style>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-[13px] text-[#999]">
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
              scrollTime="00:00:00"
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              eventClick={(info) => {
                if (info.event.url) {
                  info.jsEvent.preventDefault();
                  window.open(info.event.url, "_blank");
                  return;
                }
                // Toggle completion for Canvas events on click
                if (info.event.extendedProps?.type === "canvas") {
                  const uid = info.event.extendedProps?.uid as
                    | string
                    | undefined;
                  if (uid) {
                    fetch("/api/schedule/canvas-completions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ uid }),
                    }).then(() => fetchEvents());
                  }
                }
              }}
              eventContent={(arg) => {
                const type = arg.event.extendedProps?.type as
                  | string
                  | undefined;
                const isCompleted =
                  arg.event.extendedProps?.status === "completed";
                const dueTime = arg.event.extendedProps?.due_time as
                  | string
                  | null
                  | undefined;
                const bgColor = arg.event.backgroundColor ?? "#555";

                // Deadline chip: tasks (allDay or timed), canvas, holidays.
                // Timed tasks land in the hourly grid but keep the chip style
                // so they stay visually consistent with their allDay siblings.
                if (
                  type === "task" ||
                  type === "canvas" ||
                  type === "holiday" ||
                  arg.event.allDay
                ) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 6px 2px 5px",
                        borderRadius: "5px",
                        background: bgColor + "18",
                        border: `0.5px solid ${bgColor}55`,
                        overflow: "hidden",
                        width: "100%",
                        boxSizing: "border-box",
                        cursor: "pointer",
                      }}
                    >
                      {/* Color dot */}
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: bgColor,
                          flexShrink: 0,
                        }}
                      />
                      {/* Title */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#1a1a2e",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: isCompleted ? "line-through" : "none",
                          opacity: isCompleted ? 0.65 : 1,
                        }}
                      >
                        {arg.event.title}
                      </span>
                      {/* Time badge — shown on allDay task chips (month view) only;
                          timed tasks already sit at the correct slot in week/day view */}
                      {type === "task" &&
                        dueTime &&
                        !isCompleted &&
                        arg.event.allDay && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              color: bgColor,
                              background: bgColor + "20",
                              padding: "1px 4px",
                              borderRadius: "4px",
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt12h(dueTime)}
                          </span>
                        )}
                    </div>
                  );
                }

                // Timed event (Google Calendar — in the hourly grid)
                return (
                  <div
                    style={{
                      padding: "1px 4px",
                      fontSize: "11px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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

      {/* Right sidebar */}
      <div className="flex-shrink-0 flex flex-col gap-4 w-60">
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
          className="rounded-2xl p-4 flex flex-col gap-3 bg-white"
          style={{ border: "0.5px solid #ebebeb" }}
        >
          <p className="text-xs font-medium text-[#1a1a2e]">Event sources</p>
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="rounded-full flex-shrink-0 size-2"
                style={{ background: item.color }}
              />
              <span className="text-xs flex-1 text-[#666]">{item.label}</span>
              {item.count !== null && (
                <span className="text-xs font-medium text-[#1a1a2e] font-mono">
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Canvas setup prompt if not connected */}
        {!hasCanvasUrl && !showSetup && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3 bg-[rgba(226,75,74,0.05)]"
            style={{ border: "0.5px solid rgba(226,75,74,0.15)" }}
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
              <p className="text-xs font-medium text-[#E24B4A]">
                Canvas not connected
              </p>
            </div>
            <p className="text-xs text-[#666] leading-[1.55]">
              Connect your Canvas iCal feed to automatically import your
              assignment deadlines.
            </p>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="text-xs py-2 rounded-xl font-medium text-white bg-[#E24B4A] cursor-pointer font-[inherit]"
            >
              Connect Canvas
            </button>
          </div>
        )}

        {/* Tip */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2 bg-[rgba(79,142,247,0.05)]"
          style={{ border: "0.5px solid rgba(79,142,247,0.15)" }}
        >
          <p className="text-xs font-medium text-[#4f8ef7]">Tip</p>
          <p className="text-xs text-[#666] leading-[1.55]">
            Tasks and Canvas deadlines appear as chips on their due date. Google
            Calendar events appear in the time grid. Tasks with a due time
            appear at their time slot in week/day view. Click a Canvas event to
            mark it as done.
          </p>
        </div>
      </div>
    </div>
  );
}
