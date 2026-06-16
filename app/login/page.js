"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getRoleHomePath } from "@/lib/routes";
import { setStoredSession } from "@/lib/session";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const ROLES = [
  { id: "student", icon: "🎓", label: "Student & Scholar", color: "#6366f1" },
  { id: "faculty", icon: "👨‍🏫", label: "Faculty", color: "#10b981" },
  { id: "admin", icon: "🛡️", label: "Admin", color: "#f59e0b" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedRole = ROLES.find(r => r.id === role);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoogleAuthenticated = (data) => {
    setStoredSession(data.token, data.user);
    showToast("Signed in with Google. Redirecting...");
    setTimeout(() => router.push(getRoleHomePath(data.user.role)), 600);
  };

  const handleGoogleProfileRequired = (profile) => {
    if (profile && typeof window !== "undefined") {
      window.sessionStorage.setItem("googleSignupProfile", JSON.stringify(profile));
    }
    router.push("/signup/google");
  };

  const handleLogin = async () => {
    if (!email.trim()) { showToast("Please enter your email"); return; }
    if (!password.trim()) { showToast("Please enter your password"); return; }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role })
      });
      const data = await res.json();
      
      if (data.success) {
        setStoredSession(data.token, data.user);
        showToast("Login successful. Redirecting...");
        setTimeout(() => router.push(getRoleHomePath(data.user.role)), 600);
      } else {
        showToast(data.message || "Invalid email or password");
      }
    } catch (err) {
      showToast("Server error. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <div className="auth-container fade-in">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <div className="logo-icon">⚡</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.5rem", fontWeight: 700, textTransform: "uppercase" }}>
              Academic Events <span style={{ color: "var(--accent-primary)" }}>Hub</span>
            </span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your AEH account</p>
        </div>

        {/* Role Selector */}
        <div className="auth-role-selector">
          {ROLES.map(r => (
            <button
              key={r.id}
              className={`auth-role-chip ${role === r.id ? "active" : ""}`}
              onClick={() => setRole(r.id)}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
        <GoogleSignInButton
          disabled={loading}
          onAuthenticated={handleGoogleAuthenticated}
          onProfileRequired={handleGoogleProfileRequired}
          onError={showToast}
        />

        <div className="auth-divider">or use password</div>

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">
              {role === "student" ? "University Email / Roll Number" : role === "admin" ? "Admin Email" : "Institutional Email"}
            </label>
            <input
              className="form-input"
              type="email"
              placeholder={role === "student" ? "e.g. rahul.21cs@iitbhu.ac.in" : role === "faculty" ? "e.g. priya.cse@iitbhu.ac.in" : role === "scholar" ? "e.g. ankit.phd@iitbhu.ac.in" : "e.g. admin@iitbhu.ac.in"}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <a onClick={() => router.push("/forgot-password")} style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontFamily: "Plus Jakarta Sans,sans-serif", cursor: "pointer" }}>Forgot password?</a>
            </div>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ marginTop: 8 }}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : `Sign in as ${selectedRole.label} →`}
          </button>
        </div>

        <div className="auth-footer">
          <p>Don&apos;t have an account? <a onClick={() => router.push("/signup")} style={{ color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600 }}>Sign up</a></p>
        </div>
      </div>

      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}
