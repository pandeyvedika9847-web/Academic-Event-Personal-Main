"use client";
import RoleGate from "@/components/auth/RoleGate";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <RoleGate role="admin">
      <div className="dashboard-layout">
        <Sidebar role="admin" />
        <main className="dashboard-main">{children}</main>
      </div>
    </RoleGate>
  );
}
