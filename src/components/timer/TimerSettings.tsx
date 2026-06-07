"use client";

import { useState } from "react";

type Settings = {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
};

type Props = {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  onCancel: () => void;
};

export default function TimerSettings({ settings, onSave, onCancel }: Props) {
  const [focus, setFocus] = useState(settings.focus_duration.toString());
  const [shortBreak, setShortBreak] = useState(
    settings.short_break_duration.toString(),
  );
  const [longBreak, setLongBreak] = useState(
    settings.long_break_duration.toString(),
  );
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(
    settings.sessions_before_long_break.toString(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const parsed = {
      focus_duration: parseInt(focus),
      short_break_duration: parseInt(shortBreak),
      long_break_duration: parseInt(longBreak),
      sessions_before_long_break: parseInt(sessionsBeforeLong),
    };

    if (Object.values(parsed).some((v) => isNaN(v) || v < 1)) {
      setError("All values must be positive numbers");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    border: "1px solid #e5e5e5",
    background: "#fafafa",
    fontFamily: "inherit",
    color: "#1a1a2e",
    width: "80px",
    textAlign: "right" as const,
  };

  const fields = [
    {
      label: "Focus duration",
      sub: "minutes per session",
      value: focus,
      onChange: setFocus,
    },
    {
      label: "Short break",
      sub: "minutes",
      value: shortBreak,
      onChange: setShortBreak,
    },
    {
      label: "Long break",
      sub: "minutes",
      value: longBreak,
      onChange: setLongBreak,
    },
    {
      label: "Sessions before long break",
      sub: "focus sessions",
      value: sessionsBeforeLong,
      onChange: setSessionsBeforeLong,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
          Timer Settings
        </p>
        <p className="text-xs mt-1" style={{ color: "#666" }}>
          Customize your focus and break durations.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
          >
            <div>
              <p className="text-sm" style={{ color: "#1a1a2e" }}>
                {field.label}
              </p>
              <p className="text-xs" style={{ color: "#999" }}>
                {field.sub}
              </p>
            </div>
            <input
              type="number"
              min="1"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

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
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{
            background: saving ? "#ccc" : "#1a1a2e",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
