import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
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
  Send,
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

// Mock document knowledge base used to simulate evidence-grounded answers.
// Each fact has keywords used for simple matching, plus the text and source page.
const documents = [
  {
    id: "cbc",
    label: "CBC + Glucose - 08 Jul",
    facts: [
      {
        keywords: ["glucose", "fasting", "sugar", "high"],
        text: "The fasting glucose value was 132 mg/dL, marked high against a reference range of 70-99 mg/dL.",
        page: 1,
      },
      {
        keywords: ["hemoglobin", "hb"],
        text: "Hemoglobin was 13.8 g/dL, within the reference range of 12.0-15.5 g/dL.",
        page: 2,
      },
      {
        keywords: ["wbc", "white", "blood cell"],
        text: "WBC count was 7.2 ×10⁹/L, within the reference range of 4.0-11.0 ×10⁹/L.",
        page: 2,
      },
      {
        keywords: ["platelet"],
        text: "Platelets were 268 ×10⁹/L, within the reference range of 150-450 ×10⁹/L.",
        page: 3,
      },
      {
        keywords: ["abnormal", "flag", "high value"],
        text: "Only the fasting glucose result was flagged as abnormal (high); all other CBC values were within range.",
        page: 1,
      },
    ],
  },
  {
    id: "xray",
    label: "Chest X-ray - 12 Jul",
    facts: [
      {
        keywords: ["x-ray", "xray", "chest", "imaging", "lung"],
        text: "No acute abnormality was detected on initial AI screening. The image has been flagged for radiologist confirmation.",
        page: 1,
      },
      {
        keywords: ["explain", "simply", "simple"],
        text: "In simple terms: the chest X-ray looked normal to the automated screening, but a doctor still needs to confirm it.",
        page: 1,
      },
    ],
  },
  {
    id: "prescription",
    label: "Prescription - 10 Jul",
    facts: [
      {
        keywords: ["prescription", "medicine", "medication", "azithromycin", "drug"],
        text: "Azithromycin 500 mg was prescribed, once daily for 3 days. Interaction check passed.",
        page: 1,
      },
    ],
  },
  {
    id: "consultation",
    label: "Consultation note - 04 Jul",
    facts: [
      {
        keywords: ["consultation", "visit", "symptom", "follow-up", "follow up"],
        text: "Sore throat and fever were reported. A follow-up was advised in 7 days.",
        page: 1,
      },
    ],
  },
];

const suggestedQuestions = [
  "What was my glucose value?",
  "Which results were abnormal?",
  "Has anything changed since June?",
  "Explain the X-ray finding simply.",
];

const initialMessages = [
  {
    role: "user",
    text: "What was my glucose level in the July report?",
  },
  {
    role: "ai",
    text: "The fasting glucose value was 132 mg/dL, marked high against a reference range of 70-99 mg/dL.",
    source: "Source: Report p.1",
  },
  {
    role: "user",
    text: "Was it also high in June?",
  },
  {
    role: "ai",
    text: "I cannot confirm that from the selected documents. The June CBC report does not include a glucose result.",
    source: "Source: Report p.1",
  },
];

const initialWhyThisAnswer =
  "Retrieved 2 chunks from the July laboratory report. No matching glucose result was found in the June document.";

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

