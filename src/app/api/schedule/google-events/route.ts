import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "No Google Calendar access token found. Please sign out and sign in again.",
      },
      { status: 403 },
    );
  }

  // Fetch 3 months of events
  const now = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: threeMonthsLater.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "200",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json(
      { error: err.error?.message ?? "Failed to fetch Google Calendar events" },
      { status: res.status },
    );
  }

  const data = await res.json();

  const events = (data.items ?? []).map(
    (event: {
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      htmlLink?: string;
    }) => ({
      id: `google_${event.id}`,
      title: event.summary ?? "(No title)",
      start: event.start?.dateTime ?? event.start?.date,
      end: event.end?.dateTime ?? event.end?.date,
      url: event.htmlLink,
      source: "google",
      backgroundColor: "#4f8ef7",
      borderColor: "#4f8ef7",
      textColor: "#fff",
    }),
  );

  return NextResponse.json({ events });
}
