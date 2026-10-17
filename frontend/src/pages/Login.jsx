import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/login`;
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();

      // ✅ Store JWT
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name);

      // ✅ Redirect
      window.location.href = "/dashboard";

    } catch (err) {
      setError(err.message);
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
            Walk into your<br />
            interview{" "}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              already prepared.
            </span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Practice aptitude, coding, and voice-based mock interviews —
            then track your real readiness with AI-driven analytics built
            for placement season.
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
            <h2 className="text-3xl font-extrabold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400 text-sm">Log in to continue your prep journey</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

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

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="text-right -mt-1">
              <span
                onClick={() => navigate("/reset-password")}
                className="text-violet-400 text-sm font-medium cursor-pointer hover:underline"
              >
                Forgot password?
              </span>
            </div>

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
                  Logging in...
                </>
              ) : "Login →"}
            </button>

            <p className="text-center text-gray-400 text-sm mt-2">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-violet-400 font-semibold cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
}
