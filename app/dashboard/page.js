"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath } from "@/lib/routes";
import { clearStoredSession, getStoredUser } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      clearStoredSession();
      router.replace("/login");
      return;
    }

    router.replace(getRoleHomePath(user.role));
  }, [router]);

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
      Redirecting...
    </div>
  );
}
