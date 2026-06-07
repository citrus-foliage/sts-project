"use client";

import { useState } from "react";
import { ForumComment } from "@/types/forum";

type Props = {
  comment: ForumComment;
  currentUserId: string;
  postId: string;
  depth?: number;
  onReplyAdded: () => void;
  onUpvote: (commentId: string) => void;
  showDisplayName?: boolean;
  userDisplayName?: string;
};

export default function CommentThread({
  comment,
  currentUserId,
  postId,
  depth = 0,
  onReplyAdded,
  onUpvote,
  showDisplayName = false,
  userDisplayName = "",
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyAnon, setReplyAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = comment.author_id === currentUserId;

  const displayName = comment.is_anonymous
    ? `Anonymous ${comment.anon_code}`
    : isOwner && showDisplayName && userDisplayName
      ? userDisplayName
      : isOwner
        ? "You"
        : `Anonymous ${comment.anon_code}`;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSubmitReply = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          parent_id: comment.id,
          comment_body: replyBody.trim(),
          is_anonymous: replyAnon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplyBody("");
      setShowReplyForm(false);
      onReplyAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginLeft: depth > 0 ? "24px" : "0",
        borderLeft: depth > 0 ? "2px solid #f0eff0" : "none",
        paddingLeft: depth > 0 ? "16px" : "0",
      }}
    >
      <div
        className="flex flex-col gap-2 py-3"
        style={{
          borderBottom: "0.5px solid #f5f4f0",
        }}
      >
        {/* Author + time */}
        <div className="flex items-center gap-2">
          <div
            className="rounded-full flex-shrink-0 flex items-center justify-center text-white"
            style={{
              width: "22px",
              height: "22px",
              background: comment.is_anonymous ? "#534AB7" : "#4f8ef7",
              fontSize: "9px",
              fontWeight: 600,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium" style={{ color: "#555" }}>
            {displayName}
          </span>
          <span style={{ color: "#ddd", fontSize: "10px" }}>·</span>
          <span className="text-xs" style={{ color: "#bbb" }}>
            {formatTime(comment.created_at)}
          </span>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed" style={{ color: "#1a1a2e" }}>
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Upvote */}
          <button
            type="button"
            onClick={() => onUpvote(comment.id)}
            className="flex items-center gap-1.5 text-xs"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: comment.user_has_upvoted ? "#4f8ef7" : "#999",
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
              strokeWidth="2.5"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {comment.upvotes > 0 && comment.upvotes}
          </button>

          {/* Reply */}
          {depth < 1 && (
            <button
              type="button"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Reply
            </button>
          )}

          {/* Delete own comment */}
          {isOwner && (
            <button
              type="button"
              className="text-xs ml-auto"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ccc",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              placeholder="Write a reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
              className="px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontFamily: "inherit",
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReplyAnon(!replyAnon)}
                className="flex items-center gap-1.5 text-xs"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: replyAnon ? "#4f8ef7" : "#999",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "3px",
                    border: `1.5px solid ${replyAnon ? "#4f8ef7" : "#ccc"}`,
                    background: replyAnon ? "#4f8ef7" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {replyAnon && (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                Reply anonymously
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="text-xs px-3 py-1.5 rounded-lg"
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
                onClick={handleSubmitReply}
                disabled={submitting || !replyBody.trim()}
                className="text-xs px-3 py-1.5 rounded-lg text-white"
                style={{
                  background:
                    submitting || !replyBody.trim() ? "#ccc" : "#1a1a2e",
                  border: "none",
                  cursor:
                    submitting || !replyBody.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Posting..." : "Reply"}
              </button>
            </div>
            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              postId={postId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              onUpvote={onUpvote}
              showDisplayName={showDisplayName}
              userDisplayName={userDisplayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
