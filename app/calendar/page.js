"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getRoleHomePath } from "@/lib/routes";
import { getStoredUser } from "@/lib/session";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMonth(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const response = await fetchApi("/events?limit=200");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load calendar events.");
        }

        if (!isMounted) return;

        setEvents(data.events || []);
        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;
        setMessage(error.message);
        setStatus("error");
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstWeekDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const calendarDays = [];
  for (let index = 0; index < firstWeekDay; index += 1) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  const eventsByDate = new Map();
  for (const event of events) {
    const date = new Date(event.date);
    const key = date.toISOString().slice(0, 10);
    const list = eventsByDate.get(key) || [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const monthEvents = events.filter((event) => {
    const date = new Date(event.date);
    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  });

  const dashboardPath = user ? getRoleHomePath(user.role) : "/login";

  if (status === "loading") {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading calendar...</div>;
  }

  if (status === "error") {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2>Unable to load calendar</h2>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "6rem 1.5rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1>Event Calendar</h1>
          <p style={{ color: "var(--text-secondary)" }}>Browse upcoming academic events by date.</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-ghost" href="/">
            Home
          </Link>
          <Link className="btn btn-secondary" href={dashboardPath}>
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            Previous
          </button>
          <strong>{formatMonth(currentDate)}</strong>
          <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            Next
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {WEEK_DAYS.map((day) => (
          <div key={day} style={{ padding: 12, background: "var(--surface)", fontWeight: 600 }}>
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} style={{ minHeight: 120, borderTop: "1px solid var(--border)" }} />;
          }

          const key = day.toISOString().slice(0, 10);
          const dayEvents = eventsByDate.get(key) || [];

          return (
            <div key={key} style={{ minHeight: 120, padding: 12, borderTop: "1px solid var(--border)", borderLeft: index % 7 === 0 ? "none" : "1px solid var(--border)" }}>
              <div style={{ fontWeight: sameDay(day, new Date()) ? 700 : 500, marginBottom: 8 }}>{day.getDate()}</div>
              <div style={{ display: "grid", gap: 6 }}>
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event._id}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedEvent(event)}
                    style={{ justifyContent: "flex-start", padding: 0, textAlign: "left" }}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Events This Month</h2>
        {monthEvents.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No events scheduled for this month.</p>
        ) : (
          <div className="activity-list">
            {monthEvents.map((event) => (
              <div key={event._id} className="activity-item">
                <div className="activity-content">
                  <div className="activity-title">{event.title}</div>
                  <div className="activity-meta">
                    {new Date(event.date).toLocaleDateString()} · {event.venue || "TBA"}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/events/${event._id}`)}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>{selectedEvent.title}</h3>
          <p style={{ color: "var(--text-secondary)" }}>{selectedEvent.description}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => router.push(`/events/${selectedEvent._id}`)}>
              Open Event
            </button>
            <button className="btn btn-ghost" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
