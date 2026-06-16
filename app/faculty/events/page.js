"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FacultyEventsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/faculty");
  }, [router]);

  return <div style={{ padding: "2rem", textAlign: "center" }}>Redirecting...</div>;
}
