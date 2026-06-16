"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { getRoleHomePath } from "@/lib/routes";
import { setStoredSession } from "@/lib/session";

const IITBHU_DATA = {
  "Computer Science & Engineering": ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Systems and Security", "Theoretical Computer Science"],
  "Electrical Engineering": ["Power Systems", "Control Systems", "Power Electronics", "Microelectronics", "Electrical Machines"],
  "Mechanical Engineering": ["Thermal and Fluid Engineering", "Solid Mechanics and Design", "Production Engineering", "Industrial Management"],
  "Civil Engineering": ["Structural Engineering", "Geotechnical Engineering", "Transportation Engineering", "Hydraulics and Water Resources", "Environmental Engineering"],
  "Electronics Engineering": ["Communication Systems", "Microwave Engineering", "Microelectronics", "Digital Techniques and Instrumentation"],
  "Metallurgical Engineering": ["Extractive Metallurgy", "Physical Metallurgy", "Alloy Design", "Materials Processing"],
  "Mining Engineering": ["Mine Planning", "Rock Mechanics", "Mine Environment", "Mine Surveying"],
  "Chemical Engineering": ["Transport Phenomena", "Reaction Engineering", "Separation Processes", "Polymer Science"],
  "Ceramic Engineering": ["Advanced Ceramics", "Glass Technology", "Refractories", "Electronic Ceramics"],
  "Pharmaceutical Engineering and Technology": ["Pharmaceutics", "Pharmaceutical Chemistry", "Pharmacology", "Pharmacognosy"],
  "Architecture, Planning & Design": ["Urban Planning", "Sustainable Architecture", "Landscape Architecture", "Town Planning"],
  Physics: ["Condensed Matter Physics", "Optics", "Nuclear Physics", "High Energy Physics", "Space Physics", "Quantum Information Theory"],
  Chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry"],
  "Mathematical Sciences": ["Applied Mathematics", "Pure Mathematics", "Statistics", "Operations Research"],
  "Humanistic Studies": ["English Literature", "Sociology", "Psychology", "Linguistics", "Economics"],
  "Biomedical Engineering": ["Biomechanics", "Biomaterials", "Medical Imaging", "Biosignal Processing"],
};

const DEPARTMENTS = [...Object.keys(IITBHU_DATA), "Other"];
const ROLES = [
  { id: "student", label: "Student & Scholar" },
  { id: "faculty", label: "Faculty" },
  { id: "admin", label: "Administrator" },
];
const PROGRAM_YEARS = [
  "B.Tech 1st Year", "B.Tech 2nd Year", "B.Tech 3rd Year", "B.Tech 4th Year",
  "IDD 1st Year", "IDD 2nd Year", "IDD 3rd Year", "IDD 4th Year", "IDD 5th Year",
  "M.Tech 1st Year", "M.Tech 2nd Year",
  "Ph.D 1st Year", "Ph.D 2nd Year", "Ph.D 3rd Year", "Ph.D 4th Year", "Ph.D 5th Year+",
  "Other",
];
const DESIGNATIONS = ["Assistant Professor", "Associate Professor", "Professor", "Visiting Faculty", "Guest Lecturer", "Guest Professor", "Other"];