// Very small rule-based "retrieval" simulation — not a real AI/RAG backend.
// It scores each fact in the selected documents against the question's words.
function generateAnswer(question, selectedDocIds) {
  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  if (selectedDocs.length === 0) {
    return {
      text: "Please select at least one document from Document scope so I know what to search.",
      source: null,
      why: "No documents were selected, so nothing could be retrieved.",
    };
  }

  const qWords = question
    .toLowerCase()
    .replace(/[?.,!]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let bestFact = null;
  let bestDoc = null;
  let bestScore = 0;

  selectedDocs.forEach((doc) => {
    doc.facts.forEach((fact) => {
      const score = fact.keywords.filter((k) =>
        qWords.some((w) => w.includes(k) || k.includes(w))
      ).length;
      if (score > bestScore) {
        bestScore = score;
        bestFact = fact;
        bestDoc = doc;
      }
    });
  });

  if (bestFact) {
    return {
      text: bestFact.text,
      source: `Source: ${bestDoc.label} p.${bestFact.page}`,
      why: `Retrieved a matching chunk from "${bestDoc.label}" (page ${bestFact.page}) based on the terms in your question.`,
    };
  }

  return {
    text: "I cannot confirm that from the selected documents.",
    source: null,
    why: `Searched ${selectedDocs.length} selected document${
      selectedDocs.length > 1 ? "s" : ""
    } but found no matching information for this question. Try selecting a different document or rephrasing.`,
  };
}

export default function ReportChat() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState(["cbc"]);
  const [messages, setMessages] = useState([]);
  const [whyThisAnswer, setWhyThisAnswer] = useState(
    "Ask a question below to see which part of your report the answer comes from."
  );
  const [draft, setDraft] = useState("");
  const [reportId, setReportId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedId = sessionStorage.getItem("medinexus_last_report_id");
    if (storedId) setReportId(storedId);
    else setError("No recently uploaded report found. Please upload a report first.");
  }, []);

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const sendQuestion = async (question) => {
    const text = question.trim();
    if (!text || sending || !reportId) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const { data } = await api.post(`/api/reports/${reportId}/chat`, {
        message: text,
        session_id: sessionId,
      });
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      setWhyThisAnswer("Answer generated only from the text of your uploaded report.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't get an answer. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => sendQuestion(draft);

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
              Chat with My Reports
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
          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 sm:gap-6 items-start">
            {/* DOCUMENT SCOPE + SUGGESTED QUESTIONS */}
            <div className="space-y-5 sm:space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Document scope
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Select records available to the chat
                </p>

                <div className="mt-4 space-y-2.5">
                  {documents.map((doc) => {
                    const checked = selectedDocIds.includes(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => toggleDoc(doc.id)}
                        className={`w-full flex items-center gap-3 rounded-lg border-2 px-3.5 py-3 text-left transition ${
                          checked
                            ? "border-teal-600 bg-teal-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`h-5 w-5 shrink-0 rounded flex items-center justify-center border-2 ${
                            checked
                              ? "bg-teal-600 border-teal-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {checked && (
                            <svg
                              viewBox="0 0 16 16"
                              className="h-3 w-3 text-white"
                              fill="none"
                            >
                              <path
                                d="M3 8.5L6.5 12L13 4.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {doc.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Suggested questions
                </h2>
                <div className="mt-4 space-y-2.5">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuestion(q)}
                      className="w-full text-left rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-teal-300 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CONVERSATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Evidence-grounded conversation
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Answers are limited to selected records
              </p>

              <div className="mt-5 space-y-4 sm:space-y-5 max-h-[55vh] xl:max-h-[50vh] overflow-y-auto pr-1">
                {messages.map((msg, idx) =>
                  msg.role === "ai" ? (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3">
                      <span className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-teal-700" />
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3">
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {msg.text}
                        </p>
                        {msg.source && (
                          <span className="inline-block mt-2 rounded-full bg-white text-teal-800 text-xs font-bold px-2.5 py-1">
                            {msg.source}
                          </span>
                        )}
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
              </div>

              {/* WHY THIS ANSWER */}
              <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="font-bold text-violet-700 text-sm">
                  Why this answer?
                </p>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                  {whyThisAnswer}
                </p>
              </div>

              {/* INPUT */}
              {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about selected records..."
                  disabled={sending || !reportId}
                  className="flex-1 min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition disabled:bg-slate-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reportId}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 sm:px-6 py-3 text-sm transition disabled:opacity-60"
                >
                  <Send className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">{sending ? "..." : "Send"}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}