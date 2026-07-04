"use client";

export default function ResourcesPage() {
  const groups = [
    {
      label: "CIIT Portals",
      items: [
        {
          title: "CIIT EduSuite (New)",
          description: "The updated student portal for grades, schedules, and enrollment",
          href: "https://ciit.edusuite.asia/ui/",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          ),
        },
        {
          title: "CIIT EduSuite (Old)",
          description: "Legacy student portal. Use if the new one has issues",
          href: "https://ciit.edusuite.asia",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          ),
        },
        {
          title: "CIIT Student Dashboard",
          description: "Official CIIT student dashboard for your academic records",
          href: "https://student.ciit.edu.ph/",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Learning & Academics",
      items: [
        {
          title: "Canvas LMS",
          description: "Course materials, assignments, and grades on Canvas",
          href: "https://ciit.instructure.com/",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          ),
        },
        {
          title: "roadmap.sh",
          description: "Developer roadmaps, guides, and learning paths for every tech track",
          href: "https://roadmap.sh/",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 8 12 12 14 14" />
            </svg>
          ),
        },
        {
          title: "Student Outputs",
          description: "CIIT Tech Department showcase of student project outputs",
          href: "https://studentsoutput.ciit.edu.ph/",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          ),
        },
      ],
    },
    {
      label: "Official Sites",
      items: [
        {
          title: "CIIT Official Website",
          description: "News, programs, admissions, and announcements from CIIT",
          href: "https://www.ciit.edu.ph",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          Student Resources
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Quick links to CIIT portals, learning platforms, and official sites.
        </p>
      </div>

      {/* Link groups */}
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "#999", letterSpacing: "0.06em" }}
          >
            {group.label}
          </p>

          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
                style={{
                  background: "#fff",
                  border: "0.5px solid #ebebeb",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.border =
                    "0.5px solid rgba(79,142,247,0.3)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.border =
                    "0.5px solid #ebebeb")
                }
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-xl"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(79,142,247,0.08)",
                    color: "#4f8ef7",
                  }}
                >
                  {item.icon}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#1a1a2e" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#999", lineHeight: 1.5 }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 2 2h3" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
