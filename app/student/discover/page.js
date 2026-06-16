"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentDiscoverPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student");
  }, [router]);

  return <div style={{ padding: "2rem", textAlign: "center" }}>Redirecting...</div>;
}
