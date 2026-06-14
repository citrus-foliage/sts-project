"use client";

import { useState } from "react";

type Props = {
  hasCanvasUrl: boolean;
  onCanvasSaved: () => void;
  onCanvasRemoved: () => void;
};

export default function CalendarSetup({
  hasCanvasUrl,
  onCanvasSaved,
  onCanvasRemoved,
}: Props) {
  const [showCanvasForm, setShowCanvasForm] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveCanvas = async () => {
    if (!canvasUrl.trim()) {
      setError("Please paste your Canvas iCal URL");
      return;
    }
    if (!canvasUrl.includes(".ics")) {
      setError(
        "This does not look like a valid iCal URL. Make sure it ends in .ics",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/schedule/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas_ical_url: canvasUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCanvasUrl("");
      setShowCanvasForm(false);
      onCanvasSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCanvas = async () => {
    setRemoving(true);
    await fetch("/api/schedule/canvas", { method: "DELETE" });
    setRemoving(false);
    onCanvasRemoved();
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
    >
      <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
        Calendar Integrations
      </p>

      {/* Google Calendar */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(79,142,247,0.1)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
            Google Calendar
          </p>
          <p className="text-xs" style={{ color: "#666" }}>
            Connected via your CIIT Google account
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
          style={{ background: "rgba(99,153,34,0.1)", color: "#639922" }}
        >
          Active
        </span>
      </div>

      {/* Canvas iCal */}
      <div className="flex flex-col gap-3">
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
        >
          {/* Top row — always visible */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(226,75,74,0.1)" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E24B4A"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                Canvas Instructure
              </p>
              <p className="text-xs" style={{ color: "#666", lineHeight: 1.4 }}>
                {hasCanvasUrl
                  ? "iCal feed connected — deadlines imported automatically"
                  : "Paste your Canvas iCal URL to import deadlines"}
              </p>
            </div>
            {/* Status badge — right side, always visible */}
            {hasCanvasUrl && (
              <span
                className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                style={{ background: "rgba(99,153,34,0.1)", color: "#639922" }}
              >
                Active
              </span>
            )}
            {!hasCanvasUrl && (
              <button
                type="button"
                onClick={() => setShowCanvasForm(true)}
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{
                  background: "#1a1a2e",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Connect
              </button>
            )}
          </div>

          {/* Remove button — separate row below, only when connected */}
          {hasCanvasUrl && (
            <div
              style={{
                borderTop: "0.5px solid #ebebeb",
                padding: "8px 16px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={handleRemoveCanvas}
                disabled={removing}
                style={{
                  background: "none",
                  border: "none",
                  cursor: removing ? "not-allowed" : "pointer",
                  color: removing ? "#bbb" : "#A32D2D",
                  fontFamily: "inherit",
                  fontSize: "11px",
                  padding: 0,
                }}
              >
                {removing ? "Removing..." : "Disconnect"}
              </button>
            </div>
          )}
        </div>

        {/* Canvas URL form */}
        {showCanvasForm && !hasCanvasUrl && (
          <div className="flex flex-col gap-3 px-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#555" }}>
                Canvas iCal URL
              </label>
              <input
                type="url"
                placeholder="https://ciit.instructure.com/feeds/calendars/user_..."
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-xs outline-none"
                style={{
                  border: "1px solid #e5e5e5",
                  background: "#fafafa",
                  fontFamily: "inherit",
                }}
              />
              <p className="text-xs" style={{ color: "#999", lineHeight: 1.5 }}>
                In Canvas: go to <strong>Calendar → Calendar Feed</strong> and
                copy the iCal link. It ends in .ics
              </p>
            </div>
            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCanvasForm(false);
                  setError("");
                  setCanvasUrl("");
                }}
                className="flex-1 py-2 rounded-xl text-xs"
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
                onClick={handleSaveCanvas}
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-white"
                style={{
                  background: saving ? "#ccc" : "#1a1a2e",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {saving ? "Connecting..." : "Save & import"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium" style={{ color: "#999" }}>
          Event colors
        </p>
        {[
          { color: "#4f8ef7", label: "Google Calendar" },
          { color: "#E24B4A", label: "Canvas deadlines" },
          { color: "#B91C1C", label: "High priority tasks" },
          { color: "#B45309", label: "Medium priority tasks" },
          { color: "#166534", label: "Low priority tasks" },
          { color: "#6B7280", label: "Completed tasks" },
          { color: "#7C3AED", label: "PH Public Holidays" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, background: item.color }}
            />
            <span className="text-xs" style={{ color: "#666" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
