import { ForumFlair, FLAIR_CONFIG } from "@/types/forum";

type Props = {
  flair: ForumFlair;
  size?: "sm" | "md";
};

export default function FlairBadge({ flair, size = "sm" }: Props) {
  const config = FLAIR_CONFIG[flair];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: "10px",
        fontSize: size === "sm" ? "10px" : "12px",
        fontWeight: 500,
        background: config.bg,
        color: config.color,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
