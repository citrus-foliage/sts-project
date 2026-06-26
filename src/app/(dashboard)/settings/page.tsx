"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "general" | "notifications" | "privacy" | "account";

type UserSettings = {
  display_name: string;
  notify_task_reminders: boolean;
  notify_budget_alerts: boolean;
  notify_daily_budget: boolean;
  notify_forum_replies: boolean;
  forum_default_anonymous: boolean;
  forum_show_display_name: boolean;
};

type CalendarSettings = {
  canvas_ical_url: string | null;
};

const DEFAULT_SETTINGS: UserSettings = {
  display_name: "",
  notify_task_reminders: true,
  notify_budget_alerts: true,
  notify_daily_budget: true,
  notify_forum_replies: true,
  forum_default_anonymous: true,
  forum_show_display_name: false,
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] =
    useState<UserSettings>(DEFAULT_SETTINGS);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    canvas_ical_url: null,
  });
  const [canvasUrl, setCanvasUrl] = useState("");
  const [showCanvasForm, setShowCanvasForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingCanvas, setSavingCanvas] = useState(false);
  const [removingCanvas, setRemovingCanvas] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);

  const originalPushStateRef = useRef<typeof window.history.pushState | null>(
    null,
  );
  const navigatingRef = useRef(false);

  // Compute whether there are unsaved changes
  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // ── Fetch settings ──
  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, canvasRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/schedule/canvas"),
      ]);
      const [settingsData, canvasData] = await Promise.all([
        settingsRes.json(),
        canvasRes.json(),
      ]);
      if (settingsData.settings) {
        const loaded: UserSettings = {
          ...DEFAULT_SETTINGS,
          ...settingsData.settings,
          display_name:
            settingsData.settings.display_name ?? session?.user?.name ?? "",
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      }
      setCalendarSettings({
        canvas_ical_url: canvasData.hasUrl ? "connected" : null,
      });
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchSettings();
  }, [session, fetchSettings]);

  // ── Browser navigation guard (tab close / reload) ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── In-app navigation guard (sidebar links) ──
  useEffect(() => {
    if (!isDirty) {
      if (originalPushStateRef.current) {
        window.history.pushState = originalPushStateRef.current;
        originalPushStateRef.current = null;
      }
      return;
    }

    if (!originalPushStateRef.current) {
      originalPushStateRef.current = window.history.pushState.bind(
        window.history,
      );
    }

    window.history.pushState = function (
      state: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      if (navigatingRef.current) {
        originalPushStateRef.current?.(state, unused, url as string);
        return;
      }
      setPendingNavUrl(url?.toString() ?? null);
      setShowUnsavedModal(true);
    };

    return () => {
      if (originalPushStateRef.current) {
        window.history.pushState = originalPushStateRef.current;
        originalPushStateRef.current = null;
      }
    };
  }, [isDirty]);

  // ── Handlers ──
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(savedSettings);
  };

  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    navigatingRef.current = true;
    if (pendingNavUrl) {
      router.push(pendingNavUrl);
    }
    setTimeout(() => {
      navigatingRef.current = false;
    }, 200);
  };

  const handleStayOnPage = () => {
    setShowUnsavedModal(false);
    setPendingNavUrl(null);
  };

  const handleSaveCanvas = async () => {
    if (!canvasUrl.trim() || !canvasUrl.includes(".ics")) return;
    setSavingCanvas(true);
    try {
      const res = await fetch("/api/schedule/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas_ical_url: canvasUrl.trim() }),
      });
      if (res.ok) {
        setCalendarSettings({ canvas_ical_url: "connected" });
        setCanvasUrl("");
        setShowCanvasForm(false);
      }
    } catch (err) {
      console.error("Save canvas error:", err);
    } finally {
      setSavingCanvas(false);
    }
  };

  const handleRemoveCanvas = async () => {
    setRemovingCanvas(true);
    try {
      await fetch("/api/schedule/canvas", { method: "DELETE" });
      setCalendarSettings({ canvas_ical_url: null });
    } catch (err) {
      console.error("Remove canvas error:", err);
    } finally {
      setRemovingCanvas(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch("/api/settings/account", { method: "DELETE" });
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleting(false);
    }
  };

  const update = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => setSettings((prev) => ({ ...prev, [key]: value }));

  // ── Reusable UI pieces ──

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "11px",
        background: value ? "#4f8ef7" : "#e5e5e5",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );

  const Row = ({
    label,
    value,
    desc,
    action,
    noBorder,
  }: {
    label: string;
    value?: React.ReactNode;
    desc?: string;
    action?: React.ReactNode;
    noBorder?: boolean;
  }) => (
    <div
      style={{
        padding: "18px 0",
        borderBottom: noBorder ? "none" : "0.5px solid #f5f4f0",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? "10px" : "0",
      }}
    >
      <div style={{ width: isMobile ? "100%" : "200px", flexShrink: 0 }}>
        <p style={{ fontSize: "13px", color: "#1a1a2e", fontWeight: 500 }}>
          {label}
        </p>
        {desc && (
          <p
            style={{
              fontSize: "11px",
              color: "#999",
              marginTop: "2px",
              lineHeight: 1.5,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      <div style={{ flex: 1, width: isMobile ? "100%" : undefined }}>
        {value && (
          <div style={{ fontSize: "13px", color: "#555" }}>{value}</div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <p
      style={{
        fontSize: "13px",
        fontWeight: 600,
        color: "#1a1a2e",
        marginBottom: "4px",
        marginTop: "32px",
      }}
    >
      {title}
    </p>
  );

  // Save / Cancel bar — only renders when there are unsaved changes
  const SaveBar = () =>
    isDirty ? (
      <div
        className="flex items-center justify-end gap-3 pt-6 mt-6"
        style={{ borderTop: "0.5px solid #ebebeb" }}
      >
        <button
          type="button"
          onClick={handleCancel}
          style={{
            padding: "9px 20px",
            borderRadius: "9px",
            border: "0.5px solid #e5e5e5",
            background: "#fff",
            color: "#666",
            fontSize: "13px",
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
          style={{
            padding: "9px 20px",
            borderRadius: "9px",
            border: "none",
            background: saved ? "#639922" : saving ? "#ccc" : "#1a1a2e",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    ) : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "notifications", label: "Notifications" },
    { id: "privacy", label: "Privacy" },
    { id: "account", label: "Account" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* ── Unsaved changes modal ── */}
      {showUnsavedModal && (
        <>
          <div
            onClick={handleStayOnPage}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              background: "#fff",
              borderRadius: "16px",
              padding: isMobile ? "24px 20px" : "28px 32px",
              width: "min(380px, calc(100vw - 32px))",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(186,117,23,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#BA7517"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#1a1a2e",
                marginBottom: "8px",
              }}
            >
              You have unsaved changes
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#666",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              Your changes to Settings haven&apos;t been saved yet. If you leave
              now, your changes will be lost.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStayOnPage}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: "9px",
                  border: "0.5px solid #e5e5e5",
                  background: "#fff",
                  fontSize: "13px",
                  color: "#1a1a2e",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Stay on page
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: "9px",
                  border: "none",
                  background: "#A32D2D",
                  fontSize: "13px",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Leave anyway
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            {session?.user?.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            Manage your details and personal preferences here.
          </p>
        </div>
        {/* Unsaved indicator badge */}
        {isDirty && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "rgba(186,117,23,0.08)",
              border: "0.5px solid rgba(186,117,23,0.2)",
              color: "#BA7517",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#BA7517",
                flexShrink: 0,
              }}
            />
            Unsaved changes
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1"
        style={{
          borderBottom: "0.5px solid #ebebeb",
          marginBottom: "24px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? "8px 12px" : "8px 18px",
              border: "none",
              background: "transparent",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#1a1a2e" : "#888",
              cursor: "pointer",
              fontFamily: "inherit",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #1a1a2e"
                  : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: General
      ══════════════════════════════════════════ */}
      {activeTab === "general" && (
        <div>
          {/* Profile section */}
          <SectionTitle title="Profile" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            {/* Photo */}
            <Row
              label="Photo"
              value={
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: "40px", height: "40px" }}
                >
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#4f8ef7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      {session?.user?.name?.charAt(0).toUpperCase() ?? "S"}
                    </div>
                  )}
                </div>
              }
              action={
                <button
                  type="button"
                  disabled
                  style={{
                    padding: "5px 14px",
                    borderRadius: "7px",
                    border: "0.5px solid #e5e5e5",
                    background: "#fafafa",
                    fontSize: "12px",
                    color: "#bbb",
                    cursor: "not-allowed",
                    fontFamily: "inherit",
                  }}
                >
                  Edit
                </button>
              }
            />

            {/* Full name */}
            <Row
              label="Name"
              desc="Synced from your Google account"
              value={session?.user?.name ?? "—"}
            />

            {/* Display name */}
            <Row
              label="Display name"
              desc="Used in greetings and email notifications"
              value={
                <input
                  type="text"
                  value={settings.display_name}
                  onChange={(e) => update("display_name", e.target.value)}
                  placeholder="How should we address you?"
                  style={{
                    border: "0.5px solid #e5e5e5",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    color: "#1a1a2e",
                    background: "#fafafa",
                    outline: "none",
                    width: "220px",
                  }}
                />
              }
            />

            {/* Email */}
            <Row
              label="Email address"
              noBorder
              value={
                <div className="flex items-center gap-2">
                  <span>{session?.user?.email}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: "rgba(99,153,34,0.1)",
                      color: "#639922",
                      border: "0.5px solid rgba(99,153,34,0.2)",
                    }}
                  >
                    Verified
                  </span>
                </div>
              }
              desc="Your CIIT email cannot be changed"
            />
          </div>

          {/* Preferences section */}
          <SectionTitle title="Preferences" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            {/* Google Calendar */}
            <Row
              label="Google Calendar"
              desc="Connected via your CIIT Google account"
              value={
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#639922",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#639922" }}>
                    Connected
                  </span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() =>
                    window.open("https://myaccount.google.com", "_blank")
                  }
                  style={{
                    padding: "5px 14px",
                    borderRadius: "7px",
                    border: "0.5px solid #e5e5e5",
                    background: "#fff",
                    fontSize: "12px",
                    color: "#444",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Manage
                </button>
              }
            />

            {/* Canvas iCal */}
            <div
              style={{
                padding: "18px 0",
                borderBottom: "0.5px solid #f5f4f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "10px" : "0",
                }}
              >
                <div style={{ width: isMobile ? "100%" : "200px", flexShrink: 0 }}>
                  <p style={{ fontSize: "13px", color: "#1a1a2e", fontWeight: 500 }}>
                    Canvas Instructure
                  </p>
                  <p style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                    {calendarSettings.canvas_ical_url
                      ? "iCal feed connected — deadlines sync automatically"
                      : "Not connected — paste your iCal URL to import deadlines"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {calendarSettings.canvas_ical_url && (
                    <div className="flex items-center gap-2">
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#639922" }} />
                      <span style={{ fontSize: "13px", color: "#639922" }}>Connected</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {calendarSettings.canvas_ical_url ? (
                    <button
                      type="button"
                      onClick={handleRemoveCanvas}
                      disabled={removingCanvas}
                      style={{
                        padding: "5px 14px",
                        borderRadius: "7px",
                        border: "0.5px solid rgba(163,45,45,0.3)",
                        background: "rgba(163,45,45,0.05)",
                        fontSize: "12px",
                        color: "#A32D2D",
                        cursor: removingCanvas ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {removingCanvas ? "Removing..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCanvasForm(!showCanvasForm)}
                      style={{
                        padding: "5px 14px",
                        borderRadius: "7px",
                        border: "0.5px solid #e5e5e5",
                        background: "#fff",
                        fontSize: "12px",
                        color: "#444",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas connect form */}
              {showCanvasForm && !calendarSettings.canvas_ical_url && (
                <div
                  className="flex flex-col gap-2 mt-3"
                  style={{ marginLeft: isMobile ? "0" : "200px" }}
                >
                  <input
                    type="url"
                    placeholder="https://ciit.instructure.com/feeds/calendars/user_..."
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    style={{
                      border: "0.5px solid #e5e5e5",
                      borderRadius: "8px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      color: "#1a1a2e",
                      background: "#fafafa",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                  <p
                    style={{ fontSize: "11px", color: "#999", lineHeight: 1.5 }}
                  >
                    In Canvas: go to <strong>Calendar → Calendar Feed</strong>{" "}
                    and copy the iCal link ending in .ics
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCanvasForm(false)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "7px",
                        border: "0.5px solid #e5e5e5",
                        background: "#f5f4f0",
                        fontSize: "12px",
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
                      disabled={savingCanvas || !canvasUrl.includes(".ics")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "7px",
                        border: "none",
                        background:
                          savingCanvas || !canvasUrl.includes(".ics")
                            ? "#ccc"
                            : "#1a1a2e",
                        fontSize: "12px",
                        color: "#fff",
                        cursor:
                          savingCanvas || !canvasUrl.includes(".ics")
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {savingCanvas ? "Saving..." : "Save & connect"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SaveBar />
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Notifications
      ══════════════════════════════════════════ */}
      {activeTab === "notifications" && (
        <div>
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-xs"
            style={{
              background: "rgba(79,142,247,0.05)",
              border: "0.5px solid rgba(79,142,247,0.15)",
              color: "#4f8ef7",
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            All notifications are sent to{" "}
            <strong>{session?.user?.email}</strong>
          </div>

          <SectionTitle title="Email notifications" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <Row
              label="Task deadline reminders"
              desc="Daily email listing tasks due the next day"
              action={
                <Toggle
                  value={settings.notify_task_reminders}
                  onChange={(v) => update("notify_task_reminders", v)}
                />
              }
            />
            <Row
              label="Budget alerts"
              desc="Email when a category reaches 85% of its allocation"
              action={
                <Toggle
                  value={settings.notify_budget_alerts}
                  onChange={(v) => update("notify_budget_alerts", v)}
                />
              }
            />
            <Row
              label="Daily budget reminder"
              desc="Morning email with your recommended daily spend"
              action={
                <Toggle
                  value={settings.notify_daily_budget}
                  onChange={(v) => update("notify_daily_budget", v)}
                />
              }
            />
            <Row
              label="Forum reply notifications"
              desc="Email when someone replies to your post"
              noBorder
              action={
                <Toggle
                  value={settings.notify_forum_replies}
                  onChange={(v) => update("notify_forum_replies", v)}
                />
              }
            />
          </div>

          <SaveBar />
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Privacy
      ══════════════════════════════════════════ */}
      {activeTab === "privacy" && (
        <div>
          <SectionTitle title="Discussion Hub" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <Row
              label="Post anonymously by default"
              desc="New posts will have the anonymous toggle on by default"
              action={
                <Toggle
                  value={settings.forum_default_anonymous}
                  onChange={(v) => update("forum_default_anonymous", v)}
                />
              }
            />
            <Row
              label="Show display name on comments"
              desc="When off, comments always use your anonymous code"
              noBorder
              action={
                <Toggle
                  value={settings.forum_show_display_name}
                  onChange={(v) => update("forum_show_display_name", v)}
                />
              }
            />
          </div>

          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl mt-3 text-xs"
            style={{
              background: "rgba(79,142,247,0.05)",
              border: "0.5px solid rgba(79,142,247,0.15)",
              color: "#4f8ef7",
              lineHeight: 1.55,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: "1px" }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p>
              Moderators can always identify the author of any post or comment.
              Anonymity protects you from other students, not from platform
              administrators.
            </p>
          </div>

          <SectionTitle title="Security" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <Row
              label="Account security"
              desc="Password and 2-step verification are managed through your CIIT Google account"
              noBorder
              action={
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      "https://myaccount.google.com/security",
                      "_blank",
                    )
                  }
                  style={{
                    padding: "5px 14px",
                    borderRadius: "7px",
                    border: "0.5px solid #e5e5e5",
                    background: "#fff",
                    fontSize: "12px",
                    color: "#444",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Manage
                </button>
              }
            />
          </div>

          <SaveBar />
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Account
      ══════════════════════════════════════════ */}
      {activeTab === "account" && (
        <div>
          <SectionTitle title="Session" />
          <div
            className="rounded-2xl px-6"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <Row
              label="Sign out"
              desc="Sign out of your CIIT account on this device"
              noBorder
              action={
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "7px",
                    border: "0.5px solid #e5e5e5",
                    background: "#fff",
                    fontSize: "12px",
                    color: "#444",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Sign out
                </button>
              }
            />
          </div>

          <SectionTitle title="Danger zone" />
          <div
            className="rounded-2xl px-6"
            style={{
              background: "#fff",
              border: "0.5px solid rgba(163,45,45,0.25)",
            }}
          >
            {!deleteConfirm ? (
              <Row
                label="Delete account"
                desc="Permanently delete your account and all data — budgets, tasks, sessions, posts, and comments. This cannot be undone."
                noBorder
                action={
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "7px",
                      border: "0.5px solid rgba(163,45,45,0.3)",
                      background: "rgba(163,45,45,0.06)",
                      fontSize: "12px",
                      color: "#A32D2D",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Delete account
                  </button>
                }
              />
            ) : (
              <div style={{ padding: "20px 0" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#A32D2D",
                    marginBottom: "6px",
                  }}
                >
                  Are you sure? This cannot be undone.
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  All your data will be permanently deleted. Type{" "}
                  <strong style={{ fontFamily: "monospace" }}>DELETE</strong> to
                  confirm.
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  style={{
                    border: "1px solid rgba(163,45,45,0.4)",
                    borderRadius: "8px",
                    padding: "7px 10px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#A32D2D",
                    background: "#fff",
                    outline: "none",
                    width: "200px",
                    display: "block",
                    marginBottom: "12px",
                    letterSpacing: "0.05em",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteInput("");
                    }}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "8px",
                      border: "0.5px solid #e5e5e5",
                      background: "#f5f4f0",
                      fontSize: "13px",
                      color: "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE" || deleting}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        deleteInput !== "DELETE" || deleting
                          ? "#ccc"
                          : "#A32D2D",
                      fontSize: "13px",
                      color: "#fff",
                      fontWeight: 500,
                      cursor:
                        deleteInput !== "DELETE" || deleting
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {deleting ? "Deleting..." : "Permanently delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
