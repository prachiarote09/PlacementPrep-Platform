import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SPRING_BOOT_URL = "http://localhost:8080";

const cardStyle = {
  background: "#1a1a24",
  border: "1px solid #2f2f42",
  boxShadow: "0 4px 24px rgba(139, 92, 246, 0.06)",
};

function moduleStyle(module) {
  if (module === "Aptitude") return { bg: "#0EA5E920", text: "#38BDF8", border: "#0EA5E945" };
  if (module === "Coding") return { bg: "#8B5CF620", text: "#A78BFA", border: "#8B5CF645" };
  if (module === "Interview") return { bg: "#F59E0B20", text: "#FBBF24", border: "#F59E0B45" };
  return { bg: "#6b6b8020", text: "#9999ad", border: "#6b6b8045" };
}

function scoreColor(score) {
  if (score >= 70) return "#34D399";
  if (score >= 40) return "#FBBF24";
  return "#F87171";
}

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative;
  if (diffMins < 1) relative = "just now";
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHrs < 24) relative = `${diffHrs}h ago`;
  else if (diffDays < 7) relative = `${diffDays}d ago`;
  else relative = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return { relative, time };
}

// ── Module icon ──
function moduleIcon(module) {
  if (module === "Aptitude") return "🧠";
  if (module === "Coding") return "💻";
  if (module === "Interview") return "🎤";
  return "📝";
}

export default function History() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${SPRING_BOOT_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActivity(data.recentActivity || []);
    } catch (e) {
      console.log("History fetch error:", e);
      setError("Couldn't load your history right now.");
    } finally {
      setLoading(false);
    }
  }

  const filters = ["All", "Aptitude", "Coding", "Interview"];
  const filtered = filter === "All" ? activity : activity.filter(a => a.module === filter);

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f17", color: "white",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ── TOPBAR ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 36px", borderBottom: "1px solid #1e1e2e",
        background: "#0f0f17", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26 }}>🕘</span>
          <span style={{ fontWeight: 800, fontSize: 22 }}>Activity History</span>
        </div>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "#8B5CF618", color: "#A78BFA", border: "1px solid #8B5CF640",
          borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600,
        }}>← Back to Dashboard</button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px" }}>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 0", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, border: "3px solid #2a2a38",
              borderTopColor: "#8B5CF6", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ color: "#A78BFA", fontSize: 15 }}>Loading your history...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#F87171", fontSize: 15, marginBottom: 16 }}>{error}</p>
            <button onClick={fetchHistory} style={{
              background: "#8B5CF6", color: "white", border: "none",
              padding: "10px 24px", borderRadius: 12, cursor: "pointer", fontWeight: 600,
            }}>Retry</button>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !error && activity.length === 0 && (
          <div style={{
            background: "linear-gradient(135deg, #8B5CF620, #6366F120)",
            border: "1px solid #8B5CF640", borderRadius: 22, padding: 48, textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>No activity yet</h2>
            <p style={{ color: "#9999ad", margin: "0 0 22px", fontSize: 15 }}>
              Complete a practice session and it'll show up here.
            </p>
            <button onClick={() => navigate("/dashboard")} style={{
              background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "white",
              border: "none", borderRadius: 12, padding: "13px 30px",
              cursor: "pointer", fontWeight: 700, fontSize: 15,
            }}>Go Practice →</button>
          </div>
        )}

        {/* ── CONTENT ── */}
        {!loading && !error && activity.length > 0 && (
          <>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {filters.map(f => {
                const active = filter === f;
                const colors = f === "All" ? { bg: "#8B5CF620", text: "#A78BFA", border: "#8B5CF645" } : moduleStyle(f);
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: active ? colors.bg : "#1a1a24",
                      color: active ? colors.text : "#9999ad",
                      border: `1px solid ${active ? colors.border : "#2f2f42"}`,
                      borderRadius: 999, padding: "8px 18px",
                      cursor: "pointer", fontSize: 14, fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    {f !== "All" && moduleIcon(f) + " "}{f}
                  </button>
                );
              })}
            </div>

            {/* History list */}
            <div style={{ ...cardStyle, borderRadius: 22, overflow: "hidden" }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#6b6b80", fontSize: 14 }}>
                  No {filter} activity yet
                </div>
              ) : (
                filtered.map((item, i) => {
                  const mColors = moduleStyle(item.module);
                  const { relative, time } = formatDate(item.date);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "center", gap: 18,
                        padding: "20px 28px",
                        borderBottom: i !== filtered.length - 1 ? "1px solid #26263a" : "none",
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: mColors.bg, border: `1px solid ${mColors.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0,
                      }}>
                        {moduleIcon(item.module)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{
                            color: mColors.text, fontSize: 12, fontWeight: 700,
                            background: mColors.bg, padding: "2px 10px", borderRadius: 999,
                          }}>{item.module}</span>
                        </div>
                        <p style={{
                          color: "white", fontSize: 15, fontWeight: 600, margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{item.topic}</p>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{
                          color: scoreColor(item.score), fontSize: 20, fontWeight: 800,
                        }}>{Math.round(item.score)}</div>
                        <div style={{ color: "#6b6b80", fontSize: 12 }}>{relative} · {time}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p style={{ textAlign: "center", color: "#6b6b80", fontSize: 13, marginTop: 20 }}>
              Showing your last {activity.length} activities
            </p>
          </>
        )}
      </div>
    </div>
  );
}