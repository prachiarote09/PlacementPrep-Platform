import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InterviewSetup() {
  const navigate = useNavigate();
  
  const [jd, setJd] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");

  const handleStart = () => {
    if (!jd.trim()) {
      alert("Please enter a Job Description or Skills");
      return;
    }

    localStorage.setItem("jobDescription", jd);
    localStorage.setItem("questionCount", questionCount.toString());
    localStorage.setItem("interviewType", interviewType);
    localStorage.setItem("difficulty", difficulty);

    navigate("/mock-interview");
  };

  return (
    <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-[#16161f] border border-[#2a2a38] rounded-3xl p-8 shadow-2xl">
      <button
  onClick={() => navigate("/dashboard")}
  className="absolute top-6 left-6 text-sm bg-[#1a1a24] border border-[#2f2f42] text-gray-300 px-4 py-2 rounded-lg hover:border-violet-500 hover:text-white transition-colors flex items-center gap-1.5"
>
  ← Back
</button>
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Interview Setup</h1>
          <p className="text-gray-400">Customise your AI mock interview</p>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3">
            Job Description / Skills
          </label>
          <textarea
            rows={5}
            placeholder="e.g. Java, Spring Boot, React, REST APIs, System Design..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            className="w-full rounded-xl bg-[#0f0f17] border border-[#2a2a38] text-white p-4 outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder-gray-600"
          />
        </div>

        {/* Question Count */}
        <div className="mb-7">
          <h2 className="text-white font-semibold mb-4">Question Count</h2>
          <div className="grid grid-cols-3 gap-3">
            {[5, 10, 15].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  questionCount === count
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-[#0f0f17] border border-[#2a2a38] text-gray-400 hover:border-violet-500/50 hover:text-gray-200"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Interview Type */}
        <div className="mb-7">
          <h2 className="text-white font-semibold mb-4">Interview Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {["Technical", "HR", "Mixed"].map((type) => (
              <button
                key={type}
                onClick={() => setInterviewType(type)}
                className={`py-3 rounded-xl font-semibold transition-all duration-200 ${
                  interviewType === type
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-[#0f0f17] border border-[#2a2a38] text-gray-400 hover:border-violet-500/50 hover:text-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <h2 className="text-white font-semibold mb-4">Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Easy", color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
              { label: "Medium", color: "from-violet-500 to-indigo-500", shadow: "shadow-violet-500/20" },
              { label: "Hard", color: "from-rose-500 to-red-500", shadow: "shadow-rose-500/20" },
            ].map(({ label, color, shadow }) => (
              <button
                key={label}
                onClick={() => setDifficulty(label)}
                className={`py-3 rounded-xl font-semibold transition-all duration-200 ${
                  difficulty === label
                    ? `bg-gradient-to-r ${color} text-white shadow-lg ${shadow}`
                    : "bg-[#0f0f17] border border-[#2a2a38] text-gray-400 hover:border-violet-500/50 hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#0f0f17] border border-[#2a2a38] rounded-2xl p-5 mb-8">
          <h3 className="text-white font-semibold mb-3">Interview Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Questions</p>
              <p className="text-violet-400 text-xl font-bold">{questionCount}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Type</p>
              <p className="text-violet-400 text-xl font-bold">{interviewType}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Difficulty</p>
              <p
                className={`text-xl font-bold ${
                  difficulty === "Easy"
                    ? "text-emerald-400"
                    : difficulty === "Hard"
                    ? "text-rose-400"
                    : "text-violet-400"
                }`}
              >
                {difficulty}
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-lg font-bold hover:scale-[1.01] active:scale-[0.99] transition shadow-xl shadow-violet-500/20"
        >
          Start Interview →
        </button>

      </div>
    </div>
  );
}