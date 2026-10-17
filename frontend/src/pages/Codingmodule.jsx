import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_AI_SERVICE_URL;
const SPRING_BOOT_URL = process.env.REACT_APP_API_BASE_URL;
const USER_ID = "user_001";

const CATEGORIES = [
  { id: "DSA", label: "DSA", icon: "🌳" },
  { id: "Java", label: "Java", icon: "☕" },
  { id: "Spring Boot", label: "Spring Boot", icon: "🍃" },
  { id: "SQL", label: "SQL", icon: "🗄️" },
  { id: "React", label: "React", icon: "⚛️" },
  { id: "OOPs", label: "OOPs", icon: "🧩" },
  { id: "DBMS", label: "DBMS", icon: "💾" },
  { id: "Operating System", label: "OS", icon: "🖥️" },
  { id: "Computer Networks", label: "Networks", icon: "🌐" },
];

const DIFFICULTIES = [
  { id: "Easy", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", dot: "bg-emerald-400" },
  { id: "Medium", color: "text-amber-400 border-amber-500/40 bg-amber-500/10", dot: "bg-amber-400" },
  { id: "Hard", color: "text-red-400 border-red-500/40 bg-red-500/10", dot: "bg-red-400" },
];

const STEPS = { SELECT: 0, CODING: 1, RESULT: 2 };

function Timer({ running }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5">
      <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
      <span className="text-sm font-mono font-bold text-violet-300">{m}:{s}</span>
    </div>
  );
}

function ScoreRing({ value, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="text-center -mt-14">
        <div className="text-lg font-black text-white">{value}</div>
      </div>
      <div className="mt-6 text-xs text-zinc-400 text-center">{label}</div>
    </div>
  );
}

