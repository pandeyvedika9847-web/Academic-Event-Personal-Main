"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_COPY, PUBLIC_CONFIG } from "@/lib/config/public";
import { FEATURES, DEPARTMENTS, EVENT_TYPES } from "@/lib/data";
import { fetchApi } from "@/lib/api";
import { getRoleHomePath } from "@/lib/routes";
import { getStoredUser } from "@/lib/session";
import { socket } from "@/lib/socket";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Home() {
  const router = useRouter();
  
  // State for events
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // State for filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Auth State
  const [user, setUser] = useState(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch Featured Events (only on mount)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetchApi("/events?featured=true&limit=3");
        const data = await res.json();
        if (data.success) {
          setFeaturedEvents(data.events);
        }
      } catch (err) {
        console.error("Failed to fetch featured events", err);
      }
    };
    fetchFeatured();
    
    // Check auth
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [recommendedEvents, setRecommendedEvents] = useState([]);

  // Fetch Recommended Events based on user interests
  useEffect(() => {
    if (!user || (!user.interests?.length && !user.subscribedSubjects?.length)) return;
    
    const fetchRecommended = async () => {
      try {
        const res = await fetchApi("/events?limit=50");
        const data = await res.json();
        if (data.success) {
          const userinterests = [...(user.interests || []), ...(user.subscribedSubjects || [])].map(i => i.toLowerCase());
          const matching = data.events.filter(e => {
            if (!e.tags || e.tags.length === 0) return false;
            return e.tags.some(tag => userinterests.includes(tag.toLowerCase()));
          });
          setRecommendedEvents(matching.slice(0, 3)); // Show top 3 recommended
        }
      } catch (err) {
        console.error("Failed to fetch recommended events", err);
      }
    };
    fetchRecommended();
  }, [user]);

  // Fetch Upcoming Events (when filters or page changes)
  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoading(true);
      try {
        let url = `/events?page=${page}&limit=6`;
        if (typeFilter !== "all") url += `&type=${typeFilter}`;
        if (deptFilter !== "All Departments") url += `&department=${encodeURIComponent(deptFilter)}`;
        if (subjectFilter !== "All Subjects") url += `&subject=${encodeURIComponent(subjectFilter)}`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
        
        const res = await fetchApi(url);
        const data = await res.json();
        
        if (data.success) {
          if (page === 1) {
            setUpcomingEvents(data.events);
          } else {
            setUpcomingEvents(prev => [...prev, ...data.events]);
          }
          setHasMore(data.page < data.pages);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming events", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcoming();
  }, [typeFilter, deptFilter, subjectFilter, debouncedSearch, page]);

  // Real-time WebSockets setup
  useEffect(() => {
    socket.connect();
    
    const handleNewEvent = (newEvent) => {
      setUpcomingEvents(prev => {
        // Prevent duplicates
        if (prev.find(e => e._id === newEvent._id)) return prev;
        return [newEvent, ...prev];
      });
    };

    socket.on("event_published", handleNewEvent);

    return () => {
      socket.off("event_published", handleNewEvent);
      socket.disconnect();
    };
  }, []);

  // Scroll Reveal Logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [featuredEvents, upcomingEvents, recommendedEvents]);

  // Handlers for filters
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1); // reset to page 1 on filter change
  };

  const handleDeptChange = (e) => {
    setDeptFilter(e.target.value);
    setPage(1); // reset to page 1 on filter change
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-icon">🎓</div>
          Academic Events Hub (AEH)
        </div>
        <div className="navbar-links">
          <a href="#" style={{ color: "var(--text-primary)", fontWeight: 600 }}>🏠 Home</a>
          <a href="#events">🎟️ Events</a>
          <a href="/calendar">🗓️ Calendar</a>
        </div>
        <div className="navbar-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user && (
            <>
              <button className="btn btn-ghost btn-sm desktop-only" onClick={() => router.push(getRoleHomePath(user.role))}>
                📊 Dashboard
              </button>
              <div className="user-avatar" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", cursor: "pointer" }} onClick={() => router.push(getRoleHomePath(user.role))}>
                {user.fullName.charAt(0)}
              </div>
            </>
          )}
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <div className="navbar-brand" style={{ fontSize: "1.2rem" }}>
            <div className="logo-icon" style={{ width: 24, height: 24, fontSize: "0.9rem" }}>🎓</div> AEH
          </div>
          <button className="mobile-drawer-close" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        </div>
        <div className="mobile-drawer-links">
          <a href="#" onClick={() => setIsMobileMenuOpen(false)}>🏠 Home</a>
          <a href="#events" onClick={() => setIsMobileMenuOpen(false)}>🎟️ Events</a>
          <a href="/calendar" onClick={() => setIsMobileMenuOpen(false)}>🗓️ Calendar</a>
          {user ? (
            <a href={getRoleHomePath(user.role)} onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-primary)", fontWeight: 700 }}>
              📊 Dashboard
            </a>
          ) : (
            <a href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-primary)", fontWeight: 700 }}>
              🔑 Sign In
            </a>
          )}
        </div>
      </div>
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* MOBILE BOTTOM NAVIGATION (Native App Feel) */}
      <div className="mobile-bottom-nav">
        <div className="bottom-nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">Home</span>
        </div>
        <div className="bottom-nav-item" onClick={() => router.push('/calendar')}>
          <span className="bottom-nav-icon">🗓️</span>
          <span className="bottom-nav-label">Calendar</span>
        </div>
        <div className="bottom-nav-item" onClick={() => router.push(user ? getRoleHomePath(user.role) : '/login')}>
          <span className="bottom-nav-icon">{user ? '📊' : '🔑'}</span>
          <span className="bottom-nav-label">{user ? 'Dashboard' : 'Sign In'}</span>
        </div>
      </div>

      {/* MOBILE ONLY SEARCH BAR (Matches mockup) */}
      <div className="mobile-only-search">
        <div style={{ position: "relative" }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search events, topics, speakers..." 
            style={{ paddingLeft: "40px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          />
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
          <button className="btn btn-secondary btn-sm" style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", padding: "4px 8px", fontSize: "0.8rem", borderRadius: "8px" }}>
            <span style={{ opacity: 0.7 }}>⌘</span> Filter
          </button>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <div className="hero-content fade-in">
          <div className="hero-badge">{PUBLIC_CONFIG.universityName} & Beyond</div>
          <h1>Discover Every Academic Event On Campus</h1>
          <p>One platform to find seminars, workshops, conferences, guest lectures, and training programs. Never miss a relevant academic opportunity again.</p>
          <div className="hero-stats">
            {[["1,200+","Events Published"],["100+","Departments"],["30,000+","Students Reached"],["95%","Satisfaction"]].map(([n,l])=>(
              <div key={l} className="hero-stat"><div className="number">{n}</div><div className="label">{l}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push("/signup")} style={{ paddingLeft: 32, paddingRight: 32 }}>
              🚀 Get Started — Sign Up →
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push("/login")} style={{ paddingLeft: 32, paddingRight: 32 }}>
              🔑 Sign In
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push("/poster-upload")} style={{ paddingLeft: 32, paddingRight: 32, background: 'rgba(99, 102, 241, 0.1)', borderColor: 'var(--accent-primary)', color: 'var(--text-highlight)' }}>
              🪄 Extract Event from Poster
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      {featuredEvents.length > 0 && (
        <section className="section reveal" style={{ background: "rgba(99, 102, 241, 0.02)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="section-header" style={{ marginBottom: "2rem" }}>
              <h2>⭐ Featured Events</h2>
              <p>Highly anticipated events handpicked for you</p>
            </div>
            <div className="events-grid carousel-mobile">
              {featuredEvents.map(e => (
                <div key={e._id} className="event-card reveal" style={{ border: "1px solid var(--primary-border)" }}>
                  <div className="event-card-banner" style={{ background: `linear-gradient(135deg, ${e.color || '#6366f1'}22, ${e.color || '#6366f1'}08)` }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "3rem", opacity: 0.3 }}>
                      {e.type === "conference" ? "🏛️" : e.type === "workshop" ? "🔧" : "📋"}
                    </div>
                    <span className={`event-card-type type-${e.type}`}>{e.type}</span>
                  </div>
                  <div className="event-card-body">
                    <div className="event-card-date">📅 {fmtDate(e.date)}</div>
                    <h3 className="event-card-title">{e.title}</h3>
                    <div className="event-card-meta" style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>🕒 {e.time || 'Time TBA'}</span>
                      <span>📍 {e.venue || 'Venue TBA'}</span>
                    </div>
                    <p className="event-card-desc" style={{ marginTop: "0" }}>{e.description}</p>
                    <div className="event-card-meta">
                      <span className="event-card-dept">🏫 {e.department}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>{e.registrations || 0}+ registered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECOMMENDED FOR YOU */}
      {user && recommendedEvents.length > 0 && (
        <section className="section reveal" style={{ background: "rgba(16, 185, 129, 0.03)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="section-header" style={{ marginBottom: "2rem" }}>
              <h2>🎯 Recommended For You</h2>
              <p>Based on your interests and research domains</p>
            </div>
            <div className="events-grid carousel-mobile">
              {recommendedEvents.map(e => (
                <div key={e._id} className="event-card reveal" onClick={() => router.push(`/events/${e._id}`)} style={{ border: "1px solid #10b981", cursor: "pointer" }}>
                  <div className="event-card-banner" style={{ background: `linear-gradient(135deg, ${e.color || '#10b981'}22, ${e.color || '#10b981'}08)` }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "3rem", opacity: 0.3 }}>
                      ✨
                    </div>
                    <span className={`event-card-type type-${e.type}`}>{e.type}</span>
                  </div>
                  <div className="event-card-body">
                    <div className="event-card-date">📅 {fmtDate(e.date)}</div>
                    <h3 className="event-card-title">{e.title}</h3>
                    <div className="event-card-meta" style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>🕒 {e.time || 'Time TBA'}</span>
                      <span>📍 {e.venue || 'Venue TBA'}</span>
                    </div>
                    <p className="event-card-desc" style={{ marginTop: "0" }}>{e.description}</p>
                    <div className="event-card-meta">
                      <span className="event-card-dept">🏫 {e.department}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "Plus Jakarta Sans,sans-serif", background: "#10b98122", color: "#10b981", padding: "2px 8px", borderRadius: "10px" }}>
                        Matches your interests
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DISCOVERY / LISTINGS */}
      <section id="events" className="section reveal">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="section-header" style={{ marginBottom: "2rem" }}>
            <h2>Upcoming Events</h2>
            <p>A glimpse of what&apos;s happening across campus</p>
          </div>
          
          {/* SEARCH BAR */}
          <div className="desktop-search-bar" style={{ maxWidth: 600, margin: "0 auto 2rem", position: "relative" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by title, speaker, keyword, or domain... (Ctrl+K)" 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ paddingLeft: "40px", borderRadius: "50px", fontSize: "1.1rem" }}
            />
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
          </div>
          
          {/* FILTER BAR */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "3rem", padding: "1rem", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>🏷️ Event Type:</span>
              <select 
                className="input-field" 
                style={{ padding: "8px 12px", width: "auto", minWidth: "150px" }}
                value={typeFilter}
                onChange={handleTypeChange}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>Department:</span>
              <select 
                className="input-field" 
                style={{ padding: "8px 12px", width: "auto", minWidth: "200px" }}
                value={deptFilter}
                onChange={handleDeptChange}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>Subject:</span>
              <select 
                className="input-field" 
                style={{ padding: "8px 12px", width: "auto", minWidth: "180px" }}
                value={subjectFilter}
                onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}
              >
                <option value="All Subjects">All Subjects</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="AI & ML">AI & ML</option>
                <option value="Robotics">Robotics</option>
              </select>
            </div>
          </div>

          {/* EVENTS FEED */}
          {upcomingEvents.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
              <h3>No events found</h3>
              <p>Try adjusting your filters to discover more events.</p>
              <button className="btn btn-ghost" onClick={() => { setTypeFilter("all"); setDeptFilter("All Departments"); }} style={{ marginTop: "1rem" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="events-grid schedule-mobile">
              {upcomingEvents.map(e => (
                <div key={e._id} className="event-card reveal" onClick={() => router.push(`/events/${e._id}`)} style={{ cursor: "pointer" }}>
                  <div className="event-card-banner" style={{ background: `linear-gradient(135deg, ${e.color || '#6366f1'}22, ${e.color || '#6366f1'}08)` }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "3rem", opacity: 0.3 }}>
                      {e.type === "conference" ? "🏛️" : e.type === "workshop" ? "🔧" : "📋"}
                    </div>
                    <span className={`event-card-type type-${e.type}`}>{e.type}</span>
                  </div>
                  <div className="event-card-body">
                    <div className="event-card-date">📅 {fmtDate(e.date)}</div>
                    <h3 className="event-card-title">{e.title}</h3>
                    <div className="event-card-meta" style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>🕒 {e.time || 'Time TBA'}</span>
                      <span>📍 {e.venue || 'Venue TBA'}</span>
                    </div>
                    <p className="event-card-desc" style={{ marginTop: "0" }}>{e.description}</p>
                    <div className="event-card-meta">
                      <span className="event-card-dept">🏫 {e.department}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>{e.registrations || 0}+ registered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION / LOAD MORE */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPage(p => p + 1)} 
                disabled={loading}
                style={{ paddingLeft: "2rem", paddingRight: "2rem" }}
              >
                {loading ? "Loading..." : "Load More Events ↓"}
              </button>
            </div>
          )}
          
          {loading && upcomingEvents.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)" }}>
              <div className="spinner"></div> Loading more events...
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section reveal">
        <div className="section-header">
          <h2>Why {PUBLIC_CONFIG.appShortName}?</h2>
          <p>Built for the unique needs of large universities</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card ${i === 0 ? "bento-large" : i === 1 || i === 2 ? "bento-normal" : i === 3 ? "bento-tall" : "bento-wide"}`}>
              <div className="feature-icon" style={{ background: f.gradient }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{PUBLIC_CONFIG.appName}</h3>
            <p>{APP_COPY.description} Built for {PUBLIC_CONFIG.universityName} and beyond.</p>
          </div>
          <div className="footer-col"><h4>Platform</h4><Link href="/">Discover</Link><Link href="/calendar">Calendar</Link><Link href="/login">Submit Event</Link></div>
          <div className="footer-col"><h4>Resources</h4><a href="#">Documentation</a><a href="#">API Access</a><a href="#">Help Center</a></div>
          <div className="footer-col"><h4>Contact</h4><a href={`mailto:${PUBLIC_CONFIG.supportEmail}`}>{PUBLIC_CONFIG.supportEmail}</a><a href={PUBLIC_CONFIG.siteUrl}>{PUBLIC_CONFIG.universityName}</a></div>
        </div>
        <div className="footer-bottom">© 2026 {PUBLIC_CONFIG.appName} ({PUBLIC_CONFIG.appShortName}) - {APP_COPY.tagline}.</div>
      </footer>
    </>
  );
}
