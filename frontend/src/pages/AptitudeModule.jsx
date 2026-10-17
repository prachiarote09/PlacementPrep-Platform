import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = {
  general: {
    label: "General Aptitude",
    icon: "🧠",
    desc: "Quantitative, logical & verbal reasoning",
    topics: [
      { id: "quantitative", label: "Quantitative Aptitude", icon: "📐" },
      { id: "logical", label: "Logical Reasoning", icon: "🔍" },
      { id: "probability", label: "Probability", icon: "🎲" },
      { id: "time_work", label: "Time & Work", icon: "⏱️" },
      { id: "verbal", label: "Verbal Ability", icon: "📝" },
      { id: "data_interp", label: "Data Interpretation", icon: "📊" },
    ],
  },
  technical: {
    label: "Technical Aptitude",
    icon: "💻",
    desc: "CS fundamentals & modern tech stacks",
    topics: [
      { id: "java", label: "Java", icon: "☕" },
      { id: "dbms", label: "DBMS", icon: "🗄️" },
      { id: "sql", label: "SQL", icon: "🔢" },
      { id: "oops", label: "OOPs", icon: "🧩" },
      { id: "os", label: "Operating System", icon: "🖥️" },
      { id: "cn", label: "Computer Networks", icon: "🌐" },
      { id: "springboot", label: "Spring Boot", icon: "🍃" },
      { id: "react", label: "React", icon: "⚛️" },
    ],
  },
};

