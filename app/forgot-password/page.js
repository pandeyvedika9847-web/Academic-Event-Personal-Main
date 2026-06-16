"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async () => {
    if (!email.trim()) {
      setToast("⚠️ Please enter your email");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/forgotpassword", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setToast(`❌ ${data.message || "Something went wrong"}`);
        setTimeout(() => setToast(null), 3000);
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
          <h1>Reset Password</h1>
          <p>{success ? "Check your inbox!" : "Enter your email to receive a reset link"}</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✉️</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push("/login")} style={{ width: "100%", justifyContent: "center" }}>
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="e.g. user@bhu.ac.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleResetRequest()}
              />
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={handleResetRequest}
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Reset Link →"}
            </button>
            <button className="btn btn-ghost btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => router.push("/login")}>
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}
