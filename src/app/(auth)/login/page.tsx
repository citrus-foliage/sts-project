"use client";

import React from "react";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "@/components/motion";

function LoginContent() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f5f4f0" }}
      >
        <p style={{ fontSize: "13px", color: "#999" }}>Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const features = [
    {
      id: "task",
      name: "Task & Productivity Management",
      desc: "Organize your academic tasks, deadlines, and personal responsibilities through a centralized productivity system designed to help you manage your workload more effectively.",
      icon: <ChecklistIcon />,
      color: "#4f8ef7",
      bg: "rgba(79,142,247,0.15)",
    },
    {
      id: "budget",
      name: "Budget Planner",
      desc: "Monitor expenses, manage your allowance or income, and develop better financial habits through a simple budgeting system built around local student spending.",
      icon: <WalletIcon />,
      color: "#639922",
      bg: "rgba(99,153,34,0.1)",
    },
    {
      id: "calculator",
      name: "Daily Budget Calculator",
      desc: "Calculate how much you can safely spend each day based on your available balance and next budget cycle — so you never run out before the week ends.",
      icon: <CalcIcon />,
      color: "#1D9E75",
      bg: "rgba(29,158,117,0.1)",
    },
    {
      id: "schedule",
      name: "Academic Schedule Integration",
      desc: "Organize class schedules, deadlines, and academic activities within a unified calendar interface, with direct support for importing your Canvas Instructure schedule.",
      icon: <CalendarIcon />,
      color: "#4f8ef7",
      bg: "rgba(79,142,247,0.1)",
    },
    {
      id: "forum",
      name: "Community Discussion Hub",
      desc: "A safe and accessible space for sharing experiences, raising student life concerns, and engaging with the CIIT community — with the option to post anonymously when needed.",
      icon: <ChatIcon />,
      color: "#534AB7",
      bg: "rgba(83,74,183,0.1)",
    },
    {
      id: "timer",
      name: "Focus Timer",
      desc: "Stay focused with built-in Pomodoro study sessions. Track daily focus time and build consistent study habits that support long-term academic performance.",
      icon: <ClockIcon />,
      color: "#BA7517",
      bg: "rgba(186,117,23,0.1)",
    },
    {
      id: "resources",
      name: "Student Support Resources",
      desc: "Centralize access to academic assistance, mental health support, scholarship opportunities, emergency contacts, and other essential student services — all in one searchable directory built for students in the CIIT area.",
      icon: <MapPinIcon />,
      color: "#4f8ef7",
      bg: "rgba(79,142,247,0.09)",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Sign in with your CIIT account",
      desc: "Use your official CIIT school email account. No separate registration, no waiting for approval — your school email is your verified identity.",
      graphic: (
        <svg
          viewBox="0 0 320 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <rect
            x="60"
            y="40"
            width="200"
            height="160"
            rx="16"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          <rect x="100" y="65" width="120" height="28" rx="8" fill="#f5f4f0" />
          <rect
            x="112"
            y="73"
            width="12"
            height="12"
            rx="3"
            fill="#1a1a2e"
            opacity="0.8"
          />
          <rect
            x="128"
            y="75"
            width="60"
            height="8"
            rx="3"
            fill="#1a1a2e"
            opacity="0.4"
          />
          <line
            x1="80"
            y1="108"
            x2="240"
            y2="108"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          <rect
            x="90"
            y="120"
            width="140"
            height="36"
            rx="10"
            fill="#fff"
            stroke="#e5e5e5"
            strokeWidth="1"
          />
          <circle cx="115" cy="138" r="8" fill="#4285f4" opacity="0.8" />
          <rect
            x="128"
            y="133"
            width="70"
            height="10"
            rx="3"
            fill="#1a1a2e"
            opacity="0.35"
          />
          <rect
            x="95"
            y="168"
            width="130"
            height="22"
            rx="8"
            fill="rgba(79,142,247,0.08)"
            stroke="rgba(79,142,247,0.2)"
            strokeWidth="0.5"
          />
          <rect
            x="105"
            y="175"
            width="8"
            height="8"
            rx="1"
            fill="#4f8ef7"
            opacity="0.5"
          />
          <rect
            x="117"
            y="177"
            width="70"
            height="4"
            rx="2"
            fill="#4f8ef7"
            opacity="0.4"
          />
          <circle
            cx="235"
            cy="55"
            r="16"
            fill="rgba(99,153,34,0.15)"
            stroke="rgba(99,153,34,0.3)"
            strokeWidth="1"
          />
          <path
            d="M228 55l4 4 8-8"
            stroke="#639922"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Set up your account and sync your tools",
      desc: "Connect your Google Calendar and paste your Canvas iCal link to automatically pull in deadlines. Set your monthly budget, allowance date, and spending categories — all in a few minutes.",
      graphic: (
        <svg
          viewBox="0 0 320 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="160" cy="120" r="32" fill="#1a1a2e" />
          <rect
            x="148"
            y="110"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.6)"
          />
          <rect
            x="160"
            y="110"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.6)"
          />
          <rect
            x="148"
            y="122"
            width="8"
            height="8"
            rx="2"
            fill="rgba(255,255,255,0.6)"
          />
          <rect x="160" y="122" width="8" height="8" rx="2" fill="#4f8ef7" />
          <rect
            x="30"
            y="40"
            width="80"
            height="60"
            rx="12"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          <rect
            x="30"
            y="40"
            width="80"
            height="22"
            rx="12"
            fill="#4f8ef7"
            opacity="0.9"
          />
          <rect
            x="30"
            y="52"
            width="80"
            height="10"
            fill="#4f8ef7"
            opacity="0.9"
          />
          <text
            x="70"
            y="56"
            textAnchor="middle"
            fontSize="8"
            fill="#fff"
            fontWeight="600"
          >
            Google
          </text>
          <text
            x="70"
            y="67"
            textAnchor="middle"
            fontSize="7"
            fill="#fff"
            opacity="0.8"
          >
            Calendar
          </text>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={38 + i * 22}
              y="72"
              width="16"
              height="12"
              rx="3"
              fill={i === 1 ? "rgba(79,142,247,0.2)" : "#f5f4f0"}
            />
          ))}
          <text x="70" y="80" textAnchor="middle" fontSize="7" fill="#4f8ef7">
            synced
          </text>
          <line
            x1="110"
            y1="70"
            x2="130"
            y2="110"
            stroke="#4f8ef7"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <circle cx="120" cy="90" r="3" fill="#4f8ef7" opacity="0.6" />
          <rect
            x="210"
            y="40"
            width="80"
            height="60"
            rx="12"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          <rect
            x="210"
            y="40"
            width="80"
            height="22"
            rx="12"
            fill="#E24B4A"
            opacity="0.9"
          />
          <rect
            x="210"
            y="52"
            width="80"
            height="10"
            fill="#E24B4A"
            opacity="0.9"
          />
          <text
            x="250"
            y="56"
            textAnchor="middle"
            fontSize="8"
            fill="#fff"
            fontWeight="600"
          >
            Canvas
          </text>
          <text
            x="250"
            y="67"
            textAnchor="middle"
            fontSize="7"
            fill="#fff"
            opacity="0.8"
          >
            Instructure
          </text>
          <rect x="218" y="72" width="64" height="5" rx="2.5" fill="#f5f4f0" />
          <rect x="218" y="81" width="44" height="5" rx="2.5" fill="#f5f4f0" />
          <text x="250" y="96" textAnchor="middle" fontSize="7" fill="#E24B4A">
            deadlines imported
          </text>
          <line
            x1="210"
            y1="70"
            x2="190"
            y2="110"
            stroke="#E24B4A"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <circle cx="200" cy="90" r="3" fill="#E24B4A" opacity="0.6" />
          <rect
            x="30"
            y="155"
            width="80"
            height="60"
            rx="12"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          <text
            x="70"
            y="172"
            textAnchor="middle"
            fontSize="9"
            fill="#1a1a2e"
            fontWeight="600"
          >
            ₱5,000
          </text>
          <text x="70" y="182" textAnchor="middle" fontSize="7" fill="#999">
            monthly budget
          </text>
          <rect x="38" y="188" width="64" height="4" rx="2" fill="#f0eff0" />
          <rect
            x="38"
            y="188"
            width="48"
            height="4"
            rx="2"
            fill="#639922"
            opacity="0.5"
          />
          <text x="70" y="207" textAnchor="middle" fontSize="7" fill="#639922">
            ₱280 / day
          </text>
          <line
            x1="110"
            y1="180"
            x2="130"
            y2="148"
            stroke="#639922"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <rect
            x="210"
            y="155"
            width="80"
            height="60"
            rx="12"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="1"
          />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x="220"
                y={168 + i * 14}
                width="8"
                height="8"
                rx="2"
                fill={i === 0 ? "#4f8ef7" : "#f0eff0"}
                opacity={i === 0 ? 0.4 : 1}
              />
              <rect
                x="232"
                y={170 + i * 14}
                width={[40, 30, 35][i]}
                height="4"
                rx="2"
                fill="#1a1a2e"
                opacity={i === 0 ? 0.15 : 0.2}
              />
            </g>
          ))}
          <text x="250" y="207" textAnchor="middle" fontSize="7" fill="#BA7517">
            tasks synced
          </text>
          <line
            x1="210"
            y1="175"
            x2="190"
            y2="148"
            stroke="#BA7517"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Explore everything built for you",
      desc: "Track tasks on a kanban board, monitor your budget by category, post anonymously on the community forum, set focus sessions with the Pomodoro timer, and find student resources near CIIT — all from one dashboard.",
      graphic: (
        <svg
          viewBox="0 0 320 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <rect x="25" y="20" width="52" height="200" rx="10" fill="#0f1117" />
          <rect
            x="35"
            y="36"
            width="32"
            height="8"
            rx="4"
            fill="rgba(255,255,255,0.12)"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect
                x="35"
                y={58 + i * 22}
                width="8"
                height="8"
                rx="2"
                fill={i === 0 ? "#4f8ef7" : "rgba(255,255,255,0.12)"}
              />
              <rect
                x="47"
                y={60 + i * 22}
                width="20"
                height="4"
                rx="2"
                fill={
                  i === 0 ? "rgba(79,142,247,0.4)" : "rgba(255,255,255,0.07)"
                }
              />
            </g>
          ))}
          <rect x="82" y="20" width="213" height="200" rx="10" fill="#f5f4f0" />
          <rect
            x="82"
            y="20"
            width="213"
            height="28"
            rx="10"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="0.5"
          />
          <rect x="82" y="36" width="213" height="12" fill="#fff" />
          <rect x="90" y="28" width="48" height="8" rx="3" fill="#f5f4f0" />
          <rect
            x="264"
            y="26"
            width="24"
            height="12"
            rx="6"
            fill="#1a1a2e"
            opacity="0.7"
          />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect
                x={92 + i * 48}
                y="58"
                width="40"
                height="32"
                rx="6"
                fill="#fff"
                stroke="#ebebeb"
                strokeWidth="0.5"
              />
              <rect
                x={98 + i * 48}
                y="64"
                width="22"
                height="4"
                rx="2"
                fill="#f0eff0"
              />
              <rect
                x={98 + i * 48}
                y="72"
                width="16"
                height="7"
                rx="2"
                fill={["#4f8ef7", "#639922", "#BA7517", "#534AB7"][i]}
                opacity="0.5"
              />
            </g>
          ))}
          <rect
            x="92"
            y="100"
            width="94"
            height="110"
            rx="8"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="0.5"
          />
          <rect
            x="100"
            y="108"
            width="40"
            height="5"
            rx="2"
            fill="#1a1a2e"
            opacity="0.4"
          />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect
                x="100"
                y={120 + i * 20}
                width="8"
                height="8"
                rx="2"
                fill={["#4f8ef7", "#639922", "#BA7517", "#bbb"][i]}
                opacity="0.3"
              />
              <rect
                x="112"
                y={122 + i * 20}
                width={[55, 42, 50, 38][i]}
                height="4"
                rx="2"
                fill="#1a1a2e"
                opacity={i === 3 ? 0.15 : 0.2}
              />
              {i === 3 && (
                <line
                  x1="112"
                  y1="124"
                  x2="162"
                  y2="124"
                  stroke="#bbb"
                  strokeWidth="0.5"
                />
              )}
            </g>
          ))}
          <rect
            x="194"
            y="100"
            width="94"
            height="50"
            rx="8"
            fill="#fff"
            stroke="#ebebeb"
            strokeWidth="0.5"
          />
          <circle
            cx="222"
            cy="125"
            r="16"
            fill="none"
            stroke="#f0eff0"
            strokeWidth="5"
          />
          <circle
            cx="222"
            cy="125"
            r="16"
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="5"
            strokeDasharray="40 100"
            strokeLinecap="round"
            transform="rotate(-90 222 125)"
          />
          <circle cx="222" cy="125" r="9" fill="#fff" />
          <text
            x="222"
            y="128"
            textAnchor="middle"
            fontSize="6"
            fill="#1a1a2e"
            fontWeight="600"
          >
            ₱1,750
          </text>
          <rect x="246" y="108" width="34" height="5" rx="2" fill="#f0eff0" />
          <rect
            x="246"
            y="117"
            width="34"
            height="4"
            rx="2"
            fill="#4f8ef7"
            opacity="0.3"
          />
          <rect x="246" y="125" width="34" height="4" rx="2" fill="#f0eff0" />
          <rect
            x="246"
            y="133"
            width="34"
            height="4"
            rx="2"
            fill="#639922"
            opacity="0.3"
          />
          <rect
            x="194"
            y="158"
            width="94"
            height="52"
            rx="8"
            fill="#0f1117"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
          <circle cx="210" cy="178" r="8" fill="rgba(83,74,183,0.4)" />
          <text
            x="210"
            y="181"
            textAnchor="middle"
            fontSize="7"
            fill="rgba(255,255,255,0.6)"
          >
            ?
          </text>
          <rect
            x="224"
            y="174"
            width="55"
            height="4"
            rx="2"
            fill="rgba(255,255,255,0.15)"
          />
          <rect
            x="224"
            y="182"
            width="40"
            height="3"
            rx="1.5"
            fill="rgba(255,255,255,0.08)"
          />
          <rect
            x="202"
            y="192"
            width="24"
            height="10"
            rx="4"
            fill="rgba(79,142,247,0.25)"
          />
          <text x="214" y="199" textAnchor="middle" fontSize="6" fill="#4f8ef7">
            ↑ 12
          </text>
          <rect
            x="232"
            y="192"
            width="28"
            height="10"
            rx="4"
            fill="rgba(255,255,255,0.05)"
          />
          <text
            x="246"
            y="199"
            textAnchor="middle"
            fontSize="6"
            fill="rgba(255,255,255,0.4)"
          >
            4 replies
          </text>
        </svg>
      ),
    },
    {
      number: "04",
      title: "You're all set — make it yours",
      desc: "That's it. No more juggling five different apps. No more forgotten deadlines or running out of allowance mid-week. Just open Student Life Manager and focus on what actually matters — being a student.",
      graphic: (
        <svg
          viewBox="0 0 320 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="160" cy="110" r="70" fill="rgba(79,142,247,0.06)" />
          <circle cx="160" cy="110" r="50" fill="rgba(79,142,247,0.08)" />
          <circle cx="160" cy="110" r="34" fill="#1a1a2e" />
          <circle
            cx="160"
            cy="110"
            r="34"
            fill="none"
            stroke="rgba(79,142,247,0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <path
            d="M147 110l8 8 18-18"
            stroke="#4f8ef7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            { angle: 0, color: "#4f8ef7", label: "Tasks" },
            { angle: 60, color: "#639922", label: "Budget" },
            { angle: 120, color: "#E24B4A", label: "Canvas" },
            { angle: 180, color: "#534AB7", label: "Forum" },
            { angle: 240, color: "#BA7517", label: "Timer" },
            { angle: 300, color: "#1D9E75", label: "Daily" },
          ].map((dot, i) => {
            const rad = (dot.angle * Math.PI) / 180;
            const x = 160 + 74 * Math.cos(rad);
            const y = 110 + 74 * Math.sin(rad);
            return (
              <g key={i}>
                <line
                  x1="160"
                  y1="110"
                  x2={x}
                  y2={y}
                  stroke={dot.color}
                  strokeWidth="0.5"
                  opacity="0.2"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="#fff"
                  stroke={dot.color}
                  strokeWidth="1"
                  opacity="0.8"
                />
                <circle cx={x} cy={y} r="7" fill={dot.color} opacity="0.25" />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="6"
                  fill={dot.color}
                  fontWeight="600"
                >
                  {dot.label}
                </text>
              </g>
            );
          })}
          <text
            x="160"
            y="200"
            textAnchor="middle"
            fontSize="11"
            fill="#1a1a2e"
            fontWeight="600"
          >
            Student Life Manager
          </text>
          <text x="160" y="215" textAnchor="middle" fontSize="8" fill="#999">
            @ciit.edu.ph · verified
          </text>
        </svg>
      ),
    },
  ];

  const authError = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.endsWith("@ciit.edu.ph")) {
      setError("Please use your CIIT school email (@ciit.edu.ph)");
      return;
    }
    setLoading(true);
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (result?.ok) {
      setEmailSent(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#f5f4f0" }}
    >
      {/* ── Convergence Lines Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="centerFade" cx="38%" cy="50%" r="45%">
              <stop offset="0%" stopColor="#f5f4f0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f5f4f0" stopOpacity="1" />
            </radialGradient>
          </defs>
          <g opacity="0.18" stroke="#4f8ef7" strokeWidth="1" fill="none">
            <line x1="1440" y1="0" x2="380" y2="450" />
            <line x1="1440" y1="60" x2="380" y2="450" />
            <line x1="1440" y1="120" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1440" y1="180" x2="380" y2="450" />
            <line x1="1440" y1="240" x2="380" y2="450" />
            <line x1="1440" y1="300" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1440" y1="360" x2="380" y2="450" />
            <line x1="1440" y1="420" x2="380" y2="450" />
            <line x1="1440" y1="480" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1440" y1="540" x2="380" y2="450" />
            <line x1="1440" y1="600" x2="380" y2="450" />
            <line x1="1440" y1="660" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1440" y1="720" x2="380" y2="450" />
            <line x1="1440" y1="780" x2="380" y2="450" />
            <line x1="1440" y1="840" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1440" y1="900" x2="380" y2="450" />
            <line x1="400" y1="0" x2="380" y2="450" />
            <line x1="550" y1="0" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="700" y1="0" x2="380" y2="450" />
            <line x1="850" y1="0" x2="380" y2="450" />
            <line x1="1000" y1="0" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1150" y1="0" x2="380" y2="450" />
            <line x1="1300" y1="0" x2="380" y2="450" />
            <line x1="450" y1="900" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="620" y1="900" x2="380" y2="450" />
            <line x1="790" y1="900" x2="380" y2="450" />
            <line x1="960" y1="900" x2="380" y2="450" stroke="#7c5ce4" />
            <line x1="1130" y1="900" x2="380" y2="450" />
            <line x1="1300" y1="900" x2="380" y2="450" />
          </g>
          <circle cx="380" cy="450" r="10" fill="#4f8ef7" opacity="0.12" />
          <circle cx="380" cy="450" r="4" fill="#4f8ef7" opacity="0.25" />
          <rect x="0" y="0" width="1440" height="900" fill="url(#centerFade)" />
        </svg>
      </div>

      {/* ── Navbar ── */}
      <nav
        className="relative z-10 flex items-center px-12 py-4 border-b"
        style={{
          borderColor: "rgba(0,0,0,0.06)",
          background: "rgba(245,244,240,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "#1a1a2e" }}
          >
            SL
          </div>
          <span className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
            Student Life Manager
          </span>
          <span className="text-xs" style={{ color: "#999" }}>
            · CIIT
          </span>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: "Features", target: "features" },
            { label: "How It Works", target: "how-it-works" },
          ].map((link) => (
            <span
              key={link.label}
              className="text-sm cursor-pointer transition-colors"
              style={{ color: "#666" }}
              onClick={() => {
                document
                  .getElementById(link.target)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {link.label}
            </span>
          ))}
          <button
            onClick={handleGoogleSignIn}
            className="px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "#1a1a2e" }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-12 py-20">
        <div className="flex items-center gap-16 max-w-5xl w-full">
          {/* Left — Headline */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit"
              style={{
                background: "rgba(79,142,247,0.08)",
                border: "0.5px solid rgba(79,142,247,0.2)",
                color: "#4f8ef7",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Exclusively for CIIT students
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight tracking-tight"
              style={{
                fontSize: "44px",
                color: "#1a1a2e",
                letterSpacing: "-0.02em",
              }}
            >
              One Platform for
              <br />
              Every Challenge of
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Student Life.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ color: "#5a5a6e", lineHeight: "1.75" }}
            >
              Managing academics, finances, and well-being as a student
              shouldn&apos;t require juggling multiple apps. Student Life
              Manager brings it all together — built specifically for CIIT
              students.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                { icon: "✓", label: "Task Management" },
                { icon: "✓", label: "Budget Planning" },
                { icon: "✓", label: "Schedule Integration" },
                { icon: "✓", label: "Community Forum" },
                { icon: "✓", label: "Expense Calculator" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "0.5px solid rgba(0,0,0,0.09)",
                    color: "#444",
                  }}
                >
                  <span style={{ color: "#4f8ef7", fontWeight: 600 }}>
                    {chip.icon}
                  </span>
                  {chip.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Auth Card */}
          <div
            className="rounded-2xl overflow-hidden flex-shrink-0"
            style={{
              width: "340px",
              background: "#fff",
              border: "0.5px solid rgba(0,0,0,0.07)",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(79,142,247,0.08)",
            }}
          >
            {/* Card header */}
            <div
              className="px-6 py-5 relative overflow-hidden"
              style={{ background: "#0f1117" }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: 120,
                  height: 120,
                  top: -40,
                  right: -40,
                  background: "rgba(79,142,247,0.1)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 90,
                  height: 90,
                  bottom: -30,
                  left: 15,
                  background: "rgba(124,92,228,0.08)",
                }}
              />
              <p
                className="text-xs font-medium tracking-widest uppercase mb-2 relative z-10"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                CIIT Student Portal
              </p>
              <h2
                className="text-xl font-semibold leading-snug relative z-10"
                style={{ color: "#fff" }}
              >
                Welcome to
                <br />
                <span
                  style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}
                >
                  Student Life Manager
                </span>
              </h2>
            </div>

            {/* Card body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Login / Register tabs */}
              <div
                className="flex rounded-xl p-1 gap-1"
                style={{ background: "#f5f4f0" }}
              >
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
                    style={{
                      background: tab === t ? "#fff" : "transparent",
                      color: tab === t ? "#1a1a2e" : "#888",
                      boxShadow:
                        tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    {t === "login" ? "Login" : "Register"}
                  </button>
                ))}
              </div>

              {/* Domain restriction badge */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(79,142,247,0.06)",
                  border: "0.5px solid rgba(79,142,247,0.15)",
                  color: "#4f8ef7",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Restricted to @ciit.edu.ph accounts only
              </div>

              {/* Auth error */}
              {authError && (
                <div
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: "#fef2f2",
                    border: "0.5px solid #fecaca",
                    color: "#dc2626",
                  }}
                >
                  Only @ciit.edu.ph email addresses are allowed.
                </div>
              )}

              {/* Email sent confirmation */}
              {emailSent ? (
                <div
                  className="px-3 py-3 rounded-lg text-xs leading-relaxed"
                  style={{
                    background: "#f0fdf4",
                    border: "0.5px solid #bbf7d0",
                    color: "#166534",
                  }}
                >
                  ✅ Check your email — we sent a sign-in link to{" "}
                  <strong>{email}</strong>
                </div>
              ) : (
                <>
                  {/* Google button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      color: "#1a1a2e",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335)",
                      }}
                    >
                      G
                    </div>
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-px"
                      style={{ background: "#eee" }}
                    />
                    <span className="text-xs" style={{ color: "#bbb" }}>
                      or use your school email
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "#eee" }}
                    />
                  </div>

                  {/* Email form */}
                  <form
                    onSubmit={handleEmailSubmit}
                    className="flex flex-col gap-2"
                  >
                    <label
                      className="text-xs font-medium"
                      style={{ color: "#555" }}
                    >
                      School email address
                    </label>
                    <input
                      type="email"
                      placeholder="yourname@ciit.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{
                        border: "1px solid #e5e5e5",
                        background: "#fafafa",
                        color: "#1a1a2e",
                        fontFamily: "inherit",
                      }}
                    />
                    {error && (
                      <p className="text-xs" style={{ color: "#dc2626" }}>
                        {error}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "#bbb" }}>
                      Use your official CIIT school email
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 mt-1"
                      style={{ background: "#1a1a2e" }}
                    >
                      {loading ? "Please wait..." : "Continue with email"}
                      {!loading && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* WIP - Terms of Service and Privacy Policy */}
              <p
                className="text-center text-xs leading-relaxed"
                style={{ color: "#bbb" }}
              >
                By continuing, you agree to our{" "}
                <span className="cursor-pointer" style={{ color: "#4f8ef7" }}>
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="cursor-pointer" style={{ color: "#4f8ef7" }}>
                  Privacy Policy
                </span>
                .<br />
                Your identity is protected and never shared publicly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 py-24 px-12"
        style={{
          background: "#fff",
          borderTop: "0.5px solid rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background: "rgba(79,142,247,0.07)",
              border: "0.5px solid rgba(79,142,247,0.18)",
              color: "#4f8ef7",
            }}
          >
            Designed for student success
          </div>
          <h2
            className="font-bold leading-tight tracking-tight mb-3"
            style={{
              fontSize: "30px",
              color: "#1a1a2e",
              letterSpacing: "-0.02em",
            }}
          >
            A Better Way to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Balance Student Life
            </span>
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#666", lineHeight: "1.65" }}
          >
            From financial stress to academic overload, every feature is
            grounded in the real challenges CIIT students navigate.
          </p>
        </div>

        {/* Modal overlay */}
        {activeFeature &&
          (() => {
            const feat = features.find((f) => f.id === activeFeature)!;
            return (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setActiveFeature(null)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    zIndex: 50,
                    animation: "fadeIn 0.2s ease",
                  }}
                />
                {/* Modal card */}
                <div
                  style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 51,
                    background: "#0f1117",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    padding: "36px",
                    width: "420px",
                    maxWidth: "90vw",
                    boxShadow:
                      "0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
                    animation: "popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setActiveFeature(null)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      background: "rgba(255,255,255,0.07)",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "14px",
                      fontFamily: "inherit",
                    }}
                  >
                    ✕
                  </button>

                  {/* Icon */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.08)",
                      marginBottom: "20px",
                    }}
                  >
                    <span
                      style={{
                        color: "#fff",
                        display: "flex",
                        transform: "scale(1.3)",
                      }}
                    >
                      {feat.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "12px",
                      lineHeight: 1.2,
                    }}
                  >
                    {feat.name}
                  </p>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: "1.7",
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>

                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes popIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                  }
                `}</style>
              </>
            );
          })()}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px",
            maxWidth: "960px",
            margin: "0 auto",
            padding: "24px",
            alignItems: "start",
          }}
        >
          {features
            .filter((f) => f.id !== "resources")
            .map((feat) => {
              const isActive = activeFeature === feat.id;
              return (
                <div
                  key={feat.id}
                  onClick={() =>
                    setActiveFeature(activeFeature === feat.id ? null : feat.id)
                  }
                  style={{
                    gridColumn: "span 1",
                    background: "#fafafa",
                    border: "0.5px solid rgba(0,0,0,0.07)",
                    borderRadius: "14px",
                    padding: "22px 20px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "14px",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  {/* Large icon */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: feat.bg,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        color: feat.color,
                        display: "flex",
                        transform: "scale(1.4)",
                      }}
                    >
                      {feat.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1a1a2e",
                      lineHeight: 1.25,
                    }}
                  >
                    {feat.name}
                  </p>
                </div>
              );
            })}

          {/* Resources card — centered at bottom */}
          {(() => {
            const feat = features.find((f) => f.id === "resources")!;
            return (
              <div
                key="resources"
                onClick={() =>
                  setActiveFeature(
                    activeFeature === "resources" ? null : "resources",
                  )
                }
                style={{
                  gridColumn: "2 / 3",
                  background: "rgba(79,142,247,0.04)",
                  border: "0.5px solid rgba(79,142,247,0.12)",
                  borderRadius: "14px",
                  padding: "22px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "14px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: feat.bg,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: feat.color,
                      display: "flex",
                      transform: "scale(1.4)",
                    }}
                  >
                    {feat.icon}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1a1a2e",
                    lineHeight: 1.25,
                  }}
                >
                  {feat.name}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative z-10"
        style={{
          padding: "100px 48px",
          background: "#f5f4f0",
          borderTop: "0.5px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                background: "rgba(79,142,247,0.07)",
                border: "0.5px solid rgba(79,142,247,0.18)",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 500,
                color: "#4f8ef7",
                marginBottom: "14px",
              }}
            >
              Simple to get started
            </div>
            <h2
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#1a1a2e",
                letterSpacing: "-0.02em",
                marginBottom: "12px",
                lineHeight: 1.2,
              }}
            >
              Up and running in{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                four steps
              </span>
            </h2>
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.65 }}>
              No complicated setup. No separate account. Just your CIIT email
              and you&apos;re in.
            </p>
          </div>

          {/* Step layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              alignItems: "start",
            }}
          >
            {/* Left — Graphic */}
            <div
              style={{
                height: "320px",
                background: "#fff",
                borderRadius: "20px",
                border: "0.5px solid #ebebeb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                position: "sticky",
                top: "80px",
                overflow: "hidden",
              }}
            >
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ width: "100%", height: "100%" }}
              >
                {steps[activeStep].graphic}
              </motion.div>
            </div>

            {/* Right — Steps */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveStep(i)}
                    onClick={() => setActiveStep(i)}
                    style={{
                      display: "flex",
                      gap: "16px",
                      padding: "18px 20px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      background: isActive ? "#fff" : "transparent",
                      border: isActive
                        ? "0.5px solid #ebebeb"
                        : "0.5px solid transparent",
                      transition: "all 0.2s ease",
                      boxShadow: isActive
                        ? "0 2px 12px rgba(0,0,0,0.05)"
                        : "none",
                    }}
                  >
                    {/* Step number */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: isActive ? "#1a1a2e" : "#ebebeb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: isActive ? "#fff" : "#999",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                        fontFamily: "monospace",
                      }}
                    >
                      {step.number}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: isActive ? "#1a1a2e" : "#555",
                          marginBottom: "5px",
                          transition: "color 0.2s",
                        }}
                      >
                        {step.title}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: isActive ? "#666" : "#999",
                          lineHeight: 1.6,
                          maxHeight: isActive ? "80px" : "0px",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          opacity: isActive ? 1 : 0,
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section
        className="relative z-10"
        style={{
          padding: "100px 48px",
          background: "#fff",
          borderTop: "0.5px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                background: "rgba(79,142,247,0.07)",
                border: "0.5px solid rgba(79,142,247,0.18)",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 500,
                color: "#4f8ef7",
                marginBottom: "14px",
              }}
            >
              Who is this for?
            </div>
            <h2
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#1a1a2e",
                letterSpacing: "-0.02em",
                marginBottom: "12px",
                lineHeight: 1.2,
              }}
            >
              Built exclusively for{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                CIIT students
              </span>
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: 1.65,
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              Every feature, every category, every decision was made with one
              person in mind — you, as a student at CIIT.
            </p>
          </div>

          {/* Centerpiece card */}
          <div
            style={{
              background: "#0f1117",
              borderRadius: "24px",
              overflow: "hidden",
              border: "0.5px solid rgba(255,255,255,0.06)",
              maxWidth: "860px",
              margin: "0 auto",
            }}
          >
            {/* Top band */}
            <div
              style={{
                padding: "28px 40px 24px",
                borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4f8ef7, #7c5ce4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                SL
              </div>
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  Student Life Manager
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: "1px",
                  }}
                >
                  Restricted to @ciit.edu.ph accounts only
                </p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 500,
                    background: "rgba(99,153,34,0.15)",
                    color: "#639922",
                    border: "0.5px solid rgba(99,153,34,0.25)",
                  }}
                >
                  CIIT only
                </span>
              </div>
            </div>

            {/* Three columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
              }}
            >
              {[
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  ),
                  color: "#4f8ef7",
                  bg: "rgba(79,142,247,0.12)",
                  title: "Full-time students",
                  desc: "Managing coursework, Canvas deadlines, and a weekly allowance across multiple subjects and group projects.",
                  tags: ["Task Manager", "Schedule", "Budget Planner"],
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  ),
                  color: "#7c5ce4",
                  bg: "rgba(124,92,228,0.12)",
                  title: "Working students",
                  desc: "Juggling part-time jobs, freelance commissions, and irregular income alongside your academic requirements.",
                  tags: ["Daily Budget", "Focus Timer", "Task Manager"],
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  ),
                  color: "#1D9E75",
                  bg: "rgba(29,158,117,0.12)",
                  title: "Every CIIT student",
                  desc: "If you study here, this is yours. Sign in with your school email and everything is ready — no setup required, no cost.",
                  tags: ["Discussion Hub", "Resources", "All features"],
                },
              ].map((col, i) => (
                <React.Fragment key={`col-group-${i}`}>
                  <div
                    style={{
                      padding: "36px 32px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: col.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: col.color,
                      }}
                    >
                      {col.icon}
                    </div>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#fff",
                        lineHeight: 1.3,
                      }}
                    >
                      {col.title}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.7,
                        flex: 1,
                      }}
                    >
                      {col.desc}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "4px",
                      }}
                    >
                      {col.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "3px 10px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: 500,
                            background: "rgba(255,255,255,0.06)",
                            color: col.color,
                            border: `0.5px solid ${col.color}30`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {i < 2 && (
                    <div
                      key={`div-${i}`}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        width: "1px",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative z-10"
        style={{
          padding: "80px 48px",
          background: "#f5f4f0",
          borderTop: "0.5px solid rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#1a1a2e",
              letterSpacing: "-0.02em",
              marginBottom: "12px",
              lineHeight: 1.2,
            }}
          >
            Ready to take control of your student life?
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: 1.65,
              marginBottom: "28px",
            }}
          >
            Sign in with your CIIT school email and get started in seconds. No
            forms, no waiting — just your Google account.
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              background: "#1a1a2e",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              G
            </div>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
          <p
            style={{
              fontSize: "11px",
              color: "#bbb",
              marginTop: "14px",
            }}
          >
            Exclusively for @ciit.edu.ph accounts
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 flex items-center gap-5 px-12 py-7"
        style={{ background: "#0f1117" }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "rgba(79,142,247,0.3)" }}
          >
            SL
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Student Life Manager · CIIT
          </span>
        </div>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 · For CIIT students, by CIIT students · GE003-STS Final Project
        </span>
        <div className="flex gap-4">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <span
              key={l}
              className="text-xs cursor-pointer"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

//  Inline SVG icons
const ChecklistIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <polyline points="3 6 4 7 6 5" />
    <polyline points="3 12 4 13 6 11" />
    <polyline points="3 18 4 19 6 17" />
  </svg>
);
const WalletIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 12V22H4V12" />
    <path d="M22 7H2v5h20V7z" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const CalcIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="10" y2="18" />
    <line x1="14" y1="18" x2="16" y2="18" />
  </svg>
);
const CalendarIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ChatIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ClockIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const MapPinIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
