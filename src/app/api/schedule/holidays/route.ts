import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
// @ts-expect-error ical.js has no type declarations
import ICAL from "ical.js";

const PH_HOLIDAYS_ICAL_URL =
  "https://calendar.google.com/calendar/ical/en.philippines%23holiday%40group.v.calendar.google.com/public/basic.ics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(PH_HOLIDAYS_ICAL_URL, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Philippine holidays" },
        { status: 500 },
      );
    }

    const icalText = await res.text();
    const jcalData = ICAL.parse(icalText);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const nowStr = now.toISOString().slice(0, 10);
    const laterStr = oneYearLater.toISOString().slice(0, 10);

    const events = vevents
      .map((vevent: ICAL.Component) => {
        const event = new ICAL.Event(vevent);
        const startTime = event.startDate;

        const dateStr = startTime
          ? `${startTime.year}-${String(startTime.month).padStart(2, "0")}-${String(startTime.day).padStart(2, "0")}`
          : undefined;

        return {
          id: `holiday_${event.uid}`,
          title: `🇵🇭 ${event.summary}`,
          start: dateStr,
          allDay: true,
          source: "holiday",
          backgroundColor: "#7C3AED",
          borderColor: "#7C3AED",
          textColor: "#fff",
          classNames: ["ph-holiday"],
        };
      })
      .filter((e: { start?: string }) => {
        if (!e.start) return false;
        return e.start >= nowStr && e.start <= laterStr;
      });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("PH holidays fetch error:", err);
    return NextResponse.json(
      { error: "Failed to parse Philippine holidays" },
      { status: 500 },
    );
  }
}
