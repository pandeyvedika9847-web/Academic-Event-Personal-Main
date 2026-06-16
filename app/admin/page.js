"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { getStoredToken } from "@/lib/session";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [featured, setFeatured] = useState(new Set());

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const userRes = await fetchApi("/auth/me");
        const userData = await userRes.json();
        if (userData.success) setCurrentUser(userData.user);

        // Fetch all events (including pending & rejected)
        const eventsRes = await fetchApi("/events?limit=500&status=all");
        const eventsData = await eventsRes.json();
        
        if (eventsData.success) {
          setEvents(eventsData.events);
          // Set initial featured set
          const fSet = new Set();
          eventsData.events.forEach(e => {
            if (e.featured) fSet.add(e._id);
          });
          setFeatured(fSet);
        }

        // Fetch all users
        const usersRes = await fetchApi("/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.users);
        }
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const pending = events.filter(e => e.status === "pending");
  const DEPARTMENTS = Array.from(new Set(events.map(e => e.department).filter(Boolean)));
  
  const totalRegs = events.reduce((s, e) => s + (e.registrations || 0), 0);

  const updateEventStatus = async (id, status) => {
    try {
      const token = getStoredToken();
      const res = await fetchApi(`/events/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(prev => prev.map(e => e._id === id ? { ...e, status } : e));
        showToast(status === "approved" ? "✅ Event approved and published!" : "❌ Event rejected");
      } else {
        showToast("⚠️ " + data.message);
      }
    } catch (err) {
      showToast("❌ Failed to update status.");
    }
  };

  const toggleFeatured = async (id) => {
    try {
      const token = getStoredToken();
      const res = await fetchApi(`/events/${id}/featured`, {
        method: "PUT"
      });
      if (res.ok) {
        setFeatured(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        showToast("⭐ Featured status updated");
      }
    } catch (e) {
      showToast("❌ Failed to update featured status.");
    }
  };

  if (loading) {
     return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)", fontSize: "1.2rem", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Loading Admin Console...</div>;
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser ? currentUser.fullName?.split(" ")[0] : "Admin"}! 🛡️</h1>
        <p>University-wide event management and analytics</p>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        {["overview", "approvals", "all events", "users", "featured"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "approvals" && pending.length > 0 && (
              <span style={{ marginLeft: 6, background: "var(--accent-rose)", color: "white", borderRadius: 50, padding: "1px 7px", fontSize: "0.7rem" }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="stats-grid">
            {[
              { value: events.length, label: "Total Events", color: "#f59e0b", icon: "📋", change: "+12%" },
              { value: totalRegs.toLocaleString(), label: "Total Registrations", color: "#10b981", icon: "🎫", change: "+28%" },
              { value: pending.length, label: "Pending Approvals", color: "#f43f5e", icon: "⏳", change: "" },
              { value: users.length, label: "Active Users", color: "#6366f1", icon: "👥", change: "+15%" },
              { value: DEPARTMENTS.length, label: "Departments", color: "#8b5cf6", icon: "🏛️", change: "" },
              { value: "94%", label: "Approval Rate", color: "#06b6d4", icon: "✅", change: "+3%" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    {s.change && <div className="stat-change positive">{s.change} vs last month</div>}
                  </div>
                  <div style={{ fontSize: "2rem", opacity: 0.5 }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16 }}>📊 Events by Type</h3>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                {[
                  { type: "Conference", count: events.filter(e=>e.type==="conference").length, color: "#f43f5e" },
                  { type: "Workshop", count: events.filter(e=>e.type==="workshop").length, color: "#f59e0b" },
                  { type: "Seminar", count: events.filter(e=>e.type==="seminar").length, color: "#6366f1" },
                  { type: "Lecture", count: events.filter(e=>e.type==="lecture").length, color: "#10b981" },
                  { type: "Training", count: events.filter(e=>e.type==="training").length, color: "#06b6d4" },
                ].map(t => (
                  <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: "0.85rem", width: 80, fontFamily: "Plus Jakarta Sans,sans-serif", color: "var(--text-secondary)" }}>{t.type}</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${events.length > 0 ? (t.count / events.length) * 100 : 0}%`, background: t.color }} />
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "Plus Jakarta Sans,sans-serif", width: 20 }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16 }}>🔔 Recent Activity</h3>
              <div className="activity-list">
                {[
                  { text: "Dr. Vikash Gupta submitted 'Blockchain Workshop'", time: "2 hours ago", color: "#f59e0b" },
                  { text: "Quantum Computing Conference got 50 new registrations", time: "5 hours ago", color: "#10b981" },
                  { text: "Prof. Shrinivasa submitted 'Sanskrit Pedagogy Seminar'", time: "1 day ago", color: "#6366f1" },
                  { text: "Smart Campus Hackathon featured on homepage", time: "2 days ago", color: "#8b5cf6" },
                ].map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: a.color }} />
                    <div className="activity-content">
                      <div className="activity-title">{a.text}</div>
                      <div className="activity-meta">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "approvals" && (
        <>
          <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16 }}>⏳ Pending Approvals ({pending.length})</h3>
          {pending.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
              <p>All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="activity-list">
              {pending.map(e => (
                <div key={e._id} className="activity-item" style={{ flexWrap: "wrap" }}>
                  <div className="activity-dot" style={{ background: "#f59e0b" }} />
                  <div className="activity-content" style={{ flex: 1 }}>
                    <div className="activity-title">{e.title}</div>
                    <div className="activity-meta">Submitted by {e.createdBy?.fullName || "Faculty"} · {e.department} · {fmtDate(e.date)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`event-card-type type-${e.type}`} style={{ position: "static" }}>{e.type}</span>
                    <button className="btn btn-primary btn-sm" style={{ background: "#10b981" }} onClick={() => updateEventStatus(e._id, "approved")}>✅ Approve</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#f43f5e" }} onClick={() => updateEventStatus(e._id, "rejected")}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "all events" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Registrations</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.title.length > 40 ? e.title.slice(0, 40) + "…" : e.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{e.department}</div>
                  </td>
                  <td><span className={`event-card-type type-${e.type}`} style={{ position: "static" }}>{e.type}</span></td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{fmtDate(e.date)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className="progress-fill" style={{ width: `${((e.registrations||0)/(e.capacity||100))*100}%`, background: e.color || '#10b981' }} />
                      </div>
                      <span style={{ fontSize: "0.8rem" }}>{e.registrations||0}/{e.capacity||100}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${e.status === 'approved' ? 'status-approved' : e.status === 'pending' ? 'status-pending' : 'status-rejected'}`}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "#f43f5e" }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "users" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td>
                    <span className="status-badge" style={{
                      background: u.role === "student" ? "rgba(99,102,241,0.15)" : u.role === "faculty" ? "rgba(16,185,129,0.15)" : "rgba(139,92,246,0.15)",
                      color: u.role === "student" ? "#6366f1" : u.role === "faculty" ? "#10b981" : "#8b5cf6"
                    }}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{u.department || "N/A"}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "#f43f5e" }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "featured" && (
        <>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Select events to feature on the homepage. Featured events get maximum visibility.</p>
          <div className="activity-list">
            {events.filter(e => e.status === "approved").map(e => (
              <div key={e._id} className="activity-item">
                <div className="activity-dot" style={{ background: e.color || '#8b5cf6' }} />
                <div className="activity-content">
                  <div className="activity-title">{e.title}</div>
                  <div className="activity-meta">{e.department} · {fmtDate(e.date)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`event-card-type type-${e.type}`} style={{ position: "static" }}>{e.type}</span>
                  <button className={`btn ${featured.has(e._id) ? "btn-primary" : "btn-secondary"} btn-sm`}
                    style={featured.has(e._id) ? { background: "#f59e0b", color: "#1a1a1a" } : {}}
                    onClick={() => toggleFeatured(e._id)}>
                    {featured.has(e._id) ? "⭐ Featured" : "☆ Feature"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </>
  );
}
