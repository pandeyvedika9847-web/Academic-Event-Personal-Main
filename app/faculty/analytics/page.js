"use client";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export default function FacultyAnalytics() {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await fetchApi("/analytics/faculty");
        const data = await res.json();
        if (data.success) {
          setMyEvents(data.events);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading analytics...</div>;

  const totalRegs = myEvents.reduce((s, e) => s + e.registrations, 0);
  const totalViews = myEvents.reduce((s, e) => s + (e.views || 0), 0);
  const totalCapacity = myEvents.reduce((s, e) => s + (e.capacity || 1), 0);
  const avgFillRate = myEvents.length === 0 || totalCapacity === 0 ? 0 : Math.round((totalRegs / totalCapacity) * 100);

  return (
    <>
      <div className="dashboard-header">
        <h1>Analytics 📈</h1>
        <p>Track performance of your events</p>
      </div>
      <div className="stats-grid">
        {[
          { value: myEvents.length, label: "Events Created", color: "#10b981" },
          { value: totalRegs, label: "Total Registrations", color: "#6366f1" },
          { value: totalViews.toLocaleString(), label: "Total Views", color: "#f59e0b" },
          { value: `${avgFillRate}%`, label: "Avg Fill Rate", color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontFamily: "Inter,sans-serif", fontSize: "1rem", marginBottom: 16 }}>Event Breakdown</h3>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
        {myEvents.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No events to display.</p> : myEvents.map(e => (
          <div key={e._id} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", fontFamily: "Inter,sans-serif" }}>{e.title.slice(0, 50)}{e.title.length > 50 ? "…" : ""}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "Inter,sans-serif" }}>{e.registrations}/{e.capacity || 200} registered</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((e.registrations / (e.capacity || 200)) * 100, 100)}%`, background: e.color || "#6366f1" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Inter,sans-serif" }}>👁️ {e.views || 0} views</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Inter,sans-serif" }}>🖱️ {e.clicks || 0} clicks</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Inter,sans-serif" }}>📊 {e.views ? ((e.clicks / e.views) * 100).toFixed(1) : 0}% CTR</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
