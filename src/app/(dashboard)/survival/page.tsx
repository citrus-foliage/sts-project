import DailyBudgetWidget from "@/components/budget/DailyBudgetWidget";

export default function SurvivalPage() {
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          Daily Budget Calculator
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Know exactly how much you can safely spend each day until your next
          allowance or payday.
        </p>
      </div>

      {/* Main widget — full size */}
      <DailyBudgetWidget compact={false} />

      {/* How it works */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#fff", border: "0.5px solid #ebebeb" }}
      >
        <p className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
          How it works
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              step: "1",
              title: "Enter your remaining balance",
              desc: "How much money do you currently have available to spend — allowance, income, or both.",
            },
            {
              step: "2",
              title: "Set your next budget cycle date",
              desc: "The date you expect your next allowance, salary, or any income to arrive.",
            },
            {
              step: "3",
              title: "Get your recommended daily spend",
              desc: "We divide your balance by the number of days remaining so you never run out before your next cycle.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{
                  background: "#1a1a2e",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {item.step}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#1a1a2e" }}>
                  {item.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "#666", lineHeight: 1.5 }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: "rgba(79,142,247,0.06)",
          border: "0.5px solid rgba(79,142,247,0.15)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f8ef7"
          strokeWidth="2"
          style={{ flexShrink: 0, marginTop: "1px" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs" style={{ color: "#4f8ef7", lineHeight: 1.6 }}>
          <strong>Tip:</strong> Update your balance whenever you receive money
          or make a large purchase to keep your daily limit accurate.
        </p>
      </div>
    </div>
  );
}
