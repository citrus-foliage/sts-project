"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForumFlair, FLAIR_CONFIG } from "@/types/forum";

type ActivityPost = {
  post_id: string;
  saved_at?: string;
  hidden_at?: string;
  forum_posts: {
    id: string;
    title: string;
    body: string;
    flair: ForumFlair;
    upvotes: number;
    created_at: string;
  };
};

type Tab = "saved" | "hidden";

export default function ForumActivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [saved, setSaved] = useState<ActivityPost[]>([]);
  const [hidden, setHidden] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [savedRes, hiddenRes] = await Promise.all([
          fetch("/api/forum/save"),
          fetch("/api/forum/hide"),
        ]);
        const [savedData, hiddenData] = await Promise.all([
          savedRes.json(),
          hiddenRes.json(),
        ]);
        setSaved(savedData.saved ?? []);
        setHidden(hiddenData.hidden ?? []);
      } catch (err) {
        console.error("Fetch activity error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleUnsave = async (postId: string) => {
    await fetch("/api/forum/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    setSaved((prev) => prev.filter((s) => s.post_id !== postId));
  };

  const handleUnhide = async (postId: string) => {
    await fetch("/api/forum/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    setHidden((prev) => prev.filter((h) => h.post_id !== postId));
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "saved", label: "Saved", count: saved.length },
    { id: "hidden", label: "Hidden", count: hidden.length },
  ];

  const activeList = activeTab === "saved" ? saved : hidden;
  const emptyLabel =
    activeTab === "saved"
      ? "No saved posts yet — bookmark posts you want to revisit by clicking ··· on any post."
      : "No hidden posts — posts you hide from the feed will appear here.";

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className="flex items-center gap-2 text-xs mb-3"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Discussion Hub
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          Your Activity
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Posts you&apos;ve saved or hidden from the feed.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1"
        style={{
          borderBottom: "0.5px solid #ebebeb",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2"
            style={{
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
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "8px",
                  background:
                    activeTab === tab.id ? "rgba(79,142,247,0.12)" : "#f5f4f0",
                  color: activeTab === tab.id ? "#4f8ef7" : "#999",
                  fontFamily: "monospace",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
          style={{
            background: "#fff",
            border: "0.5px solid #ebebeb",
            textAlign: "center",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ccc"
            strokeWidth="1.5"
          >
            {activeTab === "saved" ? (
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
          <p
            style={{
              fontSize: "13px",
              color: "#999",
              maxWidth: "300px",
              lineHeight: 1.6,
            }}
          >
            {emptyLabel}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeList.map((item) => {
            const post = item.forum_posts;
            if (!post) return null;
            const flairConfig = FLAIR_CONFIG[post.flair] ?? {
              label: post.flair,
              color: "#999",
              bg: "#f5f4f0",
            };
            const timestamp =
              activeTab === "saved" ? item.saved_at : item.hidden_at;

            return (
              <div
                key={item.post_id}
                className="rounded-2xl p-5"
                style={{
                  background: "#fff",
                  border: "0.5px solid #ebebeb",
                }}
              >
                {/* Flair + timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "8px",
                      background: flairConfig.bg,
                      color: flairConfig.color,
                    }}
                  >
                    {flairConfig.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#bbb" }}>
                    {activeTab === "saved" ? "Saved" : "Hidden"}{" "}
                    {timestamp ? formatTime(timestamp) : ""}
                  </span>
                </div>

                {/* Title */}
                <p
                  className="text-sm font-medium mb-1"
                  style={{
                    color: "#1a1a2e",
                    lineHeight: 1.4,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(`/forum/${post.id}`)}
                >
                  {post.title}
                </p>

                {/* Body preview */}
                <p
                  className="text-xs line-clamp-2 mb-3"
                  style={{ color: "#666", lineHeight: 1.6 }}
                >
                  {post.body}
                </p>

                {/* Actions row */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/forum/${post.id}`)}
                    className="flex items-center gap-1.5 text-xs"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#4f8ef7",
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    View post
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() =>
                      activeTab === "saved"
                        ? handleUnsave(item.post_id)
                        : handleUnhide(item.post_id)
                    }
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: "#f5f4f0",
                      border: "0.5px solid #ebebeb",
                      color: "#666",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {activeTab === "saved" ? "Remove from saved" : "Unhide"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
