"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FLAIR_CONFIG, FORUM_RULES, ForumFlair } from "@/types/forum";

export default function ForumSidebar() {
  const [showRules, setShowRules] = useState(false);
  const router = useRouter();

  const flairs = Object.entries(FLAIR_CONFIG) as [
    ForumFlair,
    { label: string; color: string; bg: string },
  ][];

  return (
    <div className="flex flex-col gap-3">
      {/* Community rules */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          style={{
            borderBottom: showRules ? "0.5px solid #ebebeb" : "none",
          }}
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
              style={{ width: 7, height: 7, background: config.color }}
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

      {/* Activity link */}
      <button
        type="button"
        onClick={() => router.push("/forum/activity")}
        className="rounded-2xl p-4 flex items-center gap-3 text-left w-full"
        style={{
          background: "#fff",
          border: "0.5px solid #ebebeb",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#f5f4f0")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background = "#fff")
        }
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f8ef7"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <div>
          <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
            Your activity
          </p>
          <p className="text-xs" style={{ color: "#999", marginTop: "1px" }}>
            Saved and hidden posts
          </p>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ccc"
          strokeWidth="2"
          style={{ marginLeft: "auto", flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
