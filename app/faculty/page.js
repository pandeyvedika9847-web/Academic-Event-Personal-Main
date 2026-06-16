"use client";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { getStoredToken } from "@/lib/session";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function FacultyDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [facultyInterests, setFacultyInterests] = useState(["Machine Learning", "AI/ML"]);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ title: "", description: "", type: "seminar", department: "", date: "", endDate: "", time: "", venue: "", speaker: "", tags: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // 1. Fetch User
        const userRes = await fetchApi("/auth/me");
        const userData = await userRes.json();
        if (userData.success) {
          setUser(userData.user);
          // Auto-select department in form
          setForm(f => ({ ...f, department: userData.user.department || "" }));
        }

        // 2. Fetch Events (status=all to see pending)
        const eventsRes = await fetchApi("/events?limit=500&status=all");
        const eventsData = await eventsRes.json();
        if (eventsData.success) {
          setEvents(eventsData.events);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const allTags = Array.from(new Set(events.flatMap(e => [e.department, ...(e.tags || [])].filter(Boolean)))).map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const availableInterests = allTags.filter(tag => !facultyInterests.map(i => i.toLowerCase()).includes(tag.toLowerCase()));
  const DEPARTMENTS = ["All Departments", ...Array.from(new Set(events.map(e => e.department).filter(Boolean)))];
  
  const EVENT_TYPES = [
    { value: "seminar", label: "Seminar" },
    { value: "workshop", label: "Workshop" },
    { value: "conference", label: "Conference" },
    { value: "lecture", label: "Lecture" },
    { value: "training", label: "Training" }
  ];

  const MY_EVENTS = events.filter(e => e.createdBy?._id === user?._id || e.createdBy === user?._id);

  const totalRegs = MY_EVENTS.reduce((s, e) => s + (e.registrations || 0), 0);
  const totalViews = MY_EVENTS.reduce((s, e) => s + Math.floor((e.capacity || 200) * 1.5), 0); // Simulated views

  const handleCreateEvent = async () => {
    // 1. Strict Validation
    if (!form.title || form.title.length < 5) return showToast("⚠️ Title must be at least 5 characters.");
    if (!form.description || form.description.length < 10) return showToast("⚠️ Description must be at least 10 characters.");
    if (!form.date) return showToast("⚠️ Please select a start date.");
    if (new Date(form.date) < new Date(new Date().setHours(0,0,0,0))) return showToast("⚠️ Event date cannot be in the past.");
    if (!form.venue) return showToast("⚠️ Please specify a venue.");
    if (!form.department) return showToast("⚠️ Please select a department.");
    
    try {
      const token = getStoredToken();
      const res = await fetchApi("/events", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          department: form.department,
          date: form.date,
          endDate: form.endDate,
          time: form.time,
          venue: form.venue,
          speaker: form.speaker,
          tags: form.tags ? [form.tags] : [],
          capacity: 100 // default
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // Handle explicit backend validation errors
        throw new Error(data.message || "Failed to create event");
      }
      
      // Successfully created
      setForm({ title: "", description: "", type: "seminar", department: user?.department || "", date: "", endDate: "", time: "", venue: "", speaker: "", tags: "" });
      setEvents(prev => [...prev, data.event]);
      showToast("✅ Event created successfully!"); 
      setTimeout(() => setTab("my events"), 1000);
      
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)", fontSize: "1.2rem", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Loading Dashboard...</div>;
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>Welcome back, {user ? user.fullName?.split(" ")[0] : "Faculty"}! 👨‍🏫</h1>
        <p>Manage your events and track engagement</p>
      </div>

      <div className="tabs" style={{ marginBottom: 28 }}>
        {["dashboard", "create", "my events"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <div className="stats-grid">
            {[
              { value: MY_EVENTS.length, label: "My Events", color: "#10b981", icon: "📋" },
              { value: totalRegs, label: "Total Registrations", color: "#6366f1", icon: "🎫" },
              { value: totalViews.toLocaleString(), label: "Total Views", color: "#f59e0b", icon: "👁️" },
              { value: "4.8", label: "Avg Rating", color: "#8b5cf6", icon: "⭐" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                  <div style={{ fontSize: "2rem", opacity: 0.5 }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16 }}>🎯 Your Interests</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {facultyInterests.map(i => (
                <span key={i} className="filter-chip active" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {i}
                  <button 
                    onClick={() => setFacultyInterests(facultyInterests.filter(ui => ui !== i))}
                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: "0.8rem", opacity: 0.7 }}
                    title="Remove interest"
                  >
                    ×
                  </button>
                </span>
              ))}
              {availableInterests.length > 0 && (
                <select 
                  className="filter-chip" 
                  style={{ borderStyle: "dashed", background: "transparent", cursor: "pointer", outline: "none", paddingRight: "8px" }}
                  onChange={(e) => {
                    if(e.target.value) {
                      setFacultyInterests([...facultyInterests, e.target.value]);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" style={{ color: "#000" }}>+ Add more</option>
                  {availableInterests.map(tag => (
                    <option key={tag} value={tag} style={{ color: "#000" }}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16 }}>📋 My Events Performance</h3>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 32 }}>
            <table className="data-table">
              <thead><tr><th>Event</th><th>Date</th><th>Views</th><th>Registrations</th><th>Fill Rate</th><th>Status</th></tr></thead>
              <tbody>
                {MY_EVENTS.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.title.length > 45 ? e.title.slice(0, 45) + "…" : e.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{e.department}</div>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{fmtDate(e.date)}</td>
                    <td style={{ fontFamily: "Plus Jakarta Sans,sans-serif" }}>{Math.floor((e.capacity || 200) * 1.5)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${((e.registrations || 0)/(e.capacity || 100))*100}%`, background: e.color || '#6366f1' }} />
                        </div>
                        <span style={{ fontSize: "0.8rem" }}>{e.registrations || 0}/{e.capacity || 100}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{Math.round(((e.registrations || 0)/(e.capacity || 100))*100)}%</td>
                    <td>
                      <span className={`status-badge ${e.status === 'approved' ? 'status-approved' : e.status === 'pending' ? 'status-pending' : 'status-rejected'}`}>
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {MY_EVENTS.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>You haven't created any events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "create" && (
        <div className="form-container" style={{ maxWidth: "100%" }}>
          <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1.1rem", marginBottom: 24 }}>Create New Event</h3>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input className="form-input" placeholder="e.g. Workshop on Machine Learning" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" placeholder="Describe the event..." value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={form.department} onChange={e => set("department", e.target.value)}>
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.filter(d => d !== "All Departments").length > 0 ? (
                  DEPARTMENTS.filter(d => d !== "All Departments").map(d => <option key={d}>{d}</option>)
                ) : (
                  <option value={user?.department || "General"}>{user?.department || "General"}</option>
                )}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" placeholder="e.g. 10:00 AM - 04:00 PM" value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Venue *</label>
              <input className="form-input" placeholder="e.g. Science Faculty Hall" value={form.venue} onChange={e => set("venue", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Speaker(s)</label>
            <input className="form-input" placeholder="e.g. Prof. Arun Kumar" value={form.speaker} onChange={e => set("speaker", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Primary Topic / Domain</label>
            <select className="form-select" value={form.tags} onChange={e => set("tags", e.target.value)}>
              <option value="" disabled>Select a domain...</option>
              {["Artificial Intelligence", "Machine Learning", "Data Science", "Cybersecurity", "Cloud Computing", "Quantum Computing", "Blockchain", "Internet of Things (IoT)", "Robotics", "Software Engineering", "Mathematics", "Physics", "General Science"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", background: "#10b981" }}
            onClick={handleCreateEvent}>
            Create & Publish Event →
          </button>
        </div>
      )}

      {tab === "my events" && (
        <>
          <div className="events-grid">
            {MY_EVENTS.map(e => (
              <div key={e._id} className="event-card">
                <div className="event-card-banner" style={{ background: `linear-gradient(135deg, ${e.color || '#10b981'}22, ${e.color || '#10b981'}08)`, height: 100 }}>
                  <span className={`event-card-type type-${e.type}`}>{e.type}</span>
                </div>
                <div className="event-card-body">
                  <div className="event-card-date">📅 {fmtDate(e.date)}</div>
                  <h3 className="event-card-title" style={{ fontSize: "1rem" }}>{e.title}</h3>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>👁️ {Math.floor((e.capacity || 200) * 1.5)} views</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>🎫 {e.registrations || 0} registered</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>✏️ Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--accent-rose)" }}>Cancel</button>
                  </div>
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Status: <strong className={e.status === 'approved' ? 'text-green-500' : e.status === 'pending' ? 'text-yellow-500' : 'text-red-500'} style={{ color: e.status === 'approved' ? '#10b981' : e.status === 'pending' ? '#f59e0b' : '#f43f5e' }}>{e.status.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {MY_EVENTS.length === 0 && (
              <p style={{ color: "var(--text-muted)", padding: 20 }}>No events published yet.</p>
            )}
          </div>
        </>
      )}

      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </>
  );
}
