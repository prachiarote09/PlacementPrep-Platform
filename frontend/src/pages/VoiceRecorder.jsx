import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SPRING_BOOT_URL = `${process.env.REACT_APP_API_BASE_URL}/api/user/transcription`;
const AI_URL = process.env.REACT_APP_AI_SERVICE_URL;

// ======================================================
// WAVEFORM
// ======================================================

function WaveformBars({ active }) {
  return (
    <div className="flex items-center gap-[3px] h-9">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded ${
            active ? "bg-violet-500 animate-pulse" : "bg-gray-600"
          }`}
          style={{
            height: active ? `${8 + (i % 5) * 5}px` : "8px",
            animationDuration: `${0.5 + i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ======================================================
// TIMER
// ======================================================

function useTimer(running) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function VoiceRecorder() {
  const [status, setStatus] = useState("idle");
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [loadingFinalResult, setLoadingFinalResult] = useState(false);
  const [pendingComplete, setPendingComplete] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");
  const navigate = useNavigate();
  const timer = useTimer(status === "recording");

  // ======================================================
  // START INTERVIEW
  // ======================================================

  useEffect(() => {
    setTimeout(() => startInterview(), 500);
  }, []);

  async function startInterview() {
    try {
      const skills =
        localStorage.getItem("jobDescription") || "Java Spring Boot React";
      const questionCount = parseInt(
        localStorage.getItem("questionCount") || "5",
      );
      const interviewType =
        localStorage.getItem("interviewType") || "Technical";
      const difficulty = localStorage.getItem("difficulty") || "Medium";

      setTotalQuestions(questionCount);

      console.log("STARTING INTERVIEW", {
        skills,
        questionCount,
        interviewType,
        difficulty,
      });

      const res = await fetch(`${AI_URL}/start-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "1",
          skills,
          question_count: questionCount,
          interview_type: interviewType,
          difficulty,
        }),
      });

      const data = await res.json();
      console.log("START RESPONSE:", data);

      setQuestion(
        data.question?.trim() ? data.question : "Tell me about yourself.",
      );
      setQuestionNumber(data.question_number || 1);
      setTotalQuestions(data.total_questions || questionCount);
    } catch (err) {
      console.log("START ERROR:", err);
      setQuestion("Tell me about yourself.");
    }
  }

  // ======================================================
  // START RECORDING
  // ======================================================
  const recordingStartRef = useRef(null);
  async function startRecording() {
    try {
      setFeedback("");
      setScore(null);
      setStrengths("");
      setImprovements("");
      setTranscript("");
      setErrorMsg("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        stream.getTracks().forEach((track) => track.stop());
        uploadAudio(blob);
      };
      recordingStartRef.current = Date.now(); 
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (err) {
      console.log(err);
      setErrorMsg("Microphone access denied.");
      setStatus("error");
    }
  }

  // ======================================================
  // STOP RECORDING
  // ======================================================

  function stopRecording() {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  }

  // ======================================================
  // UPLOAD AUDIO
  // ======================================================

 async function uploadAudio(blob) {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const token = localStorage.getItem("token");

      const res = await fetch(`${SPRING_BOOT_URL}/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      console.log("TRANSCRIPT:", data);

      const cleanTranscript = (data.transcript || "").trim();

      if (cleanTranscript.length < 10) {
  setErrorMsg("We couldn't hear a clear answer. Please try recording again.");
  setStatus("idle");  // ← just "idle" not "error"
  return;
}

      setTranscript(cleanTranscript);
      setMeta({
        language: data.language || "en",
        durationSeconds: data.duration_seconds || 0,
      });
      setStatus("done");
    } catch (err) {
      console.log(err);
      setErrorMsg("Transcription failed.");
      setStatus("error");
    }
  }
  async function fetchFinalResult() {
    setLoadingFinalResult(true);
    try {
      const resultRes = await fetch(`${AI_URL}/final-result/1`);
      const resultData = await resultRes.json();
      setFinalResult(resultData);
      // ── SAVE TO SPRING BOOT ──
    const token = localStorage.getItem("token");
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/dashboard/save-interview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interviewType: localStorage.getItem("interviewType") || "Technical",
        difficulty: localStorage.getItem("difficulty") || "Medium",
        totalQuestions: parseInt(localStorage.getItem("questionCount") || "5"),
        averageScore: resultData.average_score,
        performance: resultData.performance,
      }),
    });
    } catch (e) {
      console.log("Final result error:", e);
    }
    setLoadingFinalResult(false);
  }
  // ======================================================
  // ANALYSE ANSWER
  // ======================================================

  async function analyseAnswer() {
    
    try {
      setStatus("processing");

      const res = await fetch(`${AI_URL}/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "1", answer: transcript }),
      });

      const data = await res.json();
      console.log("AI RESPONSE:", data);

      setFeedback(data.feedback || "No feedback");
      setScore(data.score ?? 0);
      setStrengths(data.strengths || "");
      setImprovements(data.improvements || "");
      setQuestionNumber(data.question_number || questionNumber);

      if (data.interview_complete) {
  setStatus("idle");
  setPendingComplete(true); 
  return;
}

      setQuestion(data.next_question || "Tell me about yourself.");
      setTranscript("");
      setStatus("idle");
    } catch (err) {
      console.log(err);
      setFeedback("AI evaluation failed.");
      setScore(50);
      setStatus("idle");
    }
  }
  
  // ======================================================
  // RESET
  // ======================================================

  function reset() {
    setStatus("idle");
    setTranscript("");
    setMeta(null);
    setErrorMsg("");
  }

  // ======================================================
  // DERIVED STATE
  // ======================================================

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isDone = status === "done";
  const isError = status === "error";

  // ======================================================
  // INTERVIEW COMPLETE SCREEN
  // ======================================================

  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-[#16161f] border border-[#2a2a38] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Interview Complete!
            </h1>
            <p className="text-gray-400">
              You answered all {totalQuestions} questions
            </p>
          </div>

          {loadingFinalResult && (
            <div className="text-yellow-400 text-center py-6">
              Generating your report...
            </div>
          )}

          {finalResult && (
            <>
              {/* Score Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0f0f17] border border-[#2a2a38] rounded-2xl p-4 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Average Score
                  </p>
                  <p
                    className={`text-4xl font-bold ${
                      finalResult.average_score >= 70
                        ? "text-green-400"
                        : finalResult.average_score >= 40
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {finalResult.average_score}
                  </p>
                </div>
                <div className="bg-[#0f0f17] border border-[#2a2a38] rounded-2xl p-4 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                    Performance
                  </p>
                  <p
                    className={`text-2xl font-bold mt-2 ${
                      finalResult.performance === "Good"
                        ? "text-green-400"
                        : finalResult.performance === "Average"
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {finalResult.performance}
                  </p>
                </div>
              </div>

              {/* Per-question scores */}
              <div className="bg-[#0f0f17] border border-[#2a2a38] rounded-2xl p-5 mb-6">
                <h3 className="text-white font-semibold mb-3">
                  Question Breakdown
                </h3>
                <div className="space-y-2">
                  {finalResult.questions_asked.map((q, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <p className="text-gray-400 text-sm truncate flex-1 mr-4">
                        Q{i + 1}: {q}
                      </p>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                          (finalResult.individual_scores[i] || 0) >= 70
                            ? "bg-green-900/40 text-green-400"
                            : (finalResult.individual_scores[i] || 0) >= 40
                              ? "bg-yellow-900/40 text-yellow-400"
                              : "bg-red-900/40 text-red-400"
                        }`}
                      >
                        {finalResult.individual_scores[i] || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall AI Feedback */}
              <div className="bg-violet-950/30 border border-violet-700 rounded-2xl p-5 mb-6">
                <h3 className="text-violet-400 font-semibold mb-2">
                  📋 Overall Feedback
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  {finalResult.overall_feedback}
                </p>
              </div>
            </>
          )}

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-lg hover:scale-[1.01] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center p-6">
         <button
  onClick={() => navigate("/dashboard")}
  className="absolute top-6 left-6 text-sm bg-[#1a1a24] border border-[#2f2f42] text-gray-300 px-4 py-2 rounded-lg hover:border-violet-500 hover:text-white transition-colors flex items-center gap-1.5"
>
  ← Back
</button>
      <div className="w-full max-w-3xl bg-[#16161f] border border-[#2a2a38] rounded-3xl p-8 shadow-2xl">
        {/* PROGRESS */}
        {!pendingComplete && (
  <>        <div className="flex items-center justify-between mb-5">
          <span className="text-gray-400 text-sm">
            Question{" "}
            <span className="text-violet-400 font-bold">{questionNumber}</span>{" "}
            of{" "}
            <span className="text-violet-400 font-bold">{totalQuestions}</span>
          </span>
          <div className="flex-1 mx-4 h-1.5 bg-[#2a2a38] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{
                width: `${((questionNumber - 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION */}
        <div className="bg-[#1e1e2e] rounded-2xl p-5 mb-6 border border-[#2f2f45]">
          <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Current Question
          </h2>
          <p className="text-gray-100 text-xl leading-relaxed min-h-[60px]">
            {question || "Loading question..."}
          </p>
        </div>

        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-4xl font-bold text-white mb-1">
            Voice Interview
          </h1>
          <p className="text-gray-400">
            Record your answer and let AI evaluate it.
          </p>
        </div>

        {/* RECORDER */}
        <div className="bg-[#0f0f17] rounded-2xl p-6 border border-[#232334]">
          <div className="flex justify-between items-center mb-6">
            <WaveformBars active={isRecording} />
            <span className="text-violet-400 text-4xl font-semibold">
              {timer}
            </span>
          </div>
              {/* Show error even in idle state */}
{errorMsg && !isRecording && (
  <div className="mb-4 bg-red-950/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
    {errorMsg}
  </div>
)}
          {!isProcessing && !isDone &&  (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-5 rounded-xl text-white font-bold text-xl transition-all duration-300 ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : "bg-gradient-to-r from-violet-500 to-indigo-500 hover:scale-[1.01]"
              }`}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          )}

          {isProcessing && (
            <div className="text-yellow-400 text-center text-xl">
              Processing...
            </div>
          )}
        </div>

        {/* TRANSCRIPT */}
        {isDone && (
          <div className="mt-6">
            <h3 className="text-white text-2xl font-semibold mb-3">
              Transcript
            </h3>
            <div className="bg-[#0f0f17] border border-[#2a2a38] rounded-2xl p-5 text-gray-200 text-lg">
              {transcript}
            </div>

            {meta && (
              <div className="flex gap-3 mt-3">
                <span className="bg-violet-900/40 text-violet-300 px-3 py-1 rounded-lg text-sm">
                  {(meta.language || "en").toUpperCase()}
                </span>
                <span className="bg-violet-900/40 text-violet-300 px-3 py-1 rounded-lg text-sm">
                  {meta.durationSeconds}s
                </span>
              </div>
            )}

            <div className="flex gap-4 mt-5">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl border border-[#2a2a38] text-gray-300 hover:bg-[#1f1f2d]"
              >
                Record Again
              </button>
              <button
                onClick={analyseAnswer}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold hover:scale-[1.01] transition"
              >
                Analyse Answer →
              </button>
            </div>
          </div>
        )}
</>
)}
        {/* FEEDBACK */}
        {feedback && !interviewComplete && (
          <div className="mt-6 bg-green-950/40 border border-green-700 rounded-2xl p-5">
            <h2 className="text-green-400 text-3xl font-bold mb-2">
              Score: {score}
            </h2>
            <p className="text-green-200 text-lg mb-4">{feedback}</p>

            {strengths && (
              <div className="mb-3">
                <h3 className="text-green-400 font-semibold mb-1">
                  ✅ Strengths
                </h3>
                <p className="text-green-300 text-sm whitespace-pre-line">
                  {strengths}
                </p>
              </div>
            )}

            {improvements && (
              <div>
                <h3 className="text-yellow-400 font-semibold mb-1">
                  ⚡ Improvements
                </h3>
                <p className="text-yellow-300 text-sm whitespace-pre-line">
                  {improvements}
                </p>
              </div>
            )}
            {pendingComplete && (
      <button
        onClick={() => {
          setInterviewComplete(true);
          fetchFinalResult();
        }}
        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold hover:scale-[1.01] transition"
      >
        View Interview Analysis →
      </button>
    )}
          </div>
        )}

        {/* ERROR */}
        {isError && (
          <div className="mt-6 bg-red-950/40 border border-red-700 rounded-2xl p-4 text-red-300">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