const STEPS = { CATEGORY: 0, TOPIC: 1, QUIZ: 2, RESULT: 3 };
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-5 py-16">
      <div className="w-12 h-12 rounded-full border-[3px] border-[#2a2a38] border-t-violet-500 animate-spin" />
      <p className="text-gray-400 text-sm">Generating your quiz with AI…</p>
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 text-xs">Question {current} of {total}</span>
        <span className="text-violet-400 text-xs font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#2a2a38] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AptitudeModule() {
  const [step, setStep] = useState(STEPS.CATEGORY);
  const [category, setCategory] = useState(null);
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const navigate = useNavigate();

  const topicLabel = topic
    ? (CATEGORIES[category]?.topics.find(t => t.id === topic)?.label || topic)
    : "";

  async function fetchQuestions(cat, topicId) {
    setLoading(true);
    setError(null);
    const topicName = CATEGORIES[cat].topics.find(t => t.id === topicId)?.label || topicId;
    const catName = CATEGORIES[cat].label;

    try {
      const res = await fetch(`${BASE_URL}/aptitude/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catName, topic: topicName }),
      });
      const raw = await res.text();
      const data = JSON.parse(raw);

      if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0)
        throw new Error(data.error || "Invalid response");
      setQuestions(data.questions);
      setStep(STEPS.QUIZ);
    } catch (e) {
      setError("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeedback(ans) {
    setLoadingFeedback(true);
    const topicName = CATEGORIES[category].topics.find(t => t.id === topic)?.label || topic;
    const score = ans.filter(a => a.correct).length;
    const wrongAnswers = ans.filter(a => !a.correct);

    try {
      const res = await fetch(`${BASE_URL}/aptitude/generate-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicName,
          score: score,
          total: ans.length,
          wrong_questions: wrongAnswers.map(a => a.question),
          correct_answers: wrongAnswers.map(a => a.correctAnswer),
        }),
      });
      const data = await res.json();
      if (data.success && data.feedback) setFeedback(data.feedback);
      else setFeedback(null);

      const token = localStorage.getItem("token");
      await fetch("http://localhost:8080/api/dashboard/save-aptitude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: CATEGORIES[category]?.label || category,
          topic: topicName,
          score: Math.round((score / ans.length) * 100),
          totalQuestions: ans.length,
          correctAnswers: score,
        }),
      });
    } catch (e) {
      setFeedback(null);
    } finally {
      setLoadingFeedback(false);
    }
  }

  function handleSelectCategory(cat) {
    setCategory(cat);
    setStep(STEPS.TOPIC);
  }

  function handleSelectTopic(topicId) {
    setTopic(topicId);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setFeedback(null);
    fetchQuestions(category, topicId);
  }

  function handleNext() {
    if (selected === null) return;
    const q = questions[current];
    const isCorrect = selected === q.correct;
    const newAnswers = [...answers, {
      question: q.question,
      selected,
      correctAnswer: q.correct,
      correct: isCorrect,
    }];
    setAnswers(newAnswers);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setStep(STEPS.RESULT);
      fetchFeedback(newAnswers);
    }
  }

  function handleReveal() {
    setRevealed(true);
  }

  function handleRetry() {
    setStep(STEPS.TOPIC);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setFeedback(null);
  }

  function handleRestart() {
    setStep(STEPS.CATEGORY);
    setCategory(null);
    setTopic(null);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setFeedback(null);
  }

  const score = answers.filter(a => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((score / answers.length) * 100) : 0;

  const readinessStyle = {
    "Beginner": "bg-orange-900/40 text-orange-300",
    "Intermediate": "bg-sky-900/40 text-sky-300",
    "Placement-Ready": "bg-emerald-900/40 text-emerald-300",
  };

  return (
    <div className="min-h-screen bg-[#0f0f17] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <button
  onClick={() => navigate("/dashboard")}
  className="absolute top-6 left-6 text-sm bg-[#1a1a24] border border-[#2f2f42] text-gray-300 px-4 py-2 rounded-lg hover:border-violet-500 hover:text-white transition-colors flex items-center gap-1.5"
>
  ← Back
</button>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Aptitude Prep</h1>
          <p className="text-gray-400 text-sm mt-1.5">AI-powered quiz for placement success</p>

          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mt-5 text-sm">
            {["Category", "Topic", "Quiz", "Results"].map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`font-semibold ${step >= i ? "text-violet-400" : "text-gray-600"}`}>
                  {label}
                </span>
                {i < 3 && <span className="text-gray-600">›</span>}
              </span>
            ))}
          </div>
        </div>

        {/* STEP 0: Category Selection */}
        {step === STEPS.CATEGORY && (
          <div>
            <h2 className="text-center text-gray-200 text-lg font-semibold mb-6">
              Choose your preparation type
            </h2>
            <div className="grid grid-cols-2 gap-5">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => handleSelectCategory(key)}
                  className="bg-[#16161f] border-2 border-[#2a2a38] rounded-3xl p-9 text-center flex flex-col items-center gap-3.5 transition-all duration-200 hover:border-violet-500 hover:bg-[#1c1c2a] hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10"
                >
                  <div className="text-5xl">{cat.icon}</div>
                  <div>
                    <div className="font-bold text-lg text-white">{cat.label}</div>
                    <div className="text-gray-400 text-sm mt-1">{cat.desc}</div>
                  </div>
                  <div className="text-violet-400 text-sm font-semibold">
                    {cat.topics.length} topics →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Topic Selection */}
        {step === STEPS.TOPIC && category && (
          <div>
            <button
              onClick={() => setStep(STEPS.CATEGORY)}
              className="text-violet-400 text-sm font-semibold mb-5 flex items-center gap-1.5 hover:text-violet-300 transition"
            >
              ← Back
            </button>
            <h2 className="text-lg font-semibold text-gray-200 mb-1.5">
              {CATEGORIES[category].icon} {CATEGORIES[category].label}
            </h2>
            <p className="text-gray-400 text-sm mb-7">
              Select a topic to start your AI-generated quiz
            </p>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES[category].topics.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopic(t.id)}
                  className="bg-[#16161f] border border-[#2a2a38] rounded-2xl px-5 py-5 text-left flex items-center gap-4 transition-all duration-200 hover:border-violet-500 hover:bg-[#1c1c2a] hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <span className="text-2xl w-11 h-11 shrink-0 rounded-xl bg-[#0f0f17] border border-[#2a2a38] flex items-center justify-center">
                    {t.icon}
                  </span>
                  <span className="font-semibold text-[15px] text-gray-100">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <Spinner />}

        {/* Error State */}
        {error && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-400 mb-5">{error}</p>
            <button
              onClick={() => handleSelectTopic(topic)}
              className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl px-7 py-3 font-semibold hover:scale-[1.02] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* STEP 2: Quiz */}
        {step === STEPS.QUIZ && !loading && questions.length > 0 && (
          <div className="bg-[#16161f] border border-[#2a2a38] rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="bg-violet-950/60 text-violet-300 text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                {topicLabel.toUpperCase()}
              </span>
              <span className="text-gray-500 text-sm font-medium">
                Score: {answers.filter(a => a.correct).length}/{answers.length}
              </span>
            </div>

            <ProgressBar current={current + 1} total={questions.length} />

            <h3 className="text-gray-100 text-lg font-semibold leading-relaxed mb-6">
              {questions[current].question}
            </h3>

            <div className="flex flex-col gap-3">
              {questions[current].options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = opt === questions[current].correct;

                let classes = "bg-[#0f0f17] border-[#2a2a38] text-gray-300";
                if (revealed) {
                  if (isCorrect) classes = "bg-emerald-950/40 border-emerald-600 text-emerald-300";
                  else if (isSelected && !isCorrect) classes = "bg-red-950/40 border-red-600 text-red-300";
                } else if (isSelected) {
                  classes = "bg-violet-950/50 border-violet-500 text-violet-200";
                }

                return (
                  <button
                    key={i}
                    onClick={() => { if (!revealed) setSelected(opt); }}
                    className={`border-2 rounded-xl px-5 py-3.5 text-left text-sm transition-all duration-200 flex items-center justify-between ${classes} ${
                      revealed ? "cursor-default" : "cursor-pointer"
                    } ${isSelected || (revealed && isCorrect) ? "font-semibold" : "font-normal"}`}
                  >
                    <span>{opt}</span>
                    {revealed && isCorrect && <span className="text-lg">✅</span>}
                    {revealed && isSelected && !isCorrect && <span className="text-lg">❌</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              {selected && !revealed && (
                <button
                  onClick={handleReveal}
                  className="flex-1 bg-[#1e1e2e] text-gray-300 rounded-xl py-3.5 font-semibold text-sm hover:bg-[#262638] transition"
                >
                  Reveal Answer
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!selected}
                className={`flex-[2] rounded-xl py-3.5 font-bold text-[15px] transition-all duration-200 ${
                  selected
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:scale-[1.01]"
                    : "bg-[#2a2a38] text-gray-600 cursor-not-allowed"
                }`}
              >
                {current + 1 === questions.length ? "Finish Quiz 🎉" : "Next Question →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === STEPS.RESULT && (
          <div>
            {/* Score Card */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl px-8 py-9 mb-6 text-center text-white shadow-2xl shadow-violet-900/30">
              <div className="text-6xl font-extrabold leading-none">{score}/{questions.length}</div>
              <div className="text-lg mt-2 opacity-90">Quiz Complete! 🎉</div>
              <div className="flex justify-center gap-10 mt-7">
                {[
                  { label: "Accuracy", value: `${accuracy}%` },
                  { label: "Correct", value: score },
                  { label: "Wrong", value: questions.length - score },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-80 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Review */}
            <details className="mb-6 group">
              <summary className="bg-[#16161f] border border-[#2a2a38] rounded-2xl px-5 py-3.5 cursor-pointer font-semibold text-[15px] text-gray-200 list-none flex items-center justify-between hover:bg-[#1c1c2a] transition">
                <span>📋 Review Answers ({questions.length} questions)</span>
                <span className="text-gray-500 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <div className="mt-3 flex flex-col gap-2.5">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    className={`bg-[#16161f] border rounded-xl px-4.5 py-3.5 ${
                      a.correct ? "border-emerald-700/60" : "border-red-700/60"
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-1.5">Q{i + 1}</div>
                    <div className="text-sm text-gray-200 mb-2 font-medium">{a.question}</div>
                    <div className="text-sm">
                      <span className={a.correct ? "text-emerald-400" : "text-red-400"}>
                        {a.correct ? "✅" : "❌"} Your answer: {a.selected}
                      </span>
                      {!a.correct && (
                        <div className="text-emerald-400 mt-1">✅ Correct: {a.correctAnswer}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* AI Feedback */}
            <div className="bg-[#16161f] border border-[#2a2a38] rounded-3xl p-7 mb-6">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-2xl">🤖</span>
                <h3 className="text-white text-lg font-bold">AI Feedback</h3>
                {loadingFeedback && (
                  <div className="w-4 h-4 rounded-full border-2 border-[#2a2a38] border-t-violet-500 animate-spin ml-auto" />
                )}
              </div>

              {loadingFeedback && (
                <p className="text-gray-500 text-sm">Analyzing your performance…</p>
              )}

              {feedback && !loadingFeedback && (
                <div className="flex flex-col gap-5">
                  {feedback.summary && (
                    <div className="bg-[#0f0f17] border-l-4 border-violet-500 rounded-r-lg px-4 py-3 text-gray-300 text-sm italic">
                      {feedback.summary}
                    </div>
                  )}

                  {feedback.readiness && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-400 text-sm font-semibold">Placement Readiness:</span>
                      <span className={`${readinessStyle[feedback.readiness] || "bg-violet-950/50 text-violet-300"} font-bold text-xs px-3.5 py-1 rounded-full`}>
                        {feedback.readiness}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {feedback.strengths?.length > 0 && (
                      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl px-4.5 py-4">
                        <div className="font-bold text-xs text-emerald-400 mb-2.5">💪 Strengths</div>
                        {feedback.strengths.map((s, i) => (
                          <div key={i} className="text-xs text-emerald-200 mb-1.5 flex gap-2">
                            <span>•</span><span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {feedback.weakAreas?.length > 0 && (
                      <div className="bg-red-950/30 border border-red-800/40 rounded-2xl px-4.5 py-4">
                        <div className="font-bold text-xs text-red-400 mb-2.5">⚠️ Weak Areas</div>
                        {feedback.weakAreas.map((w, i) => (
                          <div key={i} className="text-xs text-red-200 mb-1.5 flex gap-2">
                            <span>•</span><span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {feedback.suggestions?.length > 0 && (
                    <div className="bg-violet-950/30 border border-violet-800/40 rounded-2xl px-4.5 py-4">
                      <div className="font-bold text-xs text-violet-300 mb-2.5">📚 Improvement Suggestions</div>
                      {feedback.suggestions.map((s, i) => (
                        <div key={i} className="text-xs text-violet-200 mb-1.5 flex gap-2">
                          <span className="font-bold">{i + 1}.</span><span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!feedback && !loadingFeedback && (
                <p className="text-red-400 text-sm">Unable to generate feedback. Check API access.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3.5">
              <button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl py-4 font-bold text-[15px] hover:scale-[1.01] transition"
              >
                🔄 Retry Topic
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 bg-[#16161f] border border-[#2a2a38] text-gray-300 rounded-2xl py-4 font-semibold text-[15px] hover:bg-[#1c1c2a] transition"
              >
                🏠 New Category
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
