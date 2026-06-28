"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ForumPost, ForumComment, ForumFlair } from "@/types/forum";
import FlairBadge from "@/components/forum/FlairBadge";
import CommentThread from "@/components/forum/CommentThread";
import ForumSidebar from "@/components/forum/ForumSidebar";
import RecentlyViewed from "@/components/forum/RecentlyViewed";

type RecentPost = {
  id: string;
  title: string;
  flair: ForumFlair;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [commentAnon, setCommentAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [showDisplayName, setShowDisplayName] = useState<boolean>(false);

  const userId = session?.user?.email ?? "";

  useEffect(() => {
    if (!post) return;
    try {
      const key = "slm_recently_viewed";
      const stored = localStorage.getItem(key);
      const items: RecentPost[] = stored ? JSON.parse(stored) : [];
      const updated = [
        { id: post.id, title: post.title, flair: post.flair },
        ...items.filter((p) => p.id !== post.id),
      ].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // localStorage unavailable
    }
  }, [post]);

  const fetchPost = useCallback(async () => {
    try {
      const [postRes, commentsRes, settingsRes] = await Promise.all([
        fetch(`/api/forum/posts/${postId}`),
        fetch(`/api/forum/comments?postId=${postId}`),
        fetch("/api/settings"),
      ]);
      const [postData, commentsData, settingsData] = await Promise.all([
        postRes.json(),
        commentsRes.json(),
        settingsRes.json(),
      ]);
      if (postData.post) setPost(postData.post);
      if (commentsData.comments) setComments(commentsData.comments);
      if (settingsData.settings) {
        setShowDisplayName(
          settingsData.settings.forum_show_display_name ?? false,
        );
        setUserDisplayName(
          settingsData.settings.display_name ?? userId.split("@")[0],
        );
      }
    } catch (err) {
      console.error("Fetch post error:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleUpvotePost = async () => {
    if (!post) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            upvotes: prev.user_has_upvoted
              ? prev.upvotes - 1
              : prev.upvotes + 1,
            user_has_upvoted: !prev.user_has_upvoted,
          }
        : prev,
    );
    await fetch(`/api/forum/posts/${postId}/upvote`, { method: "POST" });
  };

  const handleUpvoteComment = async (commentId: string) => {
    await fetch(`/api/forum/comments/${commentId}/upvote`, { method: "POST" });
    fetchPost();
  };

  const handleSubmitComment = async () => {
    if (!commentBody.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          comment_body: commentBody.trim(),
          is_anonymous: commentAnon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommentBody("");
      fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p style={{ fontSize: "13px", color: "#999" }}>
          Post not found or has been removed.
        </p>
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: "#f5f4f0",
            border: "0.5px solid #ebebeb",
            color: "#666",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Back to Discussion Hub
        </button>
      </div>
    );
  }

  const displayName = post.is_anonymous
    ? `Anonymous ${post.anon_code}`
    : post.author_display_name
      ? post.author_display_name
      : post.author_id === userId
        ? "You"
        : `Anonymous ${post.anon_code}`;

  return (
    <div className="flex gap-5 h-full">
      {/* Left sidebar — community context */}
      <div
        className="flex-shrink-0 flex flex-col gap-3"
        style={{ width: "220px" }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className="flex items-center gap-2 text-xs w-fit"
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
          Back to feed
        </button>

        <ForumSidebar />
      </div>

      {/* Center — post + comments */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Post card */}
        <div
          className="rounded-2xl"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <div className="flex">
            {/* Upvote column */}
            <div
              className="flex flex-col items-center gap-2 px-4 py-5 flex-shrink-0"
              style={{ background: "#fafafa", minWidth: "60px" }}
            >
              <button
                type="button"
                onClick={handleUpvotePost}
                className="flex items-center justify-center rounded-xl transition-colors"
                style={{
                  width: "32px",
                  height: "32px",
                  background: post.user_has_upvoted
                    ? "rgba(79,142,247,0.1)"
                    : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: post.user_has_upvoted ? "#4f8ef7" : "#999",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <span
                className="text-sm font-medium"
                style={{
                  color: post.user_has_upvoted ? "#4f8ef7" : "#666",
                  fontFamily: "monospace",
                }}
              >
                {post.upvotes}
              </span>
            </div>

            {/* Post content */}
            <div className="flex-1 px-5 py-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <FlairBadge flair={post.flair} size="md" />
                <span className="text-xs" style={{ color: "#999" }}>
                  {displayName}
                </span>
                <span style={{ color: "#ddd", fontSize: "10px" }}>·</span>
                <span className="text-xs" style={{ color: "#bbb" }}>
                  {formatTime(post.created_at)}
                </span>
              </div>

              <h1
                className="text-lg font-semibold mb-3"
                style={{ color: "#1a1a2e", lineHeight: 1.35 }}
              >
                {post.title}
              </h1>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "#444", lineHeight: 1.75 }}
              >
                {post.body}
              </p>

              {/* Full image */}
              {post.image_url && (
                <div
                  className="rounded-xl overflow-hidden mt-4"
                  style={{
                    border: "0.5px solid #ebebeb",
                    background: "#fafafa",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt="Post image"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              )}

              {post.status === "pending_review" && (
                <div
                  className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: "rgba(163,45,45,0.06)",
                    border: "0.5px solid rgba(163,45,45,0.15)",
                    color: "#A32D2D",
                  }}
                >
                  This post is under moderator review.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment box */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Leave a comment
          </p>
          <textarea
            placeholder="Share your thoughts..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            className="px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{
              border: "1px solid #e5e5e5",
              background: "#fafafa",
              fontFamily: "inherit",
            }}
          />

          <div className="flex items-center gap-3">
            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setCommentAnon(!commentAnon)}
              className="flex items-center gap-1.5 text-xs"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: commentAnon ? "#4f8ef7" : "#999",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: `1.5px solid ${commentAnon ? "#4f8ef7" : "#ccc"}`,
                  background: commentAnon ? "#4f8ef7" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {commentAnon && (
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
              Comment anonymously
            </button>

            <div className="flex-1" />

            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={submitting || !commentBody.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background:
                  submitting || !commentBody.trim() ? "#ccc" : "#1a1a2e",
                border: "none",
                cursor:
                  submitting || !commentBody.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <p className="text-sm font-medium mb-4" style={{ color: "#1a1a2e" }}>
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>

          {comments.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 gap-2"
              style={{ color: "#bbb" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontSize: "12px", color: "#999" }}>
                No comments yet — be the first to respond
              </p>
            </div>
          ) : (
            <div>
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  currentUserId={userId}
                  postId={postId}
                  depth={0}
                  onReplyAdded={fetchPost}
                  onUpvote={handleUpvoteComment}
                  showDisplayName={showDisplayName}
                  userDisplayName={userDisplayName}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — recently viewed */}
      <div className="flex-shrink-0" style={{ width: "220px" }}>
        <RecentlyViewed excludePostId={postId} />
      </div>
    </div>
  );
}
