import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SPRING_BOOT_URL = "http://localhost:8080";

function scoreColors(score) {
  if (score >= 70) return { bg: "#10B98120", text: "#34D399", border: "#10B98145" };
  if (score >= 40) return { bg: "#F59E0B20", text: "#FBBF24", border: "#F59E0B45" };
  return { bg: "#EF444420", text: "#F87171", border: "#EF444445" };
}

const cardStyle = {
  background: "#1a1a24",
  border: "1px solid #2f2f42",
  boxShadow: "0 4px 24px rgba(139, 92, 246, 0.06)",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  const modules = [
    {
      title: "Aptitude Practice",
      desc: "Solve MCQs and improve logical thinking",
      icon: "🧠",
      route: "/aptitude",
      sessionsKey: "aptitudeSessions",
      avgKey: "aptitudeAvgScore",
    },
    {
      title: "Coding Practice",
      desc: "Practice coding problems and logic building",
      icon: "💻",
      route: "/coding",
      sessionsKey: "codingSessions",
      avgKey: "codingAvgScore",
    },
    {
      title: "Mock Interview",
      desc: "AI voice-based interview with feedback",
      icon: "🎤",
      route: "/interview-setup",
      sessionsKey: "interviewSessions",
      avgKey: "interviewAvgScore",
    },
  ];

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${SPRING_BOOT_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDashData(data);
    } catch (e) {
      console.log("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  const hasSessions = dashData?.totalSessions > 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f17", color: "white",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── TOPBAR ── */}
      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12,
        padding: "20px 36px", borderBottom: "1px solid #1e1e2e",
        background: "#0f0f17", position: "sticky", top: 0, zIndex: 10,
      }}>
        {hasSessions && (
          <button onClick={() => navigate("/history")} style={{
            background: "#0EA5E920", color: "#38BDF8", border: "1px solid #0EA5E945",
            borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>🕘 History</button>
        )}
        {hasSessions && (
          <button onClick={() => navigate("/analytics")} style={{
            background: "#8B5CF625", color: "#A78BFA", border: "1px solid #8B5CF650",
            borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>📊 View Analytics</button>
        )}
        <button onClick={() => { localStorage.clear(); navigate("/login"); }} style={{
          background: "#EF444420", color: "#F87171", border: "1px solid #EF444445",
          borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600,
        }}>Logout</button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px" }}>

        {/* ── WELCOME ── */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px" }}>Welcome, {name}</h1>
          <p style={{ color: "#9999ad", fontSize: 16, margin: 0 }}>
            Prepare for placements with AI-powered practice
          </p>
        </div>

        {/* ── MODULES ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, marginBottom: 28,
        }}>
          {modules.map((mod, index) => {
            const sessions = dashData?.[mod.sessionsKey] || 0;
            const avg = dashData?.[mod.avgKey] || 0;
            const colors = scoreColors(avg);
            return (
              <div
                key={index}
                onClick={() => navigate(mod.route)}
                style={{
                  ...cardStyle, borderRadius: 20, padding: 26, cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2f2f42"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 34, marginBottom: 14 }}>{mod.icon}</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{mod.title}</h2>
                <p style={{ color: "#9999ad", fontSize: 14, margin: "0 0 18px", lineHeight: 1.5 }}>{mod.desc}</p>

                {sessions > 0 ? (
                  <>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      paddingTop: 16, borderTop: "1px solid #2f2f42",
                    }}>
                      <span style={{ color: "#9999ad", fontSize: 13 }}>
                        {sessions} session{sessions !== 1 ? "s" : ""}
                      </span>
                      <span style={{
                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 999,
                      }}>Avg {Math.round(avg)}</span>
                    </div>
                    {sessions < 3 && (
                      <p style={{ color: "#6b6b80", fontSize: 11, margin: "8px 0 0" }}>
                        Practice more for an accurate average
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{ paddingTop: 16, borderTop: "1px solid #2f2f42" }}>
                    <span style={{ color: "#6b6b80", fontSize: 13 }}>Not started yet</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── ANALYTICS CTA ── */}
        {!loading && hasSessions && (
          <div
            onClick={() => navigate("/analytics")}
            style={{
              background: "linear-gradient(135deg, #8B5CF61c, #6366F112)",
              border: "1px solid #8B5CF645",
              boxShadow: "0 4px 24px rgba(139, 92, 246, 0.08)",
              borderRadius: 20, padding: 26, marginBottom: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#8B5CF6"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#8B5CF645"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: 32 }}>📊</span>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>See your full performance analysis</h3>
                <p style={{ color: "#9999ad", fontSize: 14, margin: 0 }}>
                  Readiness score, topic heatmap, and a personalized improvement plan
                </p>
              </div>
            </div>
            <span style={{ color: "#A78BFA", fontSize: 22 }}>→</span>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ textAlign: "center", color: "#6b6b80", fontSize: 14, marginTop: 16 }}>
            Loading your progress...
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", marginTop: 36, color: "#6b6b80", fontSize: 14 }}>
          🚀 Track your progress and improve daily
        </div>

      </div>
    </div>
  );
}