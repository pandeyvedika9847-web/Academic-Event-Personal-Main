"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath } from "@/lib/routes";
import { clearStoredSession, getStoredUser } from "@/lib/session";

export default function RoleGate({ role, children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      clearStoredSession();
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      router.replace(getRoleHomePath(user.role));
      return;
    }

    setStatus("ready");
  }, [role, router]);

  if (status !== "ready") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
        }}
      >
        Loading...
      </div>
    );
  }

  return children;
}
