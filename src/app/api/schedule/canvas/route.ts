import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
// @ts-ignore
import ICAL from "ical.js";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  // Get stored Canvas iCal URL
  const { data: settings } = await supabaseAdmin
    .from("calendar_settings")
    .select("canvas_ical_url")
    .eq("user_id", userId)
    .single();

  if (!settings?.canvas_ical_url) {
    return NextResponse.json({ events: [], hasUrl: false });
  }

  try {
    // Fetch the iCal file
    const icalRes = await fetch(settings.canvas_ical_url);
    if (!icalRes.ok) {
      return NextResponse.json(
        {
          error:
            "Failed to fetch Canvas calendar. Your iCal URL may be invalid or expired.",
        },
        { status: 400 },
      );
    }

    const icalText = await icalRes.text();
    const jcalData = ICAL.parse(icalText);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const events = vevents
      .map((vevent: ICAL.Component) => {
        const event = new ICAL.Event(vevent);
        const startDate = event.startDate?.toJSDate();
        const endDate = event.endDate?.toJSDate();
        return {
          id: `canvas_${event.uid}`,
          title: event.summary ?? "(No title)",
          start: startDate?.toISOString(),
          end: endDate?.toISOString(),
          source: "canvas",
          backgroundColor: "#E24B4A",
          borderColor: "#E24B4A",
          textColor: "#fff",
        };
      })
      .filter((e: { start?: string }) => {
        if (!e.start) return false;
        const d = new Date(e.start);
        return d >= now && d <= threeMonthsLater;
      });

    return NextResponse.json({ events, hasUrl: true });
  } catch (err) {
    console.error("Canvas iCal parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse Canvas calendar." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;
  const body = await req.json();
  const { canvas_ical_url } = body;

  if (!canvas_ical_url) {
    return NextResponse.json(
      { error: "canvas_ical_url is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("calendar_settings")
    .upsert({ user_id: userId, canvas_ical_url }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  await supabaseAdmin
    .from("calendar_settings")
    .update({ canvas_ical_url: null })
    .eq("user_id", userId);

  return NextResponse.json({ success: true });
}
