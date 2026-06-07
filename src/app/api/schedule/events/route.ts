import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Fetch tasks with due dates
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id, title, due_date, status, priority")
    .eq("user_id", userId)
    .not("due_date", "is", null);

  const taskEvents = (tasks ?? []).map((task) => {
    const isCompleted = task.status === "completed";
    const priorityColors: Record<string, string> = {
      high: "#A32D2D",
      medium: "#BA7517",
      low: "#639922",
    };
    const color = isCompleted
      ? "#bbb"
      : (priorityColors[task.priority] ?? "#999");

    return {
      id: `task_${task.id}`,
      title: task.title,
      start: task.due_date,
      allDay: true,
      source: "task",
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
  });

  // Fetch Google Calendar events (server to server)
  let googleEvents: unknown[] = [];
  if (session.accessToken) {
    try {
      const res = await fetch(`${baseUrl}/api/schedule/google-events`, {
        headers: { Cookie: "" },
      });
      if (res.ok) {
        const data = await res.json();
        googleEvents = data.events ?? [];
      }
    } catch {
      // Google Calendar unavailable — continue without it
    }
  }

  // Fetch Canvas events (server to server)
  let canvasEvents: unknown[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/schedule/canvas`, {
      headers: { Cookie: "" },
    });
    if (res.ok) {
      const data = await res.json();
      canvasEvents = data.events ?? [];
    }
  } catch {
    // Canvas iCal unavailable — continue without it
  }

  return NextResponse.json({
    events: [...taskEvents, ...googleEvents, ...canvasEvents],
    sources: {
      tasks: taskEvents.length,
      google: googleEvents.length,
      canvas: canvasEvents.length,
    },
  });
}
