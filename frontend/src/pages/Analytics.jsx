import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AI_URL = process.env.REACT_APP_AI_SERVICE_URL;
const SPRING_BOOT_URL = process.env.REACT_APP_API_BASE_URL;

// ── Helpers ──
function statusColor(status) {
  if (status === "Strong") return "#10B981";
  if (status === "Improving") return "#0EA5E9";
  return "#EF4444";
}

function statusIcon(status) {
  if (status === "Strong") return "✅";
  if (status === "Improving") return "📈";
  return "⚠️";
}

function readinessColor(score) {
  if (score >= 85) return "#10B981";
  if (score >= 70) return "#0EA5E9";
  if (score >= 50) return "#F59E0B";
  if (score >= 30) return "#FB923C";
  return "#EF4444";
}

function trendIcon(trend) {
  if (trend === "Improving") return "↑";
  if (trend === "Needs Attention") return "↓";
  return "→";
}

function trendColor(trend) {
  if (trend === "Improving") return "#34D399";
  if (trend === "Needs Attention") return "#F87171";
  return "#9999ad";
}

function moduleIcon(module) {
  if (module === "Aptitude") return "🧠";
  if (module === "Coding") return "💻";
  return "🎤";
}

// ── Card style helper — gives depth against the page background ──
const cardStyle = {
  background: "#1a1a24",
  border: "1px solid #2f2f42",
  boxShadow: "0 4px 24px rgba(139, 92, 246, 0.06)",
};

// ── Circular readiness gauge ──
function ReadinessGauge({ score, label }) {
  const size = 240;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const color = readinessColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22222f" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize={54} fontWeight="800">{score}</text>
        <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle"
          fill="#9999ad" fontSize={15}>out of 100</text>
      </svg>
      <div style={{
        background: color + "1f",
        color: color,
        border: `1px solid ${color}40`,
        padding: "8px 22px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: "0.02em",
      }}>{label}</div>
    </div>
  );
}

// ── Module breakdown bar ──
function ModuleBar({ label, value, color, sessions }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#d4d4e0", fontSize: 15, fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: 15, fontWeight: 700 }}>
          {sessions > 0 ? `${value}%` : "No data"}
        </span>
      </div>
      <div style={{ background: "#22222f", borderRadius: 999, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${sessions > 0 ? value : 0}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

// ── Topic heatmap row ──
function HeatmapRow({ topic, score, status }) {
  const color = statusColor(status);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 0", borderBottom: "1px solid #26263a",
    }}>
      <span style={{ color: "white", fontSize: 16, fontWeight: 600, width: 130, flexShrink: 0 }}>{topic}</span>
      <div style={{ flex: 1, background: "#22222f", borderRadius: 999, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%", background: color,
          borderRadius: 999, transition: "width 1s ease",
        }} />
      </div>
      <span style={{ color, fontSize: 15, fontWeight: 700, width: 44, textAlign: "right" }}>{score}%</span>
      <span style={{
        display: "flex", alignItems: "center", gap: 5,
        color, fontSize: 13, fontWeight: 600, width: 100,
      }}>
        {statusIcon(status)} {status}
      </span>
    </div>
  );
}

