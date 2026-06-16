"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { clearStoredSession, updateStoredUser } from "@/lib/session";

export default function FacultyProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    designation: "",
    department: "",
    facultyId: "",
    researchDomain: "",
    email: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetchApi("/auth/me");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load profile.");
        }

        if (!isMounted) return;

        setForm({
          fullName: data.user.fullName || "",
          designation: data.user.designation || "",
          department: data.user.department || "",
          facultyId: data.user.facultyId || "",
          researchDomain: data.user.researchDomain || "",
          email: data.user.email || "",
        });
        setStatus("ready");
      } catch {
        clearStoredSession();
        router.replace("/login");
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSave = async () => {
    setStatus("saving");

    try {
      const response = await fetchApi("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName,
          designation: form.designation,
          department: form.department,
          facultyId: form.facultyId,
          researchDomain: form.researchDomain,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save profile.");
      }

      updateStoredUser(data.user);
      setMessage("Profile updated successfully.");
      setStatus("ready");
    } catch (error) {
      setMessage(error.message);
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading profile...</div>;
  }

  return (
    <div className="form-container" style={{ maxWidth: "100%" }}>
      <div className="dashboard-header">
        <h1>My Profile</h1>
        <p>Manage your faculty details.</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Designation</label>
          <input className="form-input" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-input" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Faculty ID</label>
          <input className="form-input" value={form.facultyId} onChange={(event) => setForm({ ...form, facultyId: event.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Research Domain</label>
        <input className="form-input" value={form.researchDomain} onChange={(event) => setForm({ ...form, researchDomain: event.target.value })} />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" value={form.email} disabled />
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save Changes"}
      </button>

      {message ? <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>{message}</p> : null}
    </div>
  );
}
