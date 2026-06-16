"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function ResetPasswordPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setToast("⚠️ Password must be at least 6 characters");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (password !== confirmPassword) {
      setToast("⚠️ Passwords do not match");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi(`/auth/resetpassword/${resolvedParams.token}`, {
        method: "PUT",
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setToast(`❌ ${data.message || "Invalid or expired token"}`);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      setToast("❌ Server error. Please try again later.");
      setTimeout(() => setToast(null), 3000);
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
          <h1>Create New Password</h1>
          <p>Please enter your new secure password</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
            <p style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: 600 }}>Password Reset Successfully!</p>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>Redirecting you to login...</p>
          </div>
        ) : (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                className="form-input"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                className="form-input"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleReset()}
              />
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password →"}
            </button>
          </div>
        )}
      </div>
      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}