export default function CodingModule() {
  const [step, setStep] = useState(STEPS.SELECT);
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("# Write your solution here\n\n");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [currentHint, setCurrentHint] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [askedTitles, setAskedTitles] = useState([]);
  const [attempted, setAttempted] = useState(0);
  const [solved, setSolved] = useState(0);
  const [activeTab, setActiveTab] = useState("problem");
  const [language, setLanguage] = useState("python");

  const navigate = useNavigate();
  async function fetchQuestion() {
    setLoading(true);
    setError(null);
    setHintLevel(0);
    setCurrentHint(null);
    setCode("# Write your solution here\n\n");
    setActiveTab("problem");
    try {
      const res = await fetch(`${BASE_URL}/coding/generate-coding-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty, asked_titles: askedTitles }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      setQuestion(data.question);
      setAskedTitles(prev => [...prev, data.question.title]);
      setStep(STEPS.CODING);
      setAttempted(a => a + 1);
    } catch (e) {
      setError("Failed to generate question. Check your backend.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchHint() {
    if (hintLevel >= 3) return;
    const nextLevel = hintLevel + 1;
    setLoadingHint(true);
    try {
      const res = await fetch(`${BASE_URL}/coding/get-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_title: question.title,
          question_statement: question.statement,
          hint_level: nextLevel,
        }),
      });
      const data = await res.json();
      setCurrentHint(data.hint);
      setHintLevel(nextLevel);
    } catch (e) {
      setCurrentHint("Think about which data structure fits best here.");
    } finally {
      setLoadingHint(false);
    }
  }

  async function submitCode() {
    if (!code.trim() || code === "# Write your solution here\n\n") {
      setError("Please write some code before submitting.");
      return;
    }
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/coding/evaluate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          question_title: question.title,
          question_statement: question.statement,
          category,
          difficulty,
          user_code: code,
          language,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEvaluation(data.evaluation);
      if (data.evaluation.score >= 60) setSolved(s => s + 1);
      setStep(STEPS.RESULT);
      // ── SAVE TO SPRING BOOT ──
      const token = localStorage.getItem("token");
      await fetch(`${SPRING_BOOT_URL}/api/dashboard/save-coding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: category,
          difficulty: difficulty,
          problemTitle: question.title,
          score: data.evaluation.score,
          correctness: data.evaluation.correctness,
          optimization: data.evaluation.optimization,
          readability: data.evaluation.readability,
          edgeCases: data.evaluation.edge_cases,
        }),
      });
    } catch (e) {
  setError(e.message || "Evaluation failed. Try again.");
    } finally {
      setEvaluating(false);
    }
  }

  function handleNextQuestion() {
    setEvaluation(null);
    setStep(STEPS.CODING);
    fetchQuestion();
  }

  function handleRestart() {
    setStep(STEPS.SELECT);
    setCategory(null);
    setDifficulty(null);
    setQuestion(null);
    setCode("# Write your solution here\n\n");
    setEvaluation(null);
    setHintLevel(0);
    setCurrentHint(null);
    setError(null);
  }

  const readinessBadge = {
    "Not Ready": "bg-red-500/10 text-red-400 border-red-500/30",
    "Needs Practice": "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "Interview Ready": "bg-sky-500/10 text-sky-400 border-sky-500/30",
    "Excellent": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  // ── STEP 0: SELECT ───────────────────────────────────────────────────────
  if (step === STEPS.SELECT) return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10">
           <button
  onClick={() => navigate("/dashboard")}
  className="absolute top-6 left-6 text-sm bg-[#1a1a24] border border-[#2f2f42] text-gray-300 px-4 py-2 rounded-lg hover:border-violet-500 hover:text-white transition-colors flex items-center gap-1.5"
>
  ← Back
</button>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-3xl mb-5">
            💻
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Coding Practice</h1>
          <p className="text-zinc-400 text-sm mt-2">AI-generated problems • Real-time evaluation</p>

          {/* Stats bar */}
          {(attempted > 0) && (
            <div className="flex justify-center gap-6 mt-5">
              {[
                { label: "Attempted", value: attempted, color: "text-violet-400" },
                { label: "Solved", value: solved, color: "text-emerald-400" },
                { label: "Accuracy", value: `${attempted > 0 ? Math.round((solved/attempted)*100) : 0}%`, color: "text-sky-400" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Select Topic</h2>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`group border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                  category === cat.id
                    ? "bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10"
                    : "bg-zinc-900 border-zinc-800 hover:border-violet-500/40 hover:bg-zinc-800/60"
                }`}>
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-xs font-bold ${category === cat.id ? "text-violet-300" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Select Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className={`border rounded-xl py-4 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                  difficulty === d.id
                    ? d.color + " shadow-lg"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}>
                <div className={`w-2 h-2 rounded-full ${difficulty === d.id ? d.dot : "bg-zinc-600"}`} />
                {d.id}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={fetchQuestion}
          disabled={!category || !difficulty || loading}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 ${
            category && difficulty && !loading
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-violet-400 rounded-full animate-spin" />
              Generating Question…
            </span>
          ) : "Generate Question →"}
        </button>
      </div>
    </div>
  );

  // ── STEP 1: CODING ───────────────────────────────────────────────────────
  if (step === STEPS.CODING) return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={handleRestart} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back</button>
          <div className="w-px h-4 bg-zinc-700" />
          <span className="text-sm font-bold text-white truncate max-w-48">{question?.title || "Loading…"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${DIFFICULTIES.find(d=>d.id===difficulty)?.color}`}>
            {difficulty}
          </span>
          <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full font-bold">
            {category}
          </span>
          <Timer running={true} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-800">
        <div className="h-full bg-gradient-to-r from-violet-500 to-sky-500 w-1/3" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Problem Panel */}
        <div className="w-2/5 border-r border-zinc-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900">
            {["problem", "hints"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? "text-violet-400 border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === "problem" && question && (
              <>
                <h2 className="text-base font-bold text-white leading-snug">{question.title}</h2>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {question.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed">{question.statement}</p>

                {/* Sample I/O */}
                <div className="space-y-2">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <div className="text-xs font-bold text-zinc-500 mb-1.5">📥 Sample Input</div>
                    <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">{question.sample_input}</pre>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <div className="text-xs font-bold text-zinc-500 mb-1.5">📤 Sample Output</div>
                    <pre className="text-xs text-sky-300 font-mono whitespace-pre-wrap">{question.sample_output}</pre>
                  </div>
                </div>

                {/* Constraints */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs font-bold text-zinc-500 mb-1.5">📏 Constraints</div>
                  <p className="text-xs text-zinc-400 font-mono">{question.constraints}</p>
                </div>

                {/* Complexity */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <div className="text-xs text-zinc-500 mb-1">Time</div>
                    <div className="text-sm font-bold text-violet-300 font-mono">{question.time_complexity}</div>
                  </div>
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                    <div className="text-xs text-zinc-500 mb-1">Space</div>
                    <div className="text-sm font-bold text-sky-300 font-mono">{question.space_complexity}</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "hints" && (
              <div className="space-y-4">
                <div className="text-xs text-zinc-500">
                  Hints reveal progressively. Use them wisely!
                </div>

                {/* Reveal hints progressively */}
                {[1, 2, 3].map(level => (
                  <div key={level}>
                    {hintLevel >= level ? (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="text-xs font-bold text-amber-400 mb-2">💡 Hint {level}</div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {level === hintLevel ? currentHint : "Hint revealed"}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 opacity-50">
                        <div className="text-xs font-bold text-zinc-600">🔒 Hint {level}</div>
                      </div>
                    )}
                  </div>
                ))}

                {hintLevel < 3 && (
                  <button onClick={fetchHint} disabled={loadingHint}
                    className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl py-3 text-sm font-bold hover:bg-amber-500/20 transition-colors">
                    {loadingHint ? "Getting hint…" : `Reveal Hint ${hintLevel + 1}`}
                  </button>
                )}

                {hintLevel === 3 && question?.expected_approach && (
                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                    <div className="text-xs font-bold text-violet-400 mb-2">🧠 Expected Approach</div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{question.expected_approach}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <textarea
  value={code}
  onChange={e => setCode(e.target.value)}
  onKeyDown={e => {
    if (e.key === "Tab") {
      e.preventDefault();                          // stop focus jump
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = "  ";                         // 2-space indent (change to "    " for 4)

      if (start !== end) {
        // Multi-line selection → indent every selected line
        const lines = code.split("\n");
        let charCount = 0;
        const newLines = lines.map(line => {
          const lineStart = charCount;
          const lineEnd = charCount + line.length;
          charCount += line.length + 1;
          if (lineStart <= end && lineEnd >= start) return spaces + line;
          return line;
        });
        const newCode = newLines.join("\n");
        setCode(newCode);
        setTimeout(() => {
          el.selectionStart = start + spaces.length;
          el.selectionEnd = end + spaces.length * (newLines.filter((_, i) => {
            let c = 0;
            for (let j = 0; j < i; j++) c += lines[j].length + 1;
            return c <= end && c + lines[i].length >= start;
          }).length);
        }, 0);
      } else {
        // No selection → insert spaces at cursor
        const newCode = code.substring(0, start) + spaces + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = start + spaces.length;
        }, 0);
      }
    }

    // Shift+Tab → unindent
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const before = code.substring(0, start);
      const lineStart = before.lastIndexOf("\n") + 1;
      const line = code.substring(lineStart);
      if (line.startsWith("  ")) {
        const newCode = code.substring(0, lineStart) + line.substring(2);
        setCode(newCode);
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = Math.max(lineStart, start - 2);
        }, 0);
      }
    }
  }}
  className="flex-1 bg-zinc-950 text-green-300 font-mono text-sm p-5 resize-none focus:outline-none leading-relaxed"
  placeholder="Write your solution here…"
  spellCheck={false}
/>

          {/* Action bar */}
          <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-3">
            {error && <p className="text-red-400 text-xs flex-1">{error}</p>}
            <div className="flex gap-2 ml-auto">
              <button onClick={handleNextQuestion} disabled={loading}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                {loading ? "Loading…" : "Next →"}
              </button>
              <button onClick={submitCode} disabled={evaluating}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-violet-500/20 flex items-center gap-2">
                {evaluating ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating…</>
                ) : "Submit Solution ✓"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── STEP 2: RESULT ───────────────────────────────────────────────────────
  if (step === STEPS.RESULT && evaluation) return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{evaluation.score >= 80 ? "🏆" : evaluation.score >= 60 ? "✅" : "📝"}</div>
          <h1 className="text-2xl font-black text-white">Evaluation Complete</h1>
          <p className="text-zinc-400 text-sm mt-1">{question?.title}</p>
        </div>

        {/* Score Hero */}
        <div className="bg-gradient-to-br from-violet-600/15 to-sky-600/15 border border-violet-500/20 rounded-2xl p-7 mb-5 text-center">
          <div className="text-7xl font-black text-white leading-none">{evaluation.score}</div>
          <div className="text-zinc-400 text-sm mt-1">out of 100</div>
          <div className="flex justify-center mt-5">
            <span className={`text-xs font-bold px-4 py-1.5 rounded-full border ${readinessBadge[evaluation.interview_readiness] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
              {evaluation.interview_readiness}
            </span>
          </div>

          {/* Score rings */}
          <div className="flex justify-center gap-6 mt-6">
            <ScoreRing value={evaluation.correctness || 0} label="Correctness" color="#8b5cf6" />
            <ScoreRing value={evaluation.optimization || 0} label="Optimization" color="#0ea5e9" />
            <ScoreRing value={evaluation.readability || 0} label="Readability" color="#10b981" />
            <ScoreRing value={evaluation.edge_cases || 0} label="Edge Cases" color="#f59e0b" />
          </div>
        </div>

        {/* Complexity */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-500 mb-1">Time Complexity</div>
            <div className="text-base font-bold text-violet-300 font-mono">{evaluation.time_complexity}</div>
          </div>
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-500 mb-1">Space Complexity</div>
            <div className="text-base font-bold text-sky-300 font-mono">{evaluation.space_complexity}</div>
          </div>
        </div>

        {/* Summary */}
        {evaluation.summary && (
          <div className="border-l-2 border-violet-500 bg-violet-500/5 rounded-r-xl px-4 py-3 mb-5">
            <p className="text-sm text-zinc-300 italic leading-relaxed">{evaluation.summary}</p>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {evaluation.strengths?.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-3">💪 Strengths</div>
              {evaluation.strengths.map((s, i) => (
                <div key={i} className="text-xs text-emerald-300/80 mb-2 flex gap-2">
                  <span className="shrink-0">•</span><span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {evaluation.weaknesses?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="text-xs font-bold text-red-400 mb-3">⚠️ Weaknesses</div>
              {evaluation.weaknesses.map((w, i) => (
                <div key={i} className="text-xs text-red-300/80 mb-2 flex gap-2">
                  <span className="shrink-0">•</span><span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {evaluation.suggestions?.length > 0 && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-violet-400 mb-3">📚 Improvement Suggestions</div>
            {evaluation.suggestions.map((s, i) => (
              <div key={i} className="text-xs text-violet-300/80 mb-2 flex gap-2">
                <span className="font-bold shrink-0">{i + 1}.</span><span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleNextQuestion}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-violet-500/20">
            Next Question →
          </button>
          <button onClick={handleRestart}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold py-4 rounded-xl text-sm transition-colors">
            🏠 Change Topic
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
