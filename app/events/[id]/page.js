"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getRoleHomePath } from "@/lib/routes";
import { getStoredUser } from "@/lib/session";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function downloadCalendarFile(event) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const toIcsDate = (value) =>
    value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academic Events Hub//EN",
    "BEGIN:VEVENT",
    `UID:${event._id}@academicevents.local`,
    `DTSTAMP:${toIcsDate(start)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || "Academic Event"}`,
    `LOCATION:${event.venue || "TBA"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    if (!eventId) return;

    let isMounted = true;

    const loadEvent = async () => {
      try {
        const response = await fetchApi(`/events/${eventId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch event details.");
        }

        if (isMounted) {
          setEvent(data.event);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setStatus("error");
          setMessage(error.message);
        }
      }
    };

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleProtectedAction = async (endpoint, successMessage) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetchApi(endpoint, { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Request failed.");
      }

      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (status === "loading") {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading event...</div>;
  }

  if (status === "error" || !event) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2>Unable to load event</h2>
        <p>{message || "Event not found."}</p>
        <Link className="btn btn-primary" href="/">
          Back to home
        </Link>
      </div>
    );
  }

  const dashboardPath = user ? getRoleHomePath(user.role) : "/login";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "7rem 1.5rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className={`event-card-type type-${event.type}`} style={{ position: "static", marginBottom: 16 }}>
            {event.type}
          </div>
          <h1 style={{ marginBottom: 12 }}>{event.title}</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: 720 }}>{event.description}</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Link className="btn btn-ghost" href="/">
            Home
          </Link>
          <Link className="btn btn-secondary" href={dashboardPath}>
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: 32,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <div className="card"><strong>Date</strong><div>{formatDate(event.date)}</div></div>
        <div className="card"><strong>Time</strong><div>{event.time || "TBA"}</div></div>
        <div className="card"><strong>Venue</strong><div>{event.venue || "TBA"}</div></div>
        <div className="card"><strong>Department</strong><div>{event.department}</div></div>
      </div>

      {event.speaker ? (
        <div className="card" style={{ marginTop: 24 }}>
          <strong>Speaker</strong>
          <div>{event.speaker}</div>
        </div>
      ) : null}

      {event.tags?.length ? (
        <div className="card" style={{ marginTop: 24 }}>
          <strong>Tags</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {event.tags.map((tag) => (
              <span key={tag} className="filter-chip active">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
        <button
          className="btn btn-primary"
          onClick={() => handleProtectedAction(`/events/${eventId}/register`, "Successfully registered for this event.")}
        >
          Register
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleProtectedAction(`/users/bookmarks/${eventId}`, "Bookmark updated.")}
        >
          Bookmark
        </button>
        <button className="btn btn-ghost" onClick={() => downloadCalendarFile(event)}>
          Add to calendar
        </button>
      </div>

      {message ? (
        <div className="card" style={{ marginTop: 20, color: "var(--text-secondary)" }}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
