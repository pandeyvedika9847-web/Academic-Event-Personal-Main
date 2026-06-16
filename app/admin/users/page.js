"use client";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchApi("/users");
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading users...</div>;

  return (
    <>
      <div className="dashboard-header"><h1>User Management 👥</h1><p>Manage users and roles</p></div>
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <button className="btn btn-primary btn-sm" style={{ background: "#f59e0b", color: "#1a1a1a" }}>+ Add User</button>
        <div className="navbar-search" style={{ padding: "6px 14px" }}><span>🔍</span><input placeholder="Search users..." style={{ width: 200 }} /></div>
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                <td><span className="status-badge" style={{ background: u.role==="student"?"rgba(99,102,241,0.15)":u.role==="faculty"?"rgba(16,185,129,0.15)":"rgba(245,158,11,0.15)", color: u.role==="student"?"#6366f1":u.role==="faculty"?"#10b981":"#f59e0b" }}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{u.department}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                <td><div style={{ display: "flex", gap: 4 }}><button className="btn btn-ghost btn-sm">Edit</button><button className="btn btn-ghost btn-sm" style={{ color: "#f43f5e" }}>Remove</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>No users found.</div>}
      </div>
    </>
  );
}
