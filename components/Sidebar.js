"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { clearStoredSession } from "@/lib/session";

const ROLE_CONFIG = {
  student: {
    label: "Student",
    icon: "🎓",
    color: "#6366f1",
    links: [
      { href: "/student", label: "My Feed", icon: "📰" },
      { href: "/student/submit", label: "Create Event", icon: "➕" },
      { href: "/calendar", label: "Calendar", icon: "📅" },
      { href: "/student/profile", label: "My Profile", icon: "👤" },
    ],
  },
  faculty: {
    label: "Faculty",
    icon: "👨‍🏫",
    color: "#10b981",
    links: [
      { href: "/faculty", label: "Dashboard", icon: "📊" },
      { href: "/faculty/submit", label: "Create Event", icon: "➕" },
      { href: "/faculty/analytics", label: "Analytics", icon: "📈" },
      { href: "/calendar", label: "Calendar", icon: "📅" },
      { href: "/faculty/profile", label: "My Profile", icon: "👤" },
    ],
  },

  admin: {
    label: "Administrator",
    icon: "🛡️",
    color: "#f59e0b",
    links: [
      { href: "/admin", label: "Dashboard", icon: "📊" },
      { href: "/admin/users", label: "User Management", icon: "👥" },
    ],
  },
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const config = ROLE_CONFIG[role];
  
  const handleLogout = async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort logout; clear client session regardless.
    }

    clearStoredSession();
    router.replace("/login");
  };
  
  if (!config) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
        <div className="logo-icon">⚡</div>
        <span>Academic Events Hub <span style={{ color: "var(--accent-primary)" }}>(AEH)</span></span>
      </div>

      <div className="sidebar-role" style={{ borderColor: config.color + "33", background: config.color + "11" }}>
        <span style={{ fontSize: "1.3rem" }}>{config.icon}</span>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Logged in as</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{config.label}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {config.links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              style={isActive ? { borderLeftColor: config.color, color: config.color, background: config.color + "11" } : {}}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={handleLogout}>
          <span className="sidebar-link-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
