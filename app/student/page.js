"use client";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { getStoredToken } from "@/lib/session";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentDashboard() {
  const [userinterests, setUserinterests] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [registered, setRegistered] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState({ fullName: "Student" });
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);

  // Extract all unique tags from events dynamically
  const allTags = Array.from(new Set(events.flatMap(e => [e.department, ...(e.tags || []), ...(e.subjectTags || [])].filter(Boolean)))).map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const availableinterests = Array.from(new Set(allTags.filter(tag => !userinterests.map(i => i.toLowerCase()).includes(tag.toLowerCase()))));

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getStoredToken();
      if (!token) {
         setLoading(false);
         return;
      }
      try {
        // Fetch user profile
        const userRes = await fetchApi("/auth/me");
        const userData = await userRes.json();
        let currentUserId = null;
        
        if (userData.success) {
          setUser(userData.user);
          setUserinterests(userData.user.interests || []);
          setNotifications(userData.user.notifications?.sort((a,b) => new Date(b.date) - new Date(a.date)) || []);
          currentUserId = userData.user._id;
        }

        // Fetch events
        const eventsRes = await fetchApi("/events?limit=100");
        const eventsData = await eventsRes.json();
        
        if (eventsData.success) {
          setEvents(eventsData.events);
          
          if (currentUserId) {
            const regSet = new Set();
            eventsData.events.forEach(e => {
              if (e.registeredUsers?.includes(currentUserId)) {
                regSet.add(e._id);
              }
            });
            setRegistered(regSet);
          }
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleUpdateinterests = async (newinterests) => {
    setUserinterests(newinterests);
    const token = getStoredToken();
    if (!token) return;
    try {
      await fetchApi("/users/preferences", {
        method: "PATCH",
        body: JSON.stringify({ interests: newinterests })
      });
      setToast("✅ Profile updated! You'll receive updates for these topics.");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {}
  };

  const toggleBookmark = (id) => {
    setBookmarks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  
  const handleRegister = async (id) => {
    const token = getStoredToken();
    if (!token) return;
    
    try {
      const res = await fetchApi(`/events/${id}/register`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (data.success) {
        setRegistered(prev => new Set(prev).add(id));
        setToast("✅ Successfully registered!");
      } else {
        setToast("⚠️ " + data.message);
      }
    } catch (e) {
      setToast("❌ Failed to register.");
    }
    setTimeout(() => setToast(null), 3000);
    setSelectedEvent(null);
  };

  const recommended = events.filter(e => {
    const evTags = [e.department, ...(e.tags || []), ...(e.subjectTags || [])].map(t => t.toLowerCase());
    return userinterests.some(ui => evTags.includes(ui.toLowerCase()));
  });

  if (loading) {
     return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "var(--text-secondary)", fontSize: "1.2rem", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Loading Dashboard...</div>;
  }

  return (
    <>
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Welcome back, {user.fullName?.split(" ")[0] || "Student"}! 👋</h1>
          <p>Here's what's happening on campus today</p>
        </div>
        <div style={{ position: "relative" }}>
          <button 
            className="btn btn-ghost" 
            style={{ fontSize: "1.5rem", position: "relative", padding: "8px 12px" }}
            onClick={() => setShowNotif(!showNotif)}
          >
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <div style={{ position: "absolute", top: 4, right: 8, background: "#f43f5e", color: "white", borderRadius: "50%", width: 20, height: 20, fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {notifications.filter(n => !n.read).length}
              </div>
            )}
          </button>
          {showNotif && (
            <div style={{ position: "absolute", top: "100%", right: 0, width: 320, background: "var(--bg-card)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 100, padding: 16, marginTop: 8 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Updates & Alerts</h3>
              {notifications.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>No new updates.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
                  {notifications.map((n, i) => (
                    <div key={i} style={{ fontSize: "0.85rem", background: "var(--bg-secondary)", padding: 12, borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: 4 }}>{n.type === "new_event" ? "🎉 New Event Match" : "🔔 Update"}</div>
                      <div style={{ color: "var(--text-primary)" }}>{n.message}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 8 }}>{fmtDate(n.date)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { value: registered.size, label: "Events Registered", color: "#6366f1", icon: "🎫" },
          { value: bookmarks.size, label: "Bookmarked", color: "#f59e0b", icon: "⭐" },
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

      {/* My interests */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "0.85rem", color: "white", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>Your interests (Profile)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>Select the topics you care about. We will automatically notify you when matching events are published!</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {userinterests.map(i => (
            <span key={i} className="filter-chip active" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {i}
              <button 
                onClick={() => handleUpdateinterests(userinterests.filter(ui => ui !== i))}
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontSize: "0.8rem", opacity: 0.7 }}
                title="Remove interest"
              >
                ×
              </button>
            </span>
          ))}
          {availableinterests.length > 0 && (
            <select 
              className="filter-chip" 
              style={{ borderStyle: "dashed", background: "transparent", cursor: "pointer", outline: "none", paddingRight: "8px" }}
              onChange={(e) => {
                if(e.target.value) {
                  handleUpdateinterests([...userinterests, e.target.value]);
                  e.target.value = "";
                }
              }}
            >
              <option value="" style={{ color: "#000" }}>+ Add more</option>
              {availableinterests.map(tag => (
                <option key={tag} value={tag} style={{ color: "#000" }}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Recommended Events */}
      <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16, color: "white", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>📰 Recommended For You</h3>
      <div className="events-grid" style={{ marginBottom: 40 }}>
        {recommended.slice(0, 4).map(e => (
          <div key={e._id} className="event-card" onClick={() => setSelectedEvent(e)}>
            <div className="event-card-banner" style={{ background: `linear-gradient(135deg, ${e.color || '#10b981'}22, ${e.color || '#10b981'}08)`, height: 120 }}>
              <span className={`event-card-type type-${e.type}`}>{e.type}</span>
              <button className={`event-card-bookmark ${bookmarks.has(e._id) ? "active" : ""}`}
                onClick={ev => { ev.stopPropagation(); toggleBookmark(e._id); }}>
                {bookmarks.has(e._id) ? "★" : "☆"}
              </button>
            </div>
            <div className="event-card-body">
              <div className="event-card-date">📅 {fmtDate(e.date)}</div>
              <h3 className="event-card-title" style={{ fontSize: "1rem" }}>{e.title}</h3>
              <div className="event-card-meta">
                <span className="event-card-dept">🏫 {e.department}</span>
                {registered.has(e._id) ? (
                  <span className="status-badge status-approved">Registered</span>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>RSVP →</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {recommended.length === 0 && <p style={{ color: "var(--text-muted)", padding: 20 }}>No recommendations yet. Add some interests above!</p>}
      </div>

      {/* Upcoming Registered Events */}
      <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16, color: "white", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>🎫 Your Upcoming Events</h3>
      <div className="activity-list" style={{ marginBottom: 40 }}>
        {events.filter(e => registered.has(e._id)).map(e => (
          <div key={e._id} className="activity-item">
            <div className="activity-dot" style={{ background: e.color || '#10b981' }} />
            <div className="activity-content">
              <div className="activity-title">{e.title}</div>
              <div className="activity-meta">{fmtDate(e.date)} · {e.venue} · {e.time || "TBA"}</div>
            </div>
            <span className={`event-card-type type-${e.type}`} style={{ position: "static" }}>{e.type}</span>
          </div>
        ))}
        {Array.from(registered).length === 0 && <p style={{ color: "var(--text-muted)", padding: 20 }}>No registered events yet. Browse and RSVP!</p>}
      </div>

      {/* All Events Feed */}
      <h3 style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontSize: "1rem", marginBottom: 16, color: "white", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)" }}>🔥 All Campus Events</h3>
      <div className="activity-list">
        {events.slice(0, 8).map(e => (
          <div key={e._id} className="activity-item" onClick={() => setSelectedEvent(e)}>
            <div className="activity-dot" style={{ background: e.color || '#6366f1' }} />
            <div className="activity-content">
              <div className="activity-title">{e.title}</div>
              <div className="activity-meta">{fmtDate(e.date)} · {e.department}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {registered.has(e._id) && <span className="status-badge status-approved">Registered</span>}
              <span className={`event-card-type type-${e.type}`} style={{ position: "static" }}>{e.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={ev => ev.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem" }}>{selectedEvent.title}</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <span className={`event-card-type type-${selectedEvent.type}`} style={{ position: "static", marginBottom: 16, display: "inline-block" }}>{selectedEvent.type}</span>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.7 }}>{selectedEvent.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[["📅 Date", fmtDate(selectedEvent.date)], ["🕐 Time", selectedEvent.time || 'TBA'], ["📍 Venue", selectedEvent.venue], ["🎤 Speaker", selectedEvent.speaker || 'TBA']].map(([l,v]) => (
                  <div key={l} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4, fontFamily: "Plus Jakarta Sans,sans-serif" }}>{l}</div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "Plus Jakarta Sans,sans-serif" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {registered.has(selectedEvent._id) ? (
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} disabled>✅ Already Registered</button>
                ) : (
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => handleRegister(selectedEvent._id)}>Register Now</button>
                )}
                <button className="btn btn-secondary btn-lg" onClick={() => toggleBookmark(selectedEvent._id)}>
                  {bookmarks.has(selectedEvent._id) ? "★ Bookmarked" : "☆ Bookmark"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </>
  );
}
