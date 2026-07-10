"use client";

import { useState, useEffect, useRef } from "react";
import { ForumFlair, FLAIR_CONFIG } from "@/types/forum";
import FlairBadge from "./FlairBadge";
import { useSettings } from "@/contexts/SettingsContext";

type Props = {
  onSubmit: (post: {
    title: string;
    post_body: string;
    flair: ForumFlair;
    is_anonymous: boolean;
    image_url?: string;
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

  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anonymity default now comes from the shared SettingsContext instead of
  // this form fetching its own copy of /api/settings. Applied once, on the
  // first render where the context has finished loading — after that the
  // user's own toggle takes over, so a background settings refetch elsewhere
  // doesn't silently flip this open form's toggle.
  const { settings: userSettings, loading: settingsLoading } = useSettings();
  const appliedDefaultRef = useRef(false);

  useEffect(() => {
    if (!settingsLoading && !appliedDefaultRef.current) {
      if (userSettings.forum_default_anonymous !== undefined) {
        setIsAnonymous(userSettings.forum_default_anonymous);
      }
      setSettingsLoaded(true);
      appliedDefaultRef.current = true;
    }
  }, [settingsLoading, userSettings]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Client-side validation before uploading
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/forum/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setImageUrl(data.url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again",
      );
      setImagePreview(null);
      setImageUrl(null);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    if (uploading) {
      setError("Please wait for the image to finish uploading");
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
        image_url: imageUrl ?? undefined,
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

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium" style={{ color: "#555" }}>
          Image{" "}
          <span style={{ color: "#bbb", fontWeight: 400 }}>
            (optional — JPEG, PNG, GIF, WebP · max 5MB)
          </span>
        </label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {imagePreview ? (
          /* Image preview */
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ border: "0.5px solid #ebebeb" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: "240px",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Upload overlay */}
            {uploading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "#555",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4f8ef7"
                  strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Uploading...
              </div>
            )}
            {/* Uploaded badge */}
            {!uploading && imageUrl && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  background: "rgba(99,153,34,0.9)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 500,
                  padding: "3px 8px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Uploaded
              </div>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          /* Upload trigger button */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "20px",
              border: "1px dashed #e5e5e5",
              borderRadius: "12px",
              background: "#fafafa",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              color: "#999",
              transition: "border-color 0.15s",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: "12px" }}>Click to attach an image</span>
            <span style={{ fontSize: "10px", color: "#bbb" }}>
              JPEG, PNG, GIF, WebP · max 5MB
            </span>
          </button>
        )}

        {uploadError && (
          <p className="text-xs" style={{ color: "#dc2626" }}>
            {uploadError}
          </p>
        )}
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
          disabled={loading || uploading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{
            background: loading || uploading ? "#ccc" : "#1a1a2e",
            border: "none",
            cursor: loading || uploading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Posting..." : uploading ? "Uploading image..." : "Post"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
