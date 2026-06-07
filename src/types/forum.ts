export type ForumFlair =
  | "confession"
  | "question"
  | "seeking_advice"
  | "rant"
  | "appreciation"
  | "showcase"
  | "crowdsourcing"
  | "marketplace"
  | "meme"
  | "announcement";

export type PostStatus = "active" | "pending_review" | "removed";

export type ForumPost = {
  id: string;
  author_id: string;
  is_anonymous: boolean;
  anon_code: string;
  flair: ForumFlair;
  title: string;
  body: string;
  upvotes: number;
  flag_count: number;
  status: PostStatus;
  is_pinned: boolean;
  created_at: string;
  comment_count?: number;
  user_has_upvoted?: boolean;
  user_has_flagged?: boolean;
};

export type ForumComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  is_anonymous: boolean;
  anon_code: string;
  body: string;
  upvotes: number;
  depth: number;
  created_at: string;
  replies?: ForumComment[];
  user_has_upvoted?: boolean;
};

export const FLAIR_CONFIG: Record<
  ForumFlair,
  { label: string; color: string; bg: string }
> = {
  confession: {
    label: "Confession",
    color: "#534AB7",
    bg: "rgba(83,74,183,0.1)",
  },
  question: {
    label: "Question",
    color: "#4f8ef7",
    bg: "rgba(79,142,247,0.1)",
  },
  seeking_advice: {
    label: "Seeking Advice",
    color: "#BA7517",
    bg: "rgba(186,117,23,0.1)",
  },
  rant: {
    label: "Rant",
    color: "#A32D2D",
    bg: "rgba(163,45,45,0.1)",
  },
  appreciation: {
    label: "Appreciation",
    color: "#639922",
    bg: "rgba(99,153,34,0.1)",
  },
  showcase: {
    label: "Showcase",
    color: "#7c5ce4",
    bg: "rgba(124,92,228,0.1)",
  },
  crowdsourcing: {
    label: "Crowdsourcing",
    color: "#0F6E56",
    bg: "rgba(15,110,86,0.1)",
  },
  marketplace: {
    label: "Marketplace",
    color: "#D85A30",
    bg: "rgba(216,90,48,0.1)",
  },
  meme: {
    label: "Meme",
    color: "#B5830A",
    bg: "rgba(181,131,10,0.1)",
  },
  announcement: {
    label: "Announcement",
    color: "#1a1a2e",
    bg: "rgba(26,26,46,0.08)",
  },
};

export const FORUM_RULES = [
  "Be respectful to everyone — harassment, targeted posts, and personal attacks are strictly prohibited.",
  "No hate speech, racism, discrimination, or content that demeans any individual or group.",
  "No NSFW, explicit, or sexually suggestive content of any kind.",
  "Use the correct flair for your post — mislabeled posts may be removed.",
  "No doxxing — do not share anyone's personal information without their explicit consent.",
  "No spam, excessive self-promotion, or duplicate posts.",
  "Marketplace posts must be honest — no scams, misleading listings, or price gouging.",
  "Crowdsourcing posts must be genuine academic or student-related requests.",
  "Anonymity is not a shield — all posts are traceable by moderators and violations result in a ban.",
  "When in doubt, report — do not engage with posts that violate these rules.",
];
