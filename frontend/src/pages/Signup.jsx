import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080/auth/signup";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // ✅ Show success message
      setMessage("🎉 Account created successfully! Redirecting to login...");
      setIsSuccess(true);

      // ✅ Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login", { state: { message: "Account created! Please login." } });
      }, 2000);

    } catch (err) {
      setIsSuccess(false);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f17]">

      {/* ── LEFT — HERO PANEL ── */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-center px-16 py-12 overflow-hidden bg-gradient-to-br from-[#15121f] to-[#0f0f17] border-r border-[#232334]">

        {/* Ambient glow orbs */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-violet-500/25 blur-[80px] animate-[float1_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -right-12 w-[360px] h-[360px] rounded-full bg-sky-500/20 blur-[80px] animate-[float2_11s_ease-in-out_infinite]" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-10">
            <span className="text-2xl">🚀</span>
            <span className="font-extrabold text-lg text-white">PlacementPrep</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Your placement<br />
            prep starts{" "}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              right here.
            </span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Create your free account and get instant access to AI-generated
            aptitude tests, coding problems, and voice mock interviews —
            with a readiness score that updates as you grow.
          </p>

          <div className="flex gap-7">
            {[
              { label: "Aptitude", icon: "🧠" },
              { label: "Coding", icon: "💻" },
              { label: "Interview", icon: "🎤" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, 30px); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-20px, -25px); }
          }
        `}</style>
      </div>

      {/* ── RIGHT — FORM PANEL ── */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex items-center justify-center px-8 py-10">
        <div className="w-full max-w-[360px]">

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">Create account</h2>
            <p className="text-gray-400 text-sm">Start preparing for placements today</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">

            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1.5">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-semibold mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {message && (
              <div className={`rounded-lg px-3.5 py-2.5 text-sm border ${
                isSuccess
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold mt-1.5 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-opacity ${
                loading
                  ? "bg-violet-700/70 cursor-default"
                  : "bg-gradient-to-r from-violet-500 to-indigo-500 hover:opacity-90"
              }`}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : "Sign Up →"}
            </button>

            <p className="text-center text-gray-400 text-sm mt-2">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-violet-400 font-semibold cursor-pointer hover:underline"
              >
                Login
              </span>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
}