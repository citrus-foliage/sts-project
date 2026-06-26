"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TimerSettings from "@/components/timer/TimerSettings";

type SessionType = "focus" | "short_break" | "long_break";

type Settings = {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
};

type Stats = {
  streak_days: number;
  longest_streak: number;
  total_focus_minutes: number;
  total_sessions_completed: number;
};

type Session = {
  id: string;
  session_type: SessionType;
  duration_minutes: number;
  completed: boolean;
  created_at: string;
};

const DEFAULT_SETTINGS: Settings = {
  focus_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sessions_before_long_break: 4,
};

const SESSION_LABELS: Record<SessionType, string> = {
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

const SESSION_COLORS: Record<SessionType, string> = {
  focus: "#4f8ef7",
  short_break: "#639922",
  long_break: "#7c5ce4",
};

export default function TimerPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Timer state
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [timeLeft, setTimeLeft] = useState(
    DEFAULT_SETTINGS.focus_duration * 60,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionStarted, setCurrentSessionStarted] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // ── Fetch initial data ──
  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, statsRes, sessionsRes] = await Promise.all([
        fetch("/api/timer/settings"),
        fetch("/api/timer/stats"),
        fetch("/api/timer/sessions"),
      ]);
      const [settingsData, statsData, sessionsData] = await Promise.all([
        settingsRes.json(),
        statsRes.json(),
        sessionsRes.json(),
      ]);
      if (settingsData.settings) {
        setSettings(settingsData.settings);
        setTimeLeft(settingsData.settings.focus_duration * 60);
      }
      if (statsData.stats) setStats(statsData.stats);
      if (sessionsData.sessions) setTodaySessions(sessionsData.sessions);
    } catch (err) {
      console.error("Fetch timer data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Timer logic ──
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const playSound = () => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  };

  const handleSessionComplete = async () => {
    playSound();
    const duration =
      sessionType === "focus"
        ? settings.focus_duration
        : sessionType === "short_break"
          ? settings.short_break_duration
          : settings.long_break_duration;

    try {
      await fetch("/api/timer/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_minutes: duration,
          session_type: sessionType,
          completed: true,
        }),
      });

      if (sessionType === "focus") {
        const newCount = sessionCount + 1;
        setSessionCount(newCount);

        // Determine next session type
        const nextType =
          newCount % settings.sessions_before_long_break === 0
            ? "long_break"
            : "short_break";

        setSessionType(nextType);
        setTimeLeft(
          nextType === "long_break"
            ? settings.long_break_duration * 60
            : settings.short_break_duration * 60,
        );
      } else {
        setSessionType("focus");
        setTimeLeft(settings.focus_duration * 60);
      }

      setCurrentSessionStarted(false);
      fetchData();
    } catch (err) {
      console.error("Save session error:", err);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setCurrentSessionStarted(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setCurrentSessionStarted(false);
    const duration =
      sessionType === "focus"
        ? settings.focus_duration
        : sessionType === "short_break"
          ? settings.short_break_duration
          : settings.long_break_duration;
    setTimeLeft(duration * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setCurrentSessionStarted(false);
    if (sessionType === "focus") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      const nextType =
        newCount % settings.sessions_before_long_break === 0
          ? "long_break"
          : "short_break";
      setSessionType(nextType);
      setTimeLeft(
        nextType === "long_break"
          ? settings.long_break_duration * 60
          : settings.short_break_duration * 60,
      );
    } else {
      setSessionType("focus");
      setTimeLeft(settings.focus_duration * 60);
    }
  };

  const handleSwitchSession = (type: SessionType) => {
    if (isRunning) return;
    setSessionType(type);
    setCurrentSessionStarted(false);
    setTimeLeft(
      type === "focus"
        ? settings.focus_duration * 60
        : type === "short_break"
          ? settings.short_break_duration * 60
          : settings.long_break_duration * 60,
    );
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    const res = await fetch("/api/timer/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSettings(newSettings);
    setTimeLeft(newSettings.focus_duration * 60);
    setSessionType("focus");
    setIsRunning(false);
    setCurrentSessionStarted(false);
    setShowSettings(false);
  };

  // ── Computed display values ──
  const totalDuration =
    sessionType === "focus"
      ? settings.focus_duration * 60
      : sessionType === "short_break"
        ? settings.short_break_duration * 60
        : settings.long_break_duration * 60;

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const color = SESSION_COLORS[sessionType];

  const todayFocusSessions = todaySessions.filter(
    (s) => s.session_type === "focus" && s.completed,
  );
  const todayMinutes = todayFocusSessions.reduce(
    (sum, s) => sum + s.duration_minutes,
    0,
  );

  const circumference = 2 * Math.PI * 90;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading timer...</p>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="max-w-lg mx-auto">
        <div
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <TimerSettings
            settings={settings}
            onSave={handleSaveSettings}
            onCancel={() => setShowSettings(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            Focus Timer
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            Stay focused. Take breaks. Build consistency.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
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
          Settings
        </button>
      </div>

      {/* ── Session type tabs ── */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        {(
          [
            { type: "focus", label: "Focus" },
            { type: "short_break", label: "Short Break" },
            { type: "long_break", label: "Long Break" },
          ] as { type: SessionType; label: string }[]
        ).map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => handleSwitchSession(tab.type)}
            disabled={isRunning}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background:
                sessionType === tab.type
                  ? SESSION_COLORS[tab.type]
                  : "transparent",
              color: sessionType === tab.type ? "#fff" : "#999",
              border: "none",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: isRunning && sessionType !== tab.type ? 0.4 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Timer display ── */}
      <div
        className="rounded-2xl flex flex-col items-center gap-6 py-10 px-6"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        {/* Circular progress */}
        <div style={{ position: "relative", width: 220, height: 220 }}>
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background ring */}
            <circle
              cx="110"
              cy="110"
              r="90"
              fill="none"
              stroke="#f0eff0"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="110"
              cy="110"
              r="90"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference - (progress / 100) * circumference
              }
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>

          {/* Center content */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "48px",
                fontWeight: 600,
                color: "#1a1a2e",
                fontFamily: "monospace",
                lineHeight: 1,
              }}
            >
              {minutes}:{seconds}
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color }}>
              {SESSION_LABELS[sessionType]}
            </p>
            {sessionCount > 0 && (
              <p className="text-xs mt-1" style={{ color: "#999" }}>
                Session {sessionCount + 1}
              </p>
            )}
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: settings.sessions_before_long_break }).map(
            (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width:
                    i < sessionCount % settings.sessions_before_long_break
                      ? 10
                      : 8,
                  height:
                    i < sessionCount % settings.sessions_before_long_break
                      ? 10
                      : 8,
                  background:
                    i < sessionCount % settings.sessions_before_long_break
                      ? color
                      : "#e5e5e5",
                }}
              />
            ),
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center rounded-xl transition-colors"
            style={{
              width: "44px",
              height: "44px",
              background: "#f5f4f0",
              border: "0.5px solid #ebebeb",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={isRunning ? handlePause : handleStart}
            className="flex items-center justify-center rounded-2xl text-white transition-all"
            style={{
              width: "72px",
              height: "72px",
              background: color,
              border: "none",
              cursor: "pointer",
              boxShadow: `0 4px 20px ${color}40`,
            }}
          >
            {isRunning ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center justify-center rounded-xl transition-colors"
            style={{
              width: "44px",
              height: "44px",
              background: "#f5f4f0",
              border: "0.5px solid #ebebeb",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        {/* Status message */}
        <p className="text-xs" style={{ color: "#999", textAlign: "center" }}>
          {!currentSessionStarted
            ? "Press play to start your session"
            : isRunning
              ? sessionType === "focus"
                ? "Stay focused — you got this 💪"
                : "Take a breather 🌿"
              : "Paused — resume when ready"}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Today's sessions",
            value: todayFocusSessions.length.toString(),
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <polyline points="3 6 4 7 6 5" />
                <polyline points="3 12 4 13 6 11" />
                <polyline points="3 18 4 19 6 17" />
              </svg>
            ),
          },
          {
            label: "Today's focus time",
            value: `${todayMinutes}m`,
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            label: "Activity streak",
            value: `${stats?.streak_days ?? 0}d`,
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            ),
          },
          {
            label: "Total sessions",
            value: (stats?.total_sessions_completed ?? 0).toString(),
            icon: (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <div
              className="flex items-center gap-1.5 mb-1"
              style={{ color: "#666" }}
            >
              {stat.icon}
              <span style={{ fontSize: "11px" }}>{stat.label}</span>
            </div>
            <p
              className="font-medium"
              style={{
                fontSize: "20px",
                color: "#1a1a2e",
                fontFamily: "monospace",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Today's session log ── */}
      {todaySessions.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div
            className="px-5 py-3"
            style={{
              borderBottom: "0.5px solid #ebebeb",
              background: "#fafafa",
            }}
          >
            <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
              Today&apos;s sessions
            </p>
          </div>
          {todaySessions.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-5 py-3"
              style={{
                borderBottom:
                  i < todaySessions.length - 1 ? "0.5px solid #f5f4f0" : "none",
              }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  background: SESSION_COLORS[s.session_type],
                }}
              />
              <span className="text-xs flex-1" style={{ color: "#1a1a2e" }}>
                {SESSION_LABELS[s.session_type]}
              </span>
              <span className="text-xs" style={{ color: "#999" }}>
                {s.duration_minutes} min
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: s.completed
                    ? "rgba(99,153,34,0.1)"
                    : "rgba(186,117,23,0.1)",
                  color: s.completed ? "#639922" : "#BA7517",
                }}
              >
                {s.completed ? "Completed" : "Incomplete"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
