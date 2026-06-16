"use client";
import RoleGate from "@/components/auth/RoleGate";
import Sidebar from "@/components/Sidebar";

export default function StudentLayout({ children }) {
  return (
    <RoleGate role="student">
      <div className="dashboard-layout">
        <Sidebar role="student" />
        <main className="dashboard-main">{children}</main>
      </div>
    </RoleGate>
  );
}
