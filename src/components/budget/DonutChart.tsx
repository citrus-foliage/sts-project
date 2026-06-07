"use client";

type Segment = {
  color: string;
  percentage: number;
  label: string;
};

type DonutChartProps = {
  segments: Segment[];
  remaining: number;
  total: number;
  spent: number;
};

export default function DonutChart({
  segments,
  remaining,
  total,
  spent,
}: DonutChartProps) {
  const cx = 90;
  const cy = 90;
  const r = 72;
  const gap = 0.025;

  const toRad = (pct: number) => pct * 2 * Math.PI;

  const renderSegments = () => {
    let start = -Math.PI / 2;
    return segments.map((seg, i) => {
      if (seg.percentage <= 0) return null;
      const sweep = toRad(seg.percentage) - gap;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(start + sweep);
      const y2 = cy + r * Math.sin(start + sweep);
      const largeArc = sweep > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      start += sweep + gap;
      return <path key={i} d={d} fill={seg.color} />;
    });
  };

  const percentSpent = total > 0 ? Math.round((spent / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Donut */}
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {segments.length > 0 ? (
            <>
              {renderSegments()}
              {/* Inner circle */}
              <circle cx={cx} cy={cy} r={50} fill="#fff" />
            </>
          ) : (
            <>
              <circle cx={cx} cy={cy} r={r} fill="#f5f4f0" />
              <circle cx={cx} cy={cy} r={50} fill="#fff" />
            </>
          )}
        </svg>
        {/* Center text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: 500,
              color: "#1a1a2e",
              lineHeight: 1,
            }}
          >
            {total > 0 ? `₱${remaining.toLocaleString()}` : "—"}
          </p>
          <p style={{ fontSize: "10px", color: "#999", marginTop: "3px" }}>
            remaining
          </p>
          {total > 0 && (
            <p style={{ fontSize: "10px", color: "#639922", marginTop: "2px" }}>
              of ₱{total.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 w-full">
        {[
          {
            label: "Total Spent",
            value: total > 0 ? `₱${spent.toLocaleString()}` : "—",
            sub: total > 0 ? `${percentSpent}% used` : "No budget set",
            color: "#BA7517",
          },
          {
            label: "Available",
            value: total > 0 ? `₱${remaining.toLocaleString()}` : "—",
            sub: "remaining",
            color: "#639922",
          },
        ].map((chip) => (
          <div
            key={chip.label}
            className="flex-1 rounded-xl p-3 text-center"
            style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
          >
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a2e" }}>
              {chip.value}
            </p>
            <p style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>
              {chip.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
