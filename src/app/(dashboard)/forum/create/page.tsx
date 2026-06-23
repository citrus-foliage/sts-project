"use client";

import { useRouter } from "next/navigation";
import { ForumFlair } from "@/types/forum";
import PostForm from "@/components/forum/PostForm";
import ForumSidebar from "@/components/forum/ForumSidebar";

export default function CreatePostPage() {
  const router = useRouter();

  const handleSubmit = async (postData: {
    title: string;
    post_body: string;
    flair: ForumFlair;
    is_anonymous: boolean;
    image_url?: string;
  }) => {
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    router.push(`/forum/${data.post.id}`);
  };

  return (
    <div className="flex gap-5 h-full">
      {/* Left sidebar */}
      <div
        className="flex-shrink-0 flex flex-col gap-3"
        style={{ width: "220px" }}
      >
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

      {/* Center — form */}
      <div
        className="flex flex-col gap-4 flex-1 min-w-0"
        style={{ maxWidth: "680px" }}
      >
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
            Create a Post
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            Share something with the CIIT community. Your post will appear in
            the feed immediately.
          </p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
        >
          <PostForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/forum")}
          />
        </div>
      </div>
    </div>
  );
}
