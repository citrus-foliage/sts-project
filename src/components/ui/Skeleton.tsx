export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: "#ebebeb", borderRadius: "8px", ...style }}
    />
  );
}