// ── Week plan card ──
function WeekCard({ num, text }) {
  return (
    <div style={{
      ...cardStyle,
      borderRadius: 18, padding: 22, flex: 1, minWidth: 220,
    }}>
      <div style={{
        display: "inline-block", background: "#8B5CF625", color: "#A78BFA",
        fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
        marginBottom: 12, letterSpacing: "0.05em",
      }}>WEEK {num}</div>
      <p style={{ color: "#d4d4e0", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [moduleStats, setModuleStats] = useState(null);

  useEffect(() => {
    runAnalysis();
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      const dashRes = await fetch(`${SPRING_BOOT_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!dashRes.ok) throw new Error("dashboard fetch failed");
      const dash = await dashRes.json();
      setModuleStats(dash);

      const skills = localStorage.getItem("jobDescription") || "";
      const analyzeRes = await fetch(`${AI_URL}/analytics/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "1",
          skills,
          aptitude_avg: dash.aptitudeAvgScore || 0,
          coding_avg: dash.codingAvgScore || 0,
          interview_avg: dash.interviewAvgScore || 0,
          aptitude_sessions: dash.aptitudeSessions || 0,
          coding_sessions: dash.codingSessions || 0,
          interview_sessions: dash.interviewSessions || 0,
          recent_activity: (dash.recentActivity || []).map(a => ({
            module: a.module,
            topic: a.topic,
            score: a.score,
            date: a.date,
          })),
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (analyzeData.success) {
        setAnalysis(analyzeData.analysis);
      } else {
        throw new Error("analysis failed");
      }
    } catch (e) {
      console.log("Analytics error:", e);
      setError("Couldn't generate your analysis right now.");
    } finally {
      setLoading(false);
    }
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f17",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 18, fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{
          width: 48, height: 48, border: "3px solid #2a2a38",
          borderTopColor: "#8B5CF6", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ color: "#A78BFA", fontSize: 17 }}>Analyzing your performance...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f17",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 18, fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ color: "#EF4444", fontSize: 17 }}>{error}</div>
        <button onClick={runAnalysis} style={{
          background: "#8B5CF6", color: "white", border: "none",
          padding: "12px 28px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 15,
        }}>Retry</button>
      </div>
    );
  }

  const noData = !moduleStats || moduleStats.totalSessions === 0;

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
          <span style={{ fontSize: 26 }}>📊</span>
          <span style={{ fontWeight: 800, fontSize: 22 }}>Performance Analytics</span>
        </div>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "#8B5CF618", color: "#A78BFA", border: "1px solid #8B5CF640",
          borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600,
        }}>← Back to Dashboard</button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 28px" }}>

        {noData ? (
          <div style={{
            background: "linear-gradient(135deg, #8B5CF620, #6366F120)",
            border: "1px solid #8B5CF640", borderRadius: 22, padding: 48, textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎯</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>No data to analyze yet</h2>
            <p style={{ color: "#9999ad", margin: "0 0 22px", fontSize: 15 }}>
              Complete at least one practice session to unlock your performance analysis.
            </p>
            <button onClick={() => navigate("/dashboard")} style={{
              background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "white",
              border: "none", borderRadius: 12, padding: "13px 30px",
              cursor: "pointer", fontWeight: 700, fontSize: 15,
            }}>Go Practice →</button>
          </div>
        ) : (
          <>
            {/* ── READINESS SCORE ── */}
            <div style={{
              ...cardStyle, borderRadius: 26,
              padding: 40, marginBottom: 32,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 56,
              flexWrap: "wrap",
            }}>
              {moduleStats.totalSessions < 3 ? (
                <div style={{ textAlign: "center", padding: 24, minWidth: 220 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>🌱</div>
                  <p style={{ color: "#9999ad", fontSize: 15, maxWidth: 220, lineHeight: 1.6 }}>
                    Complete a few more sessions across all 3 modules for an accurate readiness score
                  </p>
                </div>
              ) : (
                <ReadinessGauge score={analysis.readiness_score} label={analysis.readiness_label} />
              )}
              <div style={{ flex: 1, minWidth: 280 }}>
                <h2 style={{ margin: "0 0 6px", fontSize: 14, color: "#9999ad", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  🎯 Placement Readiness
                </h2>
                <p style={{ color: "#d4d4e0", fontSize: 15, lineHeight: 1.7, margin: "10px 0 18px" }}>
                  This score weighs your interview performance most heavily, followed by coding and aptitude — reflecting what placement rounds actually prioritize.
                </p>
                {analysis.confidence_text && (
                  <div style={{
                    background: "#22222f", border: "1px solid #2f2f42",
                    borderRadius: 12, padding: "14px 16px", marginBottom: 24,
                  }}>
                    <p style={{ color: "#c0c0d0", fontSize: 14, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                      "{analysis.confidence_text}"
                    </p>
                  </div>
                )}
                <ModuleBar label="Aptitude" value={moduleStats.aptitudeAvgScore || 0} color="#0EA5E9" sessions={moduleStats.aptitudeSessions} />
                <ModuleBar label="Coding" value={moduleStats.codingAvgScore || 0} color="#A78BFA" sessions={moduleStats.codingSessions} />
                <ModuleBar label="Interview" value={moduleStats.interviewAvgScore || 0} color="#F59E0B" sessions={moduleStats.interviewSessions} />
              </div>
            </div>

            {/* ── TOPIC HEATMAP ── */}
            {analysis.topic_heatmap?.length > 0 && (
              <div style={{
                ...cardStyle, borderRadius: 22,
                padding: "28px 32px", marginBottom: 32,
              }}>
                <h2 style={{ margin: "0 0 22px", fontSize: 19, fontWeight: 800 }}>🗺️ Topic Performance Heatmap</h2>
                {analysis.topic_heatmap.map((t, i) => (
                  <HeatmapRow key={i} topic={t.topic} score={t.score} status={t.status} />
                ))}
              </div>
            )}

            {/* ── STRENGTHS & WEAK AREAS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 32 }}>
              <div style={{
                background: "#10B98114", border: "1px solid #10B98145",
                boxShadow: "0 4px 24px rgba(16, 185, 129, 0.05)",
                borderRadius: 18, padding: 24,
              }}>
                <h3 style={{ color: "#34D399", margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>✅ Strengths</h3>
                {analysis.strengths?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#a7f3d0", fontSize: 14, lineHeight: 2 }}>
                    {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p style={{ color: "#9999ad", fontSize: 14, margin: 0 }}>Keep practicing to build strengths.</p>}
              </div>
              <div style={{
                background: "#EF444414", border: "1px solid #EF444445",
                boxShadow: "0 4px 24px rgba(239, 68, 68, 0.05)",
                borderRadius: 18, padding: 24,
              }}>
                <h3 style={{ color: "#F87171", margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>⚠️ Weak Areas</h3>
                {analysis.weak_areas?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#fca5a5", fontSize: 14, lineHeight: 2 }}>
                    {analysis.weak_areas.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                ) : <p style={{ color: "#9999ad", fontSize: 14, margin: 0 }}>No major weak areas detected.</p>}
              </div>
            </div>

            {/* ── DAILY CHALLENGE ── */}
            <div style={{
              background: "linear-gradient(135deg, #F59E0B1c, #F5970B08)",
              border: "1px solid #F59E0B45",
              boxShadow: "0 4px 24px rgba(245, 158, 11, 0.06)",
              borderRadius: 18,
              padding: "22px 28px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 18,
            }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <div>
                <div style={{ color: "#FBBF24", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Today's Challenge
                </div>
                <div style={{ color: "#fde68a", fontSize: 15 }}>{analysis.daily_challenge}</div>
              </div>
            </div>

            {/* ── RECOMMENDED NEXT ACTION ── */}
            {analysis.next_action && (
              <div style={{
                background: "linear-gradient(135deg, #8B5CF61c, #6366F112)",
                border: "1px solid #8B5CF645",
                boxShadow: "0 4px 24px rgba(139, 92, 246, 0.08)",
                borderRadius: 18,
                padding: "22px 28px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 32 }}>🎯</span>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ color: "#A78BFA", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Recommended Next Action
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                    <span style={{
                      background: "#8B5CF625", color: "#A78BFA", fontSize: 13, fontWeight: 700,
                      padding: "4px 12px", borderRadius: 999,
                    }}>{moduleIcon(analysis.next_action.module)} {analysis.next_action.module}</span>
                    <span style={{
                      background: "#22222f", color: "#d4d4e0", fontSize: 13, fontWeight: 600,
                      padding: "4px 12px", borderRadius: 999,
                    }}>{analysis.next_action.topic}</span>
                    <span style={{
                      background: "#22222f", color: "#d4d4e0", fontSize: 13, fontWeight: 600,
                      padding: "4px 12px", borderRadius: 999,
                    }}>{analysis.next_action.difficulty}</span>
                  </div>
                  <p style={{ color: "#c0c0d0", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    {analysis.next_action.reason}
                  </p>
                </div>
              </div>
            )}

            {/* ── PROGRESS TREND ── */}
            {analysis.trend && (
              <div style={{
                ...cardStyle, borderRadius: 18,
                padding: "22px 28px", marginBottom: 32,
              }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>📈 Progress Trend</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { key: "aptitude", label: "Aptitude" },
                    { key: "coding", label: "Coding" },
                    { key: "interview", label: "Interview" },
                  ].map(({ key, label }) => {
                    const t = analysis.trend[key] || "Stable";
                    const color = trendColor(t);
                    return (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 0", borderBottom: key !== "interview" ? "1px solid #26263a" : "none",
                      }}>
                        <span style={{ color: "#d4d4e0", fontSize: 14, fontWeight: 600 }}>{label}</span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 6,
                          color, fontSize: 14, fontWeight: 700,
                        }}>
                          <span style={{ fontSize: 18 }}>{trendIcon(t)}</span>
                          {t}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── IMPROVEMENT PLAN ── */}
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 18 }}>🤖 AI Improvement Plan</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
              <WeekCard num={1} text={analysis.improvement_plan?.week1} />
              <WeekCard num={2} text={analysis.improvement_plan?.week2} />
              <WeekCard num={3} text={analysis.improvement_plan?.week3} />
              <WeekCard num={4} text={analysis.improvement_plan?.week4} />
            </div>

            {/* ── REFRESH ── */}
            <div style={{ textAlign: "center" }}>
              <button onClick={runAnalysis} style={{
                ...cardStyle, color: "#A78BFA",
                borderRadius: 12, padding: "12px 28px", cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>↻ Refresh Analysis</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
