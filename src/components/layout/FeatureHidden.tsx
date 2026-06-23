"use client";

import { useRouter } from "next/navigation";

type Props = {
  featureName: string;
};

export default function FeatureHidden({ featureName }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: "rgba(186,117,23,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#BA7517"
          strokeWidth="2"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      </div>
      <div>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#1a1a2e",
            marginBottom: "6px",
          }}
        >
          {featureName} is hidden
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#666",
            lineHeight: 1.6,
            maxWidth: "320px",
          }}
        >
          You've hidden this feature in your settings. You can re-enable it
          anytime under Settings → General → Features.
        </p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/settings")}
        style={{
          padding: "8px 20px",
          borderRadius: "10px",
          border: "none",
          background: "#1a1a2e",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Go to Settings
      </button>
    </div>
  );
}
