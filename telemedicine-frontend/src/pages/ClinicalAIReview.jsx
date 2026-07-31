import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Users,
  Stethoscope,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Check,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/doctor-dashboard" },
  { icon: Clock, label: "Schedule" },
  { icon: Users, label: "Patients", route: "/patient-clinical-workspace" },
  { icon: Stethoscope, label: "Consultations" },
  { icon: ShieldCheck, label: "Clinical AI", active: true, route: "/clinical-ai-review" },
  { icon: MessageSquare, label: "Messages", route: "/messages" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

const taskInfo = {
  patient: "Ayesha Khan",
  created: "12 Jul 2026 08:42",
  model: "llama-med-v1",
  policy: "triage-v3",
};

const evidence = [
  { tag: "Patient answer", text: "Temperature 38.4°C" },
  { tag: "Patient answer", text: "Able to drink water" },
  { tag: "Safety screen", text: "No severe breathing difficulty" },
  { tag: "EHR", text: "Penicillin allergy recorded" },
  { tag: "Report", text: "Glucose 132 mg/dL - not directly relevant" },
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

export default function ClinicalAIReview() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [urgency, setUrgency] = useState("Doctor within 24 hours");
  const [summary, setSummary] = useState(
    "Fever, sore throat and body aches for two days. No chest pain, breathing difficulty, rash or inability to drink."
  );
  const [categories, setCategories] = useState([
    "Viral upper respiratory infection",
    "Pharyngitis",
    "Influenza-like illness",
  ]);
  const [limitations, setLimitations] = useState(
    "No physical examination, throat visualization, oxygen saturation or laboratory confirmation."
  );

  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  const [reviewNote, setReviewNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [decision, setDecision] = useState(null); // { action, note, time }

  const [rawNote, setRawNote] = useState("");
  const [aiReviewText, setAiReviewText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const runClinicalAiReview = async () => {
    if (!rawNote.trim()) {
      setAiError("Paste or type the patient's clinical note first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      // patient_id 0 is a placeholder until this page is linked to a real patient record
      const { data } = await api.post("/api/ai/clinical-review", {
        patient_id: 0,
        note_text: rawNote,
      });
      setAiReviewText(data.ai_review);
    } catch (err) {
      setAiError(err?.response?.data?.detail || "AI review failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const startEdit = () => {
    setEditDraft({
      urgency,
      summary,
      categoriesText: categories.join(", "),
      limitations,
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditDraft(null);
  };

  const saveEdit = () => {
    setUrgency(editDraft.urgency);
    setSummary(editDraft.summary);
    setCategories(
      editDraft.categoriesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    );
    setLimitations(editDraft.limitations);
    setEditMode(false);
    setDecision({
      action: "Edited & approved",
      note: reviewNote,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const handleApprove = () => {
    setDecision({
      action: "Approved",
      note: reviewNote,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const handleReject = () => {
    if (!reviewNote.trim()) {
      setNoteError("A reason is required to reject an AI recommendation.");
      return;
    }
    setNoteError("");
    setDecision({
      action: "Rejected",
      note: reviewNote,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const resetDecision = () => {
    setDecision(null);
    setReviewNote("");
    setNoteError("");
  };

  const decisionStyles = {
    Approved: "bg-emerald-50 border-emerald-300 text-emerald-800",
    Rejected: "bg-red-50 border-red-300 text-red-800",
    "Edited & approved": "bg-blue-50 border-blue-300 text-blue-800",
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

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
              Clinical AI Review
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-slate-100 pl-3 pr-4 py-2 shrink-0">
            <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
              DA
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                Doctor Account
              </p>
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                Verified
              </p>
            </div>
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 rounded-full bg-teal-500 items-center justify-center text-white text-xs font-bold">
            DA
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* REVIEW TASK HEADER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Review task: Symptom assessment
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Patient: {taskInfo.patient} • Created {taskInfo.created} •
                Model: {taskInfo.model} • Policy: {taskInfo.policy}
              </p>
            </div>
            <span className="shrink-0 w-fit rounded-full bg-violet-50 text-violet-700 text-xs sm:text-sm font-bold px-3.5 py-1.5">
              Human approval required
            </span>
          </div>

          {/* REAL AI (GROQ) CLINICAL REVIEW TOOL */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-teal-900">
              Run a live AI review (Groq)
            </h2>
            <p className="text-xs sm:text-sm text-teal-700 mt-0.5">
              Paste a clinical note below to get a real AI-generated review
            </p>
            <textarea
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              rows={3}
              placeholder="e.g. 34F, 2 days fever + sore throat, no red flags, mild dehydration risk..."
              className="mt-3 w-full rounded-lg border border-teal-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
            <button
              onClick={runClinicalAiReview}
              disabled={aiLoading}
              className="mt-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-sm transition disabled:opacity-60"
            >
              {aiLoading ? "Reviewing..." : "Run AI review"}
            </button>
            {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}
            {aiReviewText && (
              <p className="mt-3 text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-white rounded-lg border border-teal-100 p-3">
                {aiReviewText}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* AI OUTPUT */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI output
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Structured recommendation
              </p>

              {!editMode ? (
                <>
                  <h3 className="font-bold text-slate-500 text-sm mt-5 mb-2">
                    Urgency
                  </h3>
                  <span className="inline-block rounded-full bg-amber-50 text-amber-700 text-sm font-bold px-3.5 py-1.5">
                    {urgency}
                  </span>

                  <h3 className="font-bold text-slate-500 text-sm mt-6 mb-2">
                    Summary
                  </h3>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {summary}
                  </p>

                  <h3 className="font-bold text-slate-500 text-sm mt-6 mb-2">
                    Possible categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold px-3 py-1.5"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-slate-500 text-sm mt-6 mb-2">
                    Limitations
                  </h3>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {limitations}
                  </p>
                </>
              ) : (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Urgency
                    </label>
                    <select
                      value={editDraft.urgency}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, urgency: e.target.value }))
                      }
                      className={fieldClass}
                    >
                      <option>Routine</option>
                      <option>Doctor within 24 hours</option>
                      <option>Urgent - same day</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Summary
                    </label>
                    <textarea
                      value={editDraft.summary}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, summary: e.target.value }))
                      }
                      rows={3}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Possible categories (comma separated)
                    </label>
                    <input
                      value={editDraft.categoriesText}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          categoriesText: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Limitations
                    </label>
                    <textarea
                      value={editDraft.limitations}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, limitations: e.target.value }))
                      }
                      rows={2}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EVIDENCE & REASONING */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Evidence &amp; reasoning
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Review source trace before approval
              </p>

              <div className="mt-5 space-y-4">
                {evidence.map((e, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"
                  >
                    <span className="shrink-0 w-fit sm:w-40 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5">
                      {e.tag}
                    </span>
                    <span className="text-sm text-slate-700">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DECISION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Decision
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Your action is logged with reason
            </p>

            {decision && (
              <div
                className={`mt-4 rounded-xl border-2 p-4 flex items-start gap-3 ${decisionStyles[decision.action]}`}
              >
                <Check className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-sm">
                    {decision.action} at {decision.time}
                  </p>
                  {decision.note && (
                    <p className="text-sm mt-1">Note: {decision.note}</p>
                  )}
                  <button
                    onClick={resetDecision}
                    className="mt-2 text-xs font-semibold underline underline-offset-2"
                  >
                    Change decision
                  </button>
                </div>
              </div>
            )}

            {!decision && !editMode && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 sm:py-3 text-sm transition"
                >
                  Approve
                </button>
                <button
                  onClick={startEdit}
                  className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 sm:py-3 text-sm transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 sm:py-3 text-sm transition"
                >
                  Reject
                </button>
              </div>
            )}

            {!decision && editMode && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelEdit}
                  className="flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-bold py-2.5 sm:py-3 text-sm hover:bg-slate-50 transition"
                >
                  Cancel edit
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 text-sm transition"
                >
                  Save edited version
                </button>
              </div>
            )}

            {!decision && (
              <div className="mt-4">
                <textarea
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value);
                    if (e.target.value.trim()) setNoteError("");
                  }}
                  rows={2}
                  placeholder="Optional review note..."
                  className={`${fieldClass} resize-none ${
                    noteError ? "border-red-400" : ""
                  }`}
                />
                {noteError && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    {noteError}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}