import { useState } from "react";
import { ShieldCheck, Lock, Sparkles, FileSearch, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { dashboardPathForRole } from "../services/authService";

export default function MediNexusLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("patient");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (mode === "register") {
        user = await register({ fullName, email, password, role, specialty });
      } else {
        user = await login({ email, password });
      }
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans">
      {/* LEFT PANEL */}
      <div className="relative lg:w-1/2 bg-[#0b1220] text-white px-5 sm:px-8 md:px-12 py-8 sm:py-12 lg:py-16 flex flex-col justify-between overflow-hidden">
        {/* subtle background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 sm:mb-10 lg:mb-14">
            <div className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-xl bg-teal-500 flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg shadow-teal-500/20">
              M+
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">MediNexus</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight max-w-xl">
            Healthcare guidance,
            <br />
            connected with real doctors
          </h1>

          <p className="mt-4 sm:mt-6 text-slate-300 text-base sm:text-lg max-w-md leading-relaxed">
            Book consultations, understand medical reports, and use
            AI-powered tools with clinician oversight.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative mt-8 sm:mt-10 lg:mt-14 space-y-3 sm:space-y-4 max-w-xl">
          <FeatureRow
            icon={<Sparkles className="h-5 w-5" />}
            iconBg="bg-teal-500"
            title="AI Symptom Triage"
            subtitle="Urgency and red-flag screening"
            cardBg="bg-white/5"
          />
          <FeatureRow
            icon={<FileSearch className="h-5 w-5" />}
            iconBg="bg-blue-600"
            title="Report Intelligence"
            subtitle="Simple summaries with evidence"
            cardBg="bg-blue-500/10"
          />
          <FeatureRow
            icon={<Pill className="h-5 w-5" />}
            iconBg="bg-orange-500"
            title="Prescription Safety"
            subtitle="Interaction and allergy checks"
            cardBg="bg-white/5"
          />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:w-1/2 flex items-center justify-center px-4 sm:px-8 md:px-12 py-10 sm:py-14 bg-white">
        <div className="w-full max-w-md border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 md:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Secure access for patients, doctors and administrators
          </p>

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            {mode === "register" && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-slate-800 mb-2">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-slate-800 mb-2">
                    I am a
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {role === "doctor" && (
                  <div>
                    <label htmlFor="specialty" className="block text-sm font-semibold text-slate-800 mb-2">
                      Specialty
                    </label>
                    <input
                      id="specialty"
                      type="text"
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Remember this device
              </label>
              <button
                type="button"
                className="font-semibold text-blue-700 hover:text-blue-800 text-xs sm:text-sm"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 sm:py-3 text-sm transition shadow-sm disabled:opacity-60"
            >
              {loading
                ? mode === "register"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "register"
                ? "Create account"
                : "Sign in securely"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }}
              className="w-full rounded-lg border-2 border-teal-700 text-teal-700 font-semibold py-2.5 sm:py-3 text-sm hover:bg-teal-50 transition"
            >
              {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              MFA protected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5">
              <Lock className="h-3.5 w-3.5" />
              Encrypted health data
            </span>
          </div>

          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            AI tools do not replace a doctor. Emergency symptoms should be
            handled through local emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, iconBg, title, subtitle, cardBg }) {
  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 rounded-xl px-4 sm:px-5 py-3 sm:py-4 ${cardBg} backdrop-blur-sm`}
    >
      <div
        className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full ${iconBg} flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white text-sm sm:text-base">{title}</p>
        <p className="text-xs sm:text-sm text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
}