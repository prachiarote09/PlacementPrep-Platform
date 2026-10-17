import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from '../api/axios';
const SPRING_BOOT_URL = process.env.REACT_APP_API_BASE_URL;
export default function ResetPassword() {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${SPRING_BOOT_URL}/api/auth/forgot-password`,
        { email }
      );
      setMessage(res.data);
      setIsError(false);
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data || "Failed to send OTP");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${SPRING_BOOT_URL}/api/auth/verify-otp`,
        { email, otp }
      );
      setMessage(res.data);
      setIsError(false);
      setStep(3);
    } catch (error) {
      setMessage(error.response?.data || "Invalid OTP");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${SPRING_BOOT_URL}/api/auth/reset-password`,
        { email, otp, newPassword }
      );
      setMessage(res.data);
      setIsError(false);

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setMessage(error.response?.data || "Password reset failed");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Email", "Verify OTP", "New Password"];

  return (
    <div className="min-h-screen flex bg-[#0f0f17]">

      {/* ── LEFT — HERO PANEL ── */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-center px-16 py-12 overflow-hidden bg-gradient-to-br from-[#15121f] to-[#0f0f17] border-r border-[#232334]">

        {/* Ambient glow orbs */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-violet-500/25 blur-[80px] animate-[float1_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -right-12 w-[360px] h-[360px] rounded-full bg-sky-500/20 blur-[80px] animate-[float2_11s_ease-in-out_infinite]" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-10 opacity-0 animate-[fadeUp_0.6s_ease-out_0.1s_forwards]">
            <span className="text-2xl">🚀</span>
            <span className="font-extrabold text-lg text-white">PlacementPrep</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight opacity-0 animate-[fadeUp_0.6s_ease-out_0.25s_forwards]">
            Forgot your password?<br />
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              No problem.
            </span>
          </h1>

          <p className="text-gray-400 text-base leading-relaxed mb-10 opacity-0 animate-[fadeUp_0.6s_ease-out_0.4s_forwards]">
            Verify your email with a one-time code and set a new
            password in seconds — then get straight back to your
            placement prep.
          </p>

          {/* Step indicator — signature element for this page */}
          <div className="flex items-center gap-3 opacity-0 animate-[fadeUp_0.6s_ease-out_0.55s_forwards]">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done
                        ? "bg-violet-500 text-white"
                        : active
                        ? "bg-violet-500/20 border-2 border-violet-500 text-violet-300"
                        : "bg-[#1a1a24] border border-[#2f2f42] text-gray-500"
                    }`}>
                      {done ? "✓" : num}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-500"}`}>
                      {label}
                    </span>
                  </div>
                  {num < 3 && <div className="w-6 h-px bg-[#2f2f42]" />}
                </div>
              );
            })}
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
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; animation-delay: 0ms !important; }
          }
        `}</style>
      </div>

      {/* ── RIGHT — FORM PANEL ── */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex items-center justify-center px-8 py-10">
        <div className="w-full max-w-[360px]">

          <div className="mb-8 opacity-0 animate-[fadeUp_0.5s_ease-out_0.3s_forwards]">
            <h2 className="text-3xl font-extrabold text-white mb-2">Reset password</h2>
            <p className="text-gray-400 text-sm">
              {step === 1 && "Enter your email to receive a one-time code"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Choose a new password for your account"}
            </p>
          </div>

          <div className="flex flex-col gap-4 opacity-0 animate-[fadeUp_0.5s_ease-out_0.45s_forwards]">

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1.5">Email ID</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <button
                  onClick={handleSendOtp}
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
                      Sending...
                    </>
                  ) : "Send OTP"}
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1.5">OTP</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors tracking-widest"
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
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
                      Verifying...
                    </>
                  ) : "Verify OTP"}
                </button>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-gray-400 text-xs font-semibold mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a24] border border-[#2f2f42] text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <button
                  onClick={handleResetPassword}
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
                      Resetting...
                    </>
                  ) : "Reset Password"}
                </button>
              </>
            )}

            {/* Message */}
            {message && (
              <div className={`rounded-lg px-3.5 py-2.5 text-sm border ${
                isError
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-green-500/10 border-green-500/30 text-green-400"
              }`}>
                {message}
              </div>
            )}

            <p className="text-center text-gray-400 text-sm mt-2">
              <Link to="/login" className="text-violet-400 font-semibold hover:underline">
                ← Back to Login
              </Link>
            </p>

          </div>
        </div>
      </div>

    </div>
  );
}
