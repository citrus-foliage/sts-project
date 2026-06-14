import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  const { data, error } = await supabaseAdmin
    .from("tasks_with_subtask_count")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const taskIds = (data ?? []).map((t) => t.id);
  let subtasks: Record<string, unknown[]> = {};

  if (taskIds.length > 0) {
    const { data: subtaskData } = await supabaseAdmin
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds)
      .order("position", { ascending: true });

    subtasks = (subtaskData ?? []).reduce(
      (acc, s) => {
        if (!acc[s.task_id]) acc[s.task_id] = [];
        acc[s.task_id].push(s);
        return acc;
      },
      {} as Record<string, unknown[]>,
    );
  }

  const tasks = (data ?? []).map((t) => ({
    ...t,
    subtasks: subtasks[t.id] ?? [],
  }));

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { title, description, status, priority, category_id, due_date } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .eq("status", status ?? "todo")
    .order("position", { ascending: false })
    .limit(1);

  const position =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description: description ?? null,
      status: status ?? "todo",
      priority: priority ?? "medium",
      category_id: category_id ?? null,
      due_date: due_date ?? null,
      position,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
