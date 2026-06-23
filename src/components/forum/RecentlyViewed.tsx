"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForumFlair, FLAIR_CONFIG } from "@/types/forum";

type RecentPost = { id: string; title: string; flair: ForumFlair };
type Props = { excludePostId?: string };

export default function RecentlyViewed({ excludePostId }: Props) {
  const router = useRouter();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentPost[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const hiddenRes = await fetch("/api/forum/hide");
        const hiddenData = await hiddenRes.json();
        const hiddenIds = new Set<string>(
          (hiddenData.hidden ?? []).map((h: { post_id: string }) => h.post_id),
        );
        const stored = localStorage.getItem("slm_recently_viewed");
        const items: RecentPost[] = stored ? JSON.parse(stored) : [];
        setRecentlyViewed(
          items
            .filter((p) => p.id !== excludePostId)
            .filter((p) => !hiddenIds.has(p.id))
            .slice(0, 7),
        );
      } catch {
        try {
          const stored = localStorage.getItem("slm_recently_viewed");
          const items: RecentPost[] = stored ? JSON.parse(stored) : [];
          setRecentlyViewed(
            items.filter((p) => p.id !== excludePostId).slice(0, 7),
          );
        } catch {
          /* unavailable */
        }
      }
    };
    load();
  }, [excludePostId]);

  const handleClear = () => {
    try {
      if (excludePostId) {
        const stored = localStorage.getItem("slm_recently_viewed");
        if (stored) {
          const items: RecentPost[] = JSON.parse(stored);
          const current = items.find((p) => p.id === excludePostId);
          localStorage.setItem(
            "slm_recently_viewed",
            JSON.stringify(current ? [current] : []),
          );
        }
      } else {
        localStorage.removeItem("slm_recently_viewed");
      }
      setRecentlyViewed([]);
    } catch {
      setRecentlyViewed([]);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid #ebebeb" }}
      >
        <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
          Recently viewed
        </p>
        {recentlyViewed.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              color: "#999",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {recentlyViewed.length === 0 ? (
        <div className="px-4 py-5 flex flex-col items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ddd"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center" }}>
            Posts you visit will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {recentlyViewed.map((p, i) => {
            const flairConfig = FLAIR_CONFIG[p.flair] ?? {
              label: p.flair,
              color: "#999",
              bg: "#f5f4f0",
            };
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/forum/${p.id}`)}
                style={{
                  padding: "10px 14px",
                  borderBottom:
                    i < recentlyViewed.length - 1
                      ? "0.5px solid #f5f4f0"
                      : "none",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#fafafa")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "transparent")
                }
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: flairConfig.color,
                    background: flairConfig.bg,
                    padding: "1px 7px",
                    borderRadius: "8px",
                    width: "fit-content",
                  }}
                >
                  {flairConfig.label}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#1a1a2e",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
