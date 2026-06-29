"use client";

import DonutChart from "./DonutChart";

type Category = {
  id: string;
  category_id: string;
  category_label: string;
  allocated: number;
  color: string;
  spent: number;
};

type Props = {
  categories: Category[];
  totalBudget: number;
  categoriesOnly?: boolean;
};

export default function CategoryList({
  categories,
  totalBudget,
  categoriesOnly = false,
}: Props) {
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const remaining = totalBudget - totalSpent;

  const segments = categories.map((cat) => ({
    color: cat.color,
    percentage: totalBudget > 0 ? cat.allocated / totalBudget : 0,
    label: cat.category_label,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Donut chart — hidden when categoriesOnly */}
      {!categoriesOnly && (
        <DonutChart
          segments={segments}
          remaining={remaining}
          total={totalBudget}
          spent={totalSpent}
        />
      )}

      {/* Category rows */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "#999", letterSpacing: "0.06em" }}
        >
          Categories
        </p>
        {categories.map((cat) => {
          const pct =
            cat.allocated > 0
              ? Math.min((cat.spent / cat.allocated) * 100, 100)
              : 0;
          const isOver = cat.spent > cat.allocated;
          const isNear = pct >= 85 && !isOver;

          return (
            <div
              key={cat.category_id}
              className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ background: "#f5f4f0", border: "0.5px solid #ebebeb" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: 8, height: 8, background: cat.color }}
                />
                <span
                  className="text-xs font-medium flex-1"
                  style={{ color: "#1a1a2e" }}
                >
                  {cat.category_label}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#1a1a2e", fontFamily: "monospace" }}
                >
                  ₱{cat.spent.toLocaleString()}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "#999", fontFamily: "monospace" }}
                >
                  / ₱{cat.allocated.toLocaleString()}
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="rounded-full overflow-hidden"
                style={{ height: "4px", background: "#e5e5e5" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isOver
                      ? "#E24B4A"
                      : isNear
                        ? "#BA7517"
                        : cat.color,
                  }}
                />
              </div>
              {/* Status label */}
              <div className="flex justify-between">
                <span
                  className="text-xs"
                  style={{
                    color: isOver ? "#A32D2D" : isNear ? "#BA7517" : "#999",
                  }}
                >
                  {isOver
                    ? `Over by ₱${(cat.spent - cat.allocated).toLocaleString()}`
                    : isNear
                      ? "Approaching limit"
                      : `${Math.round(pct)}% used`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
