"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  ForumPost,
  ForumFlair,
  FLAIR_CONFIG,
  FORUM_RULES,
} from "@/types/forum";
import PostCard from "@/components/forum/PostCard";
import PostForm from "@/components/forum/PostForm";

type SortMode = "new" | "hot" | "top";

export default function ForumPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [sort, setSort] = useState<SortMode>("new");
  const [flairFilter, setFlairFilter] = useState<ForumFlair | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFlairFilter("all");
  };

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 || flairFilter !== "all";

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort });
      if (flairFilter !== "all") params.set("flair", flairFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/forum/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  }, [sort, flairFilter, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (postData: {
    title: string;
    post_body: string;
    flair: ForumFlair;
    is_anonymous: boolean;
  }) => {
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setShowForm(false);
    fetchPosts();
  };

  const handleUpvote = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: p.user_has_upvoted ? p.upvotes - 1 : p.upvotes + 1,
              user_has_upvoted: !p.user_has_upvoted,
            }
          : p,
      ),
    );
    await fetch(`/api/forum/posts/${postId}/upvote`, { method: "POST" });
  };

  const handleFlag = async (postId: string) => {
    await fetch("/api/forum/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await fetch(`/api/forum/posts/${postId}`, { method: "DELETE" });
  };

  const userId = session?.user?.email ?? "";

  const flairs = Object.entries(FLAIR_CONFIG) as [
    ForumFlair,
    { label: string; color: string; bg: string },
  ][];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: "20px",
      }}
    >
      {/* ── Main column ── */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
              Discussion Hub
            </h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              A space for the CIIT community — share, ask, and connect.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white flex-shrink-0"
            style={{
              background: "#1a1a2e",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New post
          </button>
        </div>

        {/* Post form */}
        {showForm && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <PostForm
              onSubmit={handleCreatePost}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{
            background: "#fff",
            border: "0.5px solid #ebebeb",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search posts by title or content..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 text-sm outline-none"
            style={{
              border: "none",
              background: "transparent",
              fontFamily: "inherit",
              color: "#1a1a2e",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                padding: "2px",
                lineHeight: 1,
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort + Flair filter */}
        <div className="flex flex-col gap-2">
          {/* Sort tabs */}
          <div className="flex items-center gap-3">
            <div
              className="flex rounded-xl p-1 gap-0.5"
              style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
            >
              {(["new", "hot", "top"] as SortMode[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                  style={{
                    background: sort === s ? "#f5f4f0" : "transparent",
                    color: sort === s ? "#1a1a2e" : "#999",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "rgba(163,45,45,0.08)",
                  color: "#A32D2D",
                  border: "0.5px solid rgba(163,45,45,0.2)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear filters
              </button>
            )}
          </div>

          {/* Flair filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFlairFilter("all")}
              className="px-2.5 py-1 rounded-full text-xs"
              style={{
                background: flairFilter === "all" ? "#1a1a2e" : "#fff",
                color: flairFilter === "all" ? "#fff" : "#666",
                border: "0.5px solid #ebebeb",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              All
            </button>
            {flairs.map(([f, config]) => (
              <button
                key={f}
                type="button"
                onClick={() => setFlairFilter(flairFilter === f ? "all" : f)}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: flairFilter === f ? config.bg : "#fff",
                  color: flairFilter === f ? config.color : "#666",
                  border: `0.5px solid ${
                    flairFilter === f ? config.color + "44" : "#ebebeb"
                  }`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: "rgba(79,142,247,0.06)",
              border: "0.5px solid rgba(79,142,247,0.15)",
              color: "#4f8ef7",
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Showing filtered results
            {debouncedSearch.trim() && (
              <span>
                {" "}
                for &quot;<strong>{debouncedSearch.trim()}</strong>&quot;
              </span>
            )}
            {flairFilter !== "all" && (
              <span>
                {" "}
                in <strong>{FLAIR_CONFIG[flairFilter].label}</strong>
              </span>
            )}
            <span style={{ color: "#4f8ef7" }}>
              · {posts.length} {posts.length === 1 ? "result" : "results"}
            </span>
          </div>
        )}

        {/* Community Info toggle + inline panel — mobile only */}
        {isMobile && (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium"
              style={{
                background: "#fff",
                border: "0.5px solid #ebebeb",
                borderRadius: showInfo ? "12px 12px 0 0" : "12px",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#1a1a2e",
              }}
            >
              <span className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Community Info
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
                style={{
                  transform: showInfo ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Inline panel — expands right below the toggle */}
            {showInfo && (
              <div
                className="flex flex-col gap-4 p-4"
                style={{
                  background: "#fafafa",
                  border: "0.5px solid #ebebeb",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                }}
              >
                {/* Community rules */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    style={{ borderBottom: showRules ? "0.5px solid #ebebeb" : "none" }}
                    onClick={() => setShowRules(!showRules)}
                  >
                    <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                      Community Rules
                    </p>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#999"
                      strokeWidth="2"
                      style={{
                        transform: showRules ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {showRules && (
                    <div className="px-4 py-3 flex flex-col gap-2.5">
                      {FORUM_RULES.map((rule, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span
                            className="flex-shrink-0 text-xs font-semibold"
                            style={{ color: "#4f8ef7", minWidth: "16px" }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-xs" style={{ color: "#666", lineHeight: 1.5 }}>
                            {rule}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flair guide */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
                >
                  <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                    Flair Guide
                  </p>
                  {flairs.map(([f, config]) => (
                    <div key={f} className="flex items-center gap-2">
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{ width: 8, height: 8, background: config.color }}
                      />
                      <p className="text-xs font-medium" style={{ color: config.color }}>
                        {config.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Anonymity notice */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{
                    background: "rgba(79,142,247,0.05)",
                    border: "0.5px solid rgba(79,142,247,0.15)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <p className="text-xs font-medium" style={{ color: "#4f8ef7" }}>
                      About anonymity
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#666", lineHeight: 1.55 }}>
                    Anonymous posts hide your name publicly but moderators can always
                    identify the author. Anonymity is not an excuse to violate community rules.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p style={{ fontSize: "13px", color: "#999" }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ccc"
              strokeWidth="1.5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={{ fontSize: "13px", color: "#999" }}>
              {hasActiveFilters
                ? "No posts match your search or filter"
                : "No posts yet — be the first to share something"}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "#f5f4f0",
                  border: "0.5px solid #ebebeb",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId}
                onUpvote={handleUpvote}
                onFlag={handleFlag}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right sidebar — desktop only ── */}
      {!isMobile && (
        <div
          className="flex flex-col gap-4"
          style={{ width: "220px", flexShrink: 0 }}
        >
          {/* Community rules */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              style={{ borderBottom: showRules ? "0.5px solid #ebebeb" : "none" }}
              onClick={() => setShowRules(!showRules)}
            >
              <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                Community Rules
              </p>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
                style={{
                  transform: showRules ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {showRules && (
              <div className="px-4 py-3 flex flex-col gap-2.5">
                {FORUM_RULES.map((rule, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span
                      className="flex-shrink-0 text-xs font-semibold"
                      style={{ color: "#4f8ef7", minWidth: "16px" }}
                    >
                      {i + 1}
                    </span>
                    <p
                      className="text-xs"
                      style={{ color: "#666", lineHeight: 1.5 }}
                    >
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flair guide */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
          >
            <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
              Flair Guide
            </p>
            {flairs.map(([f, config]) => (
              <div key={f} className="flex items-center gap-2">
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 8, height: 8, background: config.color }}
                />
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Anonymity notice */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{
              background: "rgba(79,142,247,0.05)",
              border: "0.5px solid rgba(79,142,247,0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f8ef7"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-xs font-medium" style={{ color: "#4f8ef7" }}>
                About anonymity
              </p>
            </div>
            <p className="text-xs" style={{ color: "#666", lineHeight: 1.55 }}>
              Anonymous posts hide your name publicly but moderators can always
              identify the author. Anonymity is not an excuse to violate community
              rules.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
