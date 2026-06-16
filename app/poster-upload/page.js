"use client";

import Link from "next/link";

export default function PosterUploadPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "6rem 1.5rem 3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: 12 }}>Poster Import</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
          Automated poster extraction is not enabled in this deployment yet. Use the structured event submission flow instead.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/login">
            Sign in to submit an event
          </Link>
          <Link className="btn btn-ghost" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
