"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ForumPost } from "@/types/forum";
import FlairBadge from "./FlairBadge";

type Props = {
  post: ForumPost;
  currentUserId: string;
  onUpvote: (postId: string) => void;
  onFlag: (postId: string) => void;
  onDelete: (postId: string) => void;
  onHide?: (postId: string) => void;
  mutedWords?: string[];
};

export default function PostCard({
  post,
  currentUserId,
  onUpvote,
  onFlag,
  onDelete,
  onHide,
  mutedWords = [],
}: Props) {
  const router = useRouter();
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMuted, setShowMuted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = post.author_id === currentUserId;
  const displayName = post.is_anonymous
    ? `Anonymous ${post.anon_code}`
    : post.author_display_name
      ? post.author_display_name
      : isOwner
        ? "You"
        : `Anonymous ${post.anon_code}`;

  const mutedWord = mutedWords.find((word) => {
    const lower = word.toLowerCase();
    return (
      post.title.toLowerCase().includes(lower) ||
      post.body.toLowerCase().includes(lower)
    );
  });
  const isMuted = !!mutedWord;

  useEffect(() => {
    fetch("/api/forum/save")
      .then((r) => r.json())
      .then((d) => {
        const ids = (d.saved ?? []).map((s: { post_id: string }) => s.post_id);
        setIsSaved(ids.includes(post.id));
      })
      .catch(() => {});
  }, [post.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleSave = async () => {
    setShowMenu(false);
    const res = await fetch("/api/forum/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    const data = await res.json();
    setIsSaved(data.saved);
  };

  const handleHide = async () => {
    setShowMenu(false);
    const res = await fetch("/api/forum/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    const data = await res.json();
    if (data.hidden) {
      setIsHidden(true);
      onHide?.(post.id);
      // Remove from recently viewed so hidden posts never appear there
      try {
        const stored = localStorage.getItem("slm_recently_viewed");
        if (stored) {
          const items = JSON.parse(stored);
          const filtered = items.filter(
            (p: { id: string }) => p.id !== post.id,
          );
          localStorage.setItem("slm_recently_viewed", JSON.stringify(filtered));
        }
      } catch {
        /* localStorage unavailable */
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (isHidden) {
    return (
      <div
        className="rounded-2xl px-5 py-3 flex items-center justify-between"
        style={{ background: "#fafafa", border: "0.5px solid #ebebeb" }}
      >
        <p style={{ fontSize: "12px", color: "#bbb" }}>
          Post hidden — won&apos;t appear in your feed
        </p>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/forum/hide", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ post_id: post.id }),
            });
            setIsHidden(false);
          }}
          style={{
            background: "none",
            border: "none",
            fontSize: "11px",
            color: "#4f8ef7",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <>
      {showLightbox && post.image_url && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Full image"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "8px",
              cursor: "default",
              boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowLightbox(false);
              router.push(`/forum/${post.id}`);
            }}
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.12)",
              border: "0.5px solid rgba(255,255,255,0.2)",
              borderRadius: "20px",
              padding: "7px 18px",
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            View post & comments
          </button>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          border: post.is_pinned
            ? "0.5px solid rgba(79,142,247,0.3)"
            : post.status === "pending_review"
              ? "0.5px solid rgba(163,45,45,0.3)"
              : "0.5px solid #ebebeb",
          opacity: post.status === "pending_review" ? 0.75 : 1,
        }}
      >
        <div className="flex">
          {/* Upvote */}
          <div
            className="flex flex-col items-center gap-1 px-3 py-4 flex-shrink-0"
            style={{ background: "#fafafa", minWidth: "52px" }}
          >
            <button
              type="button"
              onClick={() => onUpvote(post.id)}
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: "28px",
                height: "28px",
                background: post.user_has_upvoted
                  ? "rgba(79,142,247,0.1)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                color: post.user_has_upvoted ? "#4f8ef7" : "#999",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <span
              className="text-xs font-medium"
              style={{
                color: post.user_has_upvoted ? "#4f8ef7" : "#666",
                fontFamily: "monospace",
              }}
            >
              {post.upvotes}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 py-4 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {post.is_pinned && (
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "#4f8ef7" }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                  </svg>
                  Pinned
                </span>
              )}
              <FlairBadge flair={post.flair} />
              <span className="text-xs" style={{ color: "#999" }}>
                {displayName}
              </span>
              <span style={{ color: "#ddd", fontSize: "10px" }}>·</span>
              <span className="text-xs" style={{ color: "#999" }}>
                {formatTime(post.created_at)}
              </span>

              {/* Ellipsis menu */}
              <div className="ml-auto relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ccc",
                    padding: "2px 4px",
                    borderRadius: "5px",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1,
                    fontSize: "16px",
                    letterSpacing: "1px",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#666")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "#ccc")
                  }
                >
                  ···
                </button>
                {showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "#fff",
                      border: "0.5px solid #ebebeb",
                      borderRadius: "10px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      zIndex: 20,
                      minWidth: "150px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleSave}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: isSaved ? "#4f8ef7" : "#1a1a2e",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderBottom: "0.5px solid #f5f4f0",
                      }}
                      onMouseEnter={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#f5f4f0")
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "none")
                      }
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "#4f8ef7" : "none"}
                        stroke={isSaved ? "#4f8ef7" : "currentColor"}
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      {isSaved ? "Unsave post" : "Save post"}
                    </button>
                    <button
                      type="button"
                      onClick={handleHide}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#1a1a2e",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderBottom: isOwner ? "0.5px solid #f5f4f0" : "none",
                      }}
                      onMouseEnter={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#f5f4f0")
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "none")
                      }
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                      Hide post
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(post.id);
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 14px",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#A32D2D",
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(163,45,45,0.05)")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none")
                        }
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                        Delete post
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Muted word notice OR content */}
            {isMuted && !showMuted ? (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl my-1"
                style={{
                  background: "rgba(186,117,23,0.06)",
                  border: "0.5px solid rgba(186,117,23,0.15)",
                }}
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#BA7517"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p style={{ fontSize: "12px", color: "#BA7517" }}>
                    Post contains a muted word:{" "}
                    <strong>&ldquo;{mutedWord}&rdquo;</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMuted(true)}
                  style={{
                    background: "none",
                    border: "0.5px solid rgba(186,117,23,0.3)",
                    borderRadius: "6px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    color: "#BA7517",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  Show
                </button>
              </div>
            ) : (
              <>
                <p
                  className="text-sm font-medium mb-1"
                  onClick={() => router.push(`/forum/${post.id}`)}
                  style={{
                    color: "#1a1a2e",
                    lineHeight: 1.4,
                    cursor: "pointer",
                  }}
                >
                  {post.title}
                </p>
                <p
                  className="text-xs leading-relaxed line-clamp-2 mb-3"
                  style={{ color: "#666" }}
                >
                  {post.body}
                </p>
                {post.image_url && (
                  <div
                    className="rounded-xl overflow-hidden mb-3"
                    style={{
                      border: "0.5px solid #ebebeb",
                      background: "#f5f4f0",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image_url}
                      alt="Post image"
                      onClick={() => setShowLightbox(true)}
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "512px",
                        objectFit: "contain",
                        display: "block",
                        cursor: "zoom-in",
                      }}
                    />
                    <div
                      onClick={() => setShowLightbox(true)}
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.45)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "zoom-in",
                        color: "#fff",
                        fontSize: "10px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                      View full image
                    </div>
                  </div>
                )}
                {isMuted && showMuted && (
                  <button
                    type="button"
                    onClick={() => setShowMuted(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: "#bbb",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                      marginBottom: "6px",
                      display: "block",
                    }}
                  >
                    Hide again
                  </button>
                )}
              </>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => router.push(`/forum/${post.id}`)}
                className="flex items-center gap-1.5 text-xs"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  fontFamily: "inherit",
                  padding: 0,
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {post.comment_count ?? 0}{" "}
                {post.comment_count === 1 ? "comment" : "comments"} · View
              </button>
              <div className="flex-1" />
              {!isOwner &&
                !post.user_has_flagged &&
                (showFlagConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#999" }}>
                      Report this post?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onFlag(post.id);
                        setShowFlagConfirm(false);
                      }}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: "rgba(163,45,45,0.1)",
                        color: "#A32D2D",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Yes, report
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFlagConfirm(false)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: "#f5f4f0",
                        color: "#666",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFlagConfirm(true)}
                    className="flex items-center gap-1 text-xs"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ccc",
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
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    Report
                  </button>
                ))}
              {post.user_has_flagged && (
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#A32D2D" }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  </svg>
                  Reported
                </span>
              )}
            </div>
            {post.status === "pending_review" && (
              <div
                className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(163,45,45,0.06)",
                  border: "0.5px solid rgba(163,45,45,0.15)",
                  color: "#A32D2D",
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Under moderator review · content flagged by multiple users
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
