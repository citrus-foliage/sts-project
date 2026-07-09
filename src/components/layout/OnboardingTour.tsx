"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    title: "Welcome to Student Life Manager!",
    description:
      "This is your all-in-one dashboard for managing your student life at CIIT. Let's take a quick tour of what you can do here.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4f8ef7"
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: "Task Manager",
    description:
      "Add and track all your academic tasks on a Kanban board or list view. Set due dates, priorities, and move tasks across columns as you progress.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#639922"
        strokeWidth="2"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <polyline points="3 6 4 7 6 5" />
        <polyline points="3 12 4 13 6 11" />
        <polyline points="3 18 4 19 6 17" />
      </svg>
    ),
    action: { label: "Go to Task Manager", href: "/tasks" },
  },
  {
    title: "Budget Planner",
    description:
      "Set your monthly budget, allocate it across categories like food and transport, and log every transaction. At month end, unspent balance automatically carries over.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#BA7517"
        strokeWidth="2"
      >
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <circle cx="16" cy="12" r="1" fill="#BA7517" />
      </svg>
    ),
    action: { label: "Set up Budget", href: "/budget" },
  },
  {
    title: "Schedule & Canvas",
    description:
      "Connect your Canvas iCal feed to see all your assignment deadlines on one calendar alongside your Google Calendar events and personal tasks.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#534AB7"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    action: { label: "Open Schedule", href: "/schedule" },
  },
  {
    title: "Focus Timer",
    description:
      "Use the Pomodoro technique to stay focused. Set focus sessions and short breaks — the timer tracks your sessions and builds your daily study streak.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D85A30"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    action: { label: "Start Focusing", href: "/timer" },
  },
  {
    title: "Discussion Hub",
    description:
      "A safe, anonymous space for the CIIT community. Ask questions, share experiences, vent, or celebrate — all posts are moderated to keep the space respectful.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0F6E56"
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    action: { label: "Visit Discussion Hub", href: "/forum" },
  },
  {
    title: "You're all set!",
    description:
      "That's everything. Start by setting up your budget and adding your first task. Your activity streak starts today — log in daily to keep it going!",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4f8ef7"
        strokeWidth="2"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

type Props = {
  onComplete: () => void;
};

export default function OnboardingTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleComplete = async () => {
    setExiting(true);
    try {
      await fetch("/api/settings/onboarding", { method: "POST" });
    } catch {
      // non-blocking
    }
    setTimeout(onComplete, 300);
  };

  const handleAction = (href: string) => {
    handleComplete();
    router.push(href);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 200,
          opacity: exiting ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          background: "#fff",
          borderRadius: "24px",
          padding: "36px 32px 28px",
          width: "460px",
          maxWidth: "92vw",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          opacity: exiting ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === step ? "#4f8ef7" : "#e5e5e5",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(79,142,247,0.08)" }}
        >
          {current.icon}
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "#1a1a2e" }}
          >
            {current.title}
          </h2>
          <p className="text-sm" style={{ color: "#666", lineHeight: 1.7 }}>
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Feature-specific action button */}
          {current.action && (
            <button
              type="button"
              onClick={() => handleAction(current.action!.href)}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(79,142,247,0.1)",
                border: "0.5px solid rgba(79,142,247,0.2)",
                color: "#4f8ef7",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {current.action.label} →
            </button>
          )}

          {/* Navigation row */}
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{
                  background: "#f5f4f0",
                  border: "0.5px solid #ebebeb",
                  color: "#666",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={handleComplete}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: "#1a1a2e",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Get started
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: "#1a1a2e",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Next
              </button>
            )}
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs text-center"
              style={{
                background: "none",
                border: "none",
                color: "#bbb",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "4px",
              }}
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </>
  );
}
