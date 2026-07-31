import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bot,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  Check,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: CalendarDays, label: "Appointments", route: "/find-doctor" },
  { icon: FileText, label: "Health Records", route: "/health-records" },
  { icon: Bot, label: "AI Assistant", active: true, route: "/symptom-checker" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const initialMessages = [
  {
    role: "ai",
    text: "I can help organize your symptoms and estimate urgency. This is not a diagnosis. Are you having chest pain, severe breathing difficulty, fainting, or heavy bleeding?",
  },
  {
    role: "user",
    text: "No. I have had fever, sore throat and body aches for two days.",
  },
  {
    role: "ai",
    text: "Thank you. What is your highest measured temperature, and do you have trouble swallowing or a rash?",
  },
  {
    role: "user",
    text: "38.4°C. Swallowing hurts but I can drink water. No rash.",
  },
];

const safetyChecks = [
  "Chest pain",
  "Severe breathing difficulty",
  "Loss of consciousness",
  "Stroke-like symptoms",
  "Heavy bleeding",
];

function SidebarContent() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-teal-500 flex items-center justify-center font-bold shadow-lg shadow-teal-500/20">
          M+
        </div>
        <div>
          <p className="font-bold leading-tight">MediNexus</p>
          <p className="text-xs text-slate-400 leading-tight">
            AI Telemedicine
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ icon: Icon, label, active, route }) => (
          <button
            key={label}
            onClick={() => route && navigate(route)}
            disabled={!route}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/10 text-white"
                : route
                ? "text-slate-400 hover:text-white hover:bg-white/5"
                : "text-slate-600 cursor-not-allowed"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-teal-400" : "bg-slate-600"
              }`}
            />
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function SymptomCheckerChat() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/api/ai/symptom-checker", {
        message: text,
        session_id: sessionId,
      });
      setSessionId(data.session_id);
      // stash the conversation so far, so TriageSummary can use it
      sessionStorage.setItem(
        "medinexus_symptom_summary",
        [...messages, { role: "user", text }]
          .map((m) => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.text}`)
          .join("\n")
      );
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't reach the AI assistant. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full flex bg-slate-50 font-sans overflow-x-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col bg-[#0b1220] text-white px-4 py-6">
        <SidebarContent />
      </aside>

      {/* MOBILE / TABLET DRAWER SIDEBAR */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-[#0b1220] text-white px-4 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wide text-slate-400 px-2">
                Menu
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        {/* TOP BAR */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-900 truncate">
              AI Symptom Checker
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              PA
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Patient Account
              </p>
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                Verified
              </p>
            </div>
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            PA
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 sm:gap-6 items-start">
            {/* CONVERSATION */}
            <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-[70vh] sm:h-[75vh] xl:h-[calc(100vh-11rem)]">
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Conversation
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Describe what you are experiencing
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
                {messages.map((msg, idx) =>
                  msg.role === "ai" ? (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3">
                      <span className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-teal-700" />
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm text-slate-800 leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className="flex items-start justify-end gap-2.5 sm:gap-3"
                    >
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-50 px-4 py-3 text-sm text-slate-800 leading-relaxed">
                        {msg.text}
                      </div>
                      <span className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-blue-600" />
                    </div>
                  )
                )}
                {sending && (
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-teal-700" />
                    <div className="rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm text-slate-500 italic flex items-center gap-2">
                      <InlineLoader /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-slate-100 shrink-0">
                {error && (
                  <p className="text-xs text-red-600 mb-2">{error}</p>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    disabled={sending}
                    className="flex-1 min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-slate-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="shrink-0 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 sm:px-6 py-3 text-sm transition disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5 sm:space-y-6">
              {/* LIVE TRIAGE SUMMARY */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Triage summary
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {messages.length === 0
                    ? "Describe your symptoms in the chat first"
                    : 'Click "Get triage summary" below for a real AI-generated urgency assessment based on this conversation'}
                </p>
              </div>

              {/* SAFETY CHECKS */}
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Safety checks
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  The system pauses for emergency symptoms
                </p>
                <ul className="mt-3 sm:mt-4 space-y-2.5">
                  {safetyChecks.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-800"
                    >
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* NEXT STEP */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Next step
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  A summary will be generated before booking
                </p>
                <button
                  onClick={() => navigate("/triage-summary")}
                  className="mt-4 sm:mt-5 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 sm:py-3 text-sm transition"
                >
                  Generate triage summary
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}