export default function GoogleSignupPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    department: "",
    rollNumber: "",
    year: "",
    designation: "",
    facultyId: "",
    researchDomain: "",
    supervisor: "",
    adminCode: "",
    phone: "",
  });
  const [avatar, setAvatar] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState("");

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let active = true;

    async function loadPendingProfile() {
      try {
        if (typeof window !== "undefined") {
          const cached = window.sessionStorage.getItem("googleSignupProfile");
          if (cached) {
            const profile = JSON.parse(cached);
            setForm((current) => ({
              ...current,
              fullName: profile.fullName || current.fullName,
              email: profile.email || current.email,
            }));
            setAvatar(profile.avatar || "");
          }
        }

        const response = await fetchApi("/auth/google/pending-profile", { method: "GET" });
        const data = await response.json();
        if (!active) return;

        if (!response.ok || !data.success) {
          setBlocked(data.message || "Google profile session expired. Please sign in with Google again.");
          return;
        }

        const profile = data.googleProfile || {};
        setForm((current) => ({
          ...current,
          fullName: profile.fullName || current.fullName,
          email: profile.email || current.email,
        }));
        setAvatar(profile.avatar || "");
      } catch {
        if (active) setBlocked("Google profile session expired. Please sign in with Google again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPendingProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!form.fullName.trim()) { showToast("Please enter your full name"); return; }
    if (!form.email.trim()) { showToast("Google email is missing. Please sign in with Google again."); return; }
    if (!role) { showToast("Please select your role"); return; }
    if (!form.department) { showToast("Please select your department"); return; }
    if (role === "student" && !form.year) { showToast("Please select your program and year"); return; }
    if (role === "faculty" && !form.designation) { showToast("Please select your designation"); return; }
    if (role === "admin" && !form.adminCode.trim()) { showToast("Please enter your admin authorization code"); return; }

    setSubmitting(true);
    try {
      const response = await fetchApi("/auth/google/complete-profile", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          role,
          phone: form.phone,
          department: form.department,
          rollNumber: form.rollNumber,
          year: form.year,
          designation: form.designation,
          facultyId: form.facultyId,
          researchDomain: form.researchDomain,
          supervisor: form.supervisor,
          adminCode: form.adminCode,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(data.message || "Could not complete Google sign-up");
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("googleSignupProfile");
      }
      setStoredSession(data.token, data.user);
      router.replace(getRoleHomePath(data.user.role));
    } catch {
      showToast("Server error. Please verify the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container fade-in" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Loading Google profile...</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="auth-page">
        <div className="auth-container fade-in" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: 12 }}>Google sign-up expired</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontFamily: "Plus Jakarta Sans,sans-serif" }}>{blocked}</p>
          <button className="btn btn-primary btn-lg" onClick={() => router.replace("/login")}>Return to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <div className="auth-container fade-in">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <div className="logo-icon">AEH</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.5rem", fontWeight: 700, textTransform: "uppercase" }}>
              Academic Events <span style={{ color: "var(--accent-primary)" }}>Hub</span>
            </span>
          </div>
          <h1>Complete your profile</h1>
          <p>Your Google account is verified. Add the campus details needed for AEH.</p>
        </div>

        <div className="google-profile-card">
          {avatar ? <img className="google-profile-avatar" src={avatar} alt="" referrerPolicy="no-referrer" /> : <div className="google-profile-avatar" />}
          <div>
            <strong>{form.fullName}</strong>
            <span>{form.email}</span>
          </div>
        </div>

        <div className="auth-role-selector">
          {ROLES.map((item) => (
            <button key={item.id} className={`auth-role-chip ${role === item.id ? "active" : ""}`} onClick={() => setRole(item.id)}>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.fullName} onChange={(event) => set("fullName", event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Google Email</label>
            <input className="form-input" type="email" value={form.email} disabled readOnly />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" type="tel" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(event) => set("phone", event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-select" value={form.department} onChange={(event) => set("department", event.target.value)}>
              <option value="" disabled>Select Department</option>
              {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </div>

          {role === "student" && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="form-input" placeholder="e.g. 21CS1045" value={form.rollNumber} onChange={(event) => set("rollNumber", event.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Program &amp; Year *</label>
                  <select className="form-select" value={form.year} onChange={(event) => set("year", event.target.value)}>
                    <option value="" disabled>Select Program &amp; Year</option>
                    {PROGRAM_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>

              {form.year?.startsWith("Ph.D") && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Research Domain</label>
                    {IITBHU_DATA[form.department] ? (
                      <select className="form-select" value={form.researchDomain} onChange={(event) => set("researchDomain", event.target.value)}>
                        <option value="">Select Research Domain</option>
                        {IITBHU_DATA[form.department].map((domain) => <option key={domain} value={domain}>{domain}</option>)}
                        <option value="Other">Other / Interdisciplinary</option>
                      </select>
                    ) : (
                      <input className="form-input" placeholder="e.g. Machine Learning" value={form.researchDomain} onChange={(event) => set("researchDomain", event.target.value)} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supervisor</label>
                    <input className="form-input" placeholder="e.g. Prof. Arun Kumar" value={form.supervisor} onChange={(event) => set("supervisor", event.target.value)} />
                  </div>
                </div>
              )}
            </>
          )}

          {role === "faculty" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <select className="form-select" value={form.designation} onChange={(event) => set("designation", event.target.value)}>
                  <option value="" disabled>Select Designation</option>
                  {DESIGNATIONS.map((designation) => <option key={designation} value={designation}>{designation}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input className="form-input" placeholder="e.g. FAC-CS-2018-042" value={form.facultyId} onChange={(event) => set("facultyId", event.target.value)} />
              </div>
            </div>
          )}

          {role === "admin" && (
            <div className="form-group">
              <label className="form-label">Admin Authorization Code *</label>
              <input className="form-input" type="password" placeholder="Enter the code provided by IT department" value={form.adminCode} onChange={(event) => set("adminCode", event.target.value)} />
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button className="btn btn-ghost btn-lg" onClick={() => router.replace("/login")}>Back</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: "center" }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating account..." : "Complete Google sign-up"}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast"><span>{toast}</span><button className="toast-close" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}
