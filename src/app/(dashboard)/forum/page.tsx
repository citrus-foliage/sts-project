"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ForumPost, ForumFlair, FLAIR_CONFIG } from "@/types/forum";
import PostCard from "@/components/forum/PostCard";
import ForumSidebar from "@/components/forum/ForumSidebar";
import RecentlyViewed from "@/components/forum/RecentlyViewed";
import FeatureHidden from "@/components/layout/FeatureHidden";

type SortMode = "new" | "hot" | "top";

export default function ForumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("new");
  const [flairFilter, setFlairFilter] = useState<Set<ForumFlair>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [showFeature, setShowFeature] = useState(true);
  const [checkingFeature, setCheckingFeature] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.show_forum === false) setShowFeature(false);
      })
      .catch(() => {})
      .finally(() => setCheckingFeature(false));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/muted-words").then((r) => r.json()),
      fetch("/api/forum/hide").then((r) => r.json()),
    ])
      .then(([mutedData, hiddenData]) => {
        setMutedWords(mutedData.muted_words ?? []);
        const ids = new Set<string>(
          (hiddenData.hidden ?? []).map((h: { post_id: string }) => h.post_id),
        );
        setHiddenPostIds(ids);
      })
      .catch(() => {});
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFlairFilter(new Set());
  };

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 || flairFilter.size > 0;

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort });
      flairFilter.forEach((f) => params.append("flair", f));
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

  const handleHide = (postId: string) => {
    setHiddenPostIds((prev) => new Set([...prev, postId]));
  };

  const userId = session?.user?.email ?? "";
  const flairs = Object.entries(FLAIR_CONFIG) as [
    ForumFlair,
    { label: string; color: string; bg: string },
  ][];
  const visiblePosts = posts.filter((p) => !hiddenPostIds.has(p.id));

  if (checkingFeature) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (!showFeature) return <FeatureHidden featureName="Discussion Hub" />;

  return (
    <div className="flex gap-5">
      {!isMobile && (
        <div className="flex-shrink-0" style={{ width: "220px" }}>
          <ForumSidebar />
        </div>
      )}

      <div className="flex flex-col gap-4 flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
              Discussion Hub
            </h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              A space for the CIIT community — share, ask, and connect.
            </p>
            {isMobile && (
              <button
                type="button"
                onClick={() => setShowMobileInfo((v) => !v)}
                className="text-xs mt-2 self-start px-2.5 py-1 rounded-lg"
                style={{
                  background: "rgba(79,142,247,0.08)",
                  border: "0.5px solid rgba(79,142,247,0.2)",
                  color: "#4f8ef7",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {showMobileInfo ? "Hide info ▲" : "Community info ▼"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push("/forum/create")}
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

        {isMobile && showMobileInfo && (
          <div
            className="rounded-xl p-4 flex flex-col gap-2 text-xs"
            style={{
              background: "#fff",
              border: "0.5px solid #ebebeb",
              color: "#666",
              lineHeight: 1.6,
            }}
          >
            <p className="font-medium" style={{ color: "#1a1a2e" }}>
              Forum Rules
            </p>
            <ul
              className="flex flex-col gap-1 pl-3"
              style={{ listStyle: "disc" }}
            >
              <li>Be respectful — no harassment or personal attacks.</li>
              <li>No hate speech, NSFW, or explicit content.</li>
              <li>Use the correct flair for your post.</li>
              <li>No doxxing or sharing personal information.</li>
              <li>Anonymity is not a shield — violations result in a ban.</li>
            </ul>
          </div>
        )}

        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
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

        <div className="flex flex-col gap-2">
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

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFlairFilter(new Set())}
              className="px-2.5 py-1 rounded-full text-xs"
              style={{
                background: flairFilter.size === 0 ? "#1a1a2e" : "#fff",
                color: flairFilter.size === 0 ? "#fff" : "#666",
                border: "0.5px solid #ebebeb",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              All
            </button>
            {flairs.map(([f, config]) => {
              const active = flairFilter.has(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFlairFilter((prev) => {
                      const next = new Set(prev);
                      next.has(f) ? next.delete(f) : next.add(f);
                      return next;
                    });
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: active ? config.bg : "#fff",
                    color: active ? config.color : "#666",
                    border: `0.5px solid ${active ? config.color + "44" : "#ebebeb"}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

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
            {flairFilter.size > 0 && (
              <span>
                {" "}
                in{" "}
                <strong>
                  {[...flairFilter]
                    .map((f) => FLAIR_CONFIG[f].label)
                    .join(", ")}
                </strong>
              </span>
            )}
            <span style={{ color: "#4f8ef7" }}>
              · {visiblePosts.length}{" "}
              {visiblePosts.length === 1 ? "result" : "results"}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p style={{ fontSize: "13px", color: "#999" }}>Loading posts...</p>
          </div>
        ) : visiblePosts.length === 0 ? (
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
            {hasActiveFilters ? (
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
            ) : (
              <button
                type="button"
                onClick={() => router.push("/forum/create")}
                className="text-xs px-3 py-1.5 rounded-lg text-white"
                style={{
                  background: "#1a1a2e",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Create the first post
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId}
                onUpvote={handleUpvote}
                onFlag={handleFlag}
                onDelete={handleDelete}
                onHide={handleHide}
                mutedWords={mutedWords}
              />
            ))}
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="flex-shrink-0" style={{ width: "220px" }}>
          <RecentlyViewed />
        </div>
      )}
    </div>
  );
}
