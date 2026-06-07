"use client";

import { useState, useEffect } from "react";
import { ForumFlair, FLAIR_CONFIG } from "@/types/forum";
import FlairBadge from "./FlairBadge";

type Props = {
  onSubmit: (post: {
    title: string;
    post_body: string;
    flair: ForumFlair;
    is_anonymous: boolean;
  }) => Promise<void>;
  onCancel: () => void;
};

export default function PostForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [flair, setFlair] = useState<ForumFlair>("question");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's forum anonymity preference
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.forum_default_anonymous !== undefined) {
          setIsAnonymous(data.settings.forum_default_anonymous);
        }
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        post_body: body.trim(),
        flair,
        is_anonymous: isAnonymous,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const flairs = Object.entries(FLAIR_CONFIG) as [
    ForumFlair,
    { label: string; color: string; bg: string },
  ][];

  const inputStyle = {
    border: "1px solid #e5e5e5",
    background: "#fafafa",
    fontFamily: "inherit",
    color: "#1a1a2e",
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
          Create a post
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#666" }}>
          Share something with the CIIT community.
        </p>
      </div>

      {/* Flair picker */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Flair *
        </label>
        <div className="flex flex-wrap gap-2">
          {flairs.map(([f]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlair(f)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                opacity: flair === f ? 1 : 0.4,
                transform: flair === f ? "scale(1.05)" : "scale(1)",
                transition: "all 0.15s",
              }}
            >
              <FlairBadge flair={f} size="md" />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Title *
        </label>
        <input
          type="text"
          placeholder="What's on your mind?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
        <span className="text-xs text-right" style={{ color: "#bbb" }}>
          {title.length}/200
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Body *
        </label>
        <textarea
          placeholder="Share more details..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Anonymous toggle */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
      >
        <div>
          <p className="text-sm" style={{ color: "#1a1a2e" }}>
            Post anonymously
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#666" }}>
            {settingsLoaded
              ? "Your identity is always known to moderators"
              : "Loading your preference..."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAnonymous(!isAnonymous)}
          style={{
            width: "36px",
            height: "20px",
            borderRadius: "10px",
            background: isAnonymous ? "#4f8ef7" : "#e5e5e5",
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
              top: "2px",
              left: isAnonymous ? "18px" : "2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
            }}
          />
        </button>
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
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{
            background: loading ? "#ccc" : "#1a1a2e",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
