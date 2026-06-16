"use client";
import RoleGate from "@/components/auth/RoleGate";
import Sidebar from "@/components/Sidebar";

export default function FacultyLayout({ children }) {
  return (
    <RoleGate role="faculty">
      <div className="dashboard-layout">
        <Sidebar role="faculty" />
        <main className="dashboard-main">{children}</main>
      </div>
    </RoleGate>
  );
}
