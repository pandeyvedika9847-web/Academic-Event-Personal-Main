"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyAdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return <div style={{ padding: "2rem", textAlign: "center" }}>Redirecting...</div>;
}
