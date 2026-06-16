"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentCalendarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calendar");
  }, [router]);

  return <div style={{ padding: "2rem", textAlign: "center" }}>Redirecting...</div>;
}
