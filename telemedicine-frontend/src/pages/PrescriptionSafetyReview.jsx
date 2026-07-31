import { useMemo, useState } from "react";
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
  Plus,
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

const patient = {
  name: "Ayesha Khan",
  consultDate: "12 Jul 2026",
  allergies: ["Penicillin"],
};

// Very small mock rule set used only to demonstrate the interaction pattern.
// This is NOT real clinical decision support and must not be used for actual
// prescribing without a genuine drug-interaction / allergy-checking backend.
const PENICILLIN_FAMILY = ["amoxicillin", "ampicillin", "penicillin", "co-amoxiclav"];
const QT_RISK_DRUGS = ["azithromycin", "erythromycin", "clarithromycin", "ciprofloxacin"];

function runSafetyChecks(medicines, allergies) {
  const names = medicines.map((m) => m.name.trim().toLowerCase()).filter(Boolean);

  const allergyHit = names.some((n) =>
    allergies.some((a) => PENICILLIN_FAMILY.some((p) => n.includes(p) && a.toLowerCase() === "penicillin"))
  );

  const qtDrug = names.find((n) => QT_RISK_DRUGS.some((d) => n.includes(d)));

  const seen = new Set();
  let duplicate = false;
  names.forEach((n) => {
    if (n && seen.has(n)) duplicate = true;
    seen.add(n);
  });

  const checks = [
    {
      key: "allergy",
      level: allergyHit ? "High" : "Passed",
      title: "Allergy conflict",
      description: allergyHit
        ? `Penicillin allergy recorded, and a penicillin-family medicine is on this prescription. Remove or confirm with the patient before signing.`
        : `Penicillin allergy recorded. Current medicines are not penicillins, but verify allergy history before signing.`,
    },
    {
      key: "qt",
      level: qtDrug ? "Moderate" : "Passed",
      title: "QT prolongation risk",
      description: qtDrug
        ? `${qtDrug.charAt(0).toUpperCase() + qtDrug.slice(1)} may increase QT risk. No ECG data found; consider history and interacting medicines.`
        : `No QT-prolonging medicines detected in the current list.`,
    },
    {
      key: "duplicate",
      level: duplicate ? "Moderate" : "Passed",
      title: "Duplicate therapy",
      description: duplicate
        ? "The same medicine appears more than once in this prescription."
        : "No duplicate active ingredient detected.",
    },
    {
      key: "dose",
      level: "Passed",
      title: "Dose range",
      description: "Doses are within configured adult reference ranges.",
    },
  ];

  return checks;
}

const levelStyles = {
  High: {
    border: "border-red-300",
    bg: "bg-red-50",
    badgeBg: "bg-red-600",
  },
  Moderate: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    badgeBg: "bg-amber-500",
  },
  Passed: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    badgeBg: "bg-emerald-600",
  },
};

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

export default function PrescriptionSafetyReview() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [medicines, setMedicines] = useState([
    { id: 1, name: "Azithromycin", dose: "500 mg", frequency: "Once daily", duration: "3 days" },
    { id: 2, name: "Cetirizine", dose: "10 mg", frequency: "At night", duration: "5 days" },
    { id: 3, name: "Paracetamol", dose: "500 mg", frequency: "Every 8h PRN", duration: "3 days" },
  ]);
  const [instructions, setInstructions] = useState(
    "Take after food. Maintain hydration. Return if symptoms worsen."
  );
  const [signModal, setSignModal] = useState(null); // "draft" | "signed" | null

  const checks = useMemo(
    () => runSafetyChecks(medicines, patient.allergies),
    [medicines]
  );
  const warningCount = checks.filter((c) => c.level !== "Passed").length;

  const [aiReview, setAiReview] = useState(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiError, setAiError] = useState("");

  const runAiSafetyCheck = async () => {
    setAiChecking(true);
    setAiError("");
    try {
      const medsText = medicines
        .map((m) => `${m.name} ${m.dose}, ${m.frequency}, for ${m.duration}`)
        .join("\n");
      const { data } = await api.post("/api/ai/prescription-safety", {
        medications: medsText,
        patient_context: `Allergies: ${patient.allergies?.join(", ") || "none recorded"}`,
      });
      setAiReview(data);
    } catch (err) {
      setAiError(err?.response?.data?.detail || "AI safety check failed. Please try again.");
    } finally {
      setAiChecking(false);
    }
  };

  const updateMedicine = (id, field, value) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMedicine = (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        dose: "",
        frequency: "",
        duration: "",
      },
    ]);
  };

  const inputClass =
    "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition";

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
              Prescription Safety Review
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
          {/* DRAFT PRESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Draft prescription
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Patient: {patient.name} • Consultation: {patient.consultDate} •
                Allergies: {patient.allergies.join(", ")}
              </p>
            </div>
            {warningCount > 0 ? (
              <span className="shrink-0 w-fit rounded-full bg-red-50 text-red-700 text-xs sm:text-sm font-bold px-3.5 py-1.5">
                {warningCount} warning{warningCount > 1 ? "s" : ""} require review
              </span>
            ) : (
              <span className="shrink-0 w-fit rounded-full bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-bold px-3.5 py-1.5">
                All checks passed
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* PRESCRIPTION EDITOR */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Prescription editor
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Doctor remains the final decision-maker
              </p>

              {/* Column headers, desktop only */}
              <div className="hidden sm:grid grid-cols-[1.3fr_0.9fr_1.1fr_0.9fr_28px] gap-3 mt-5 mb-2 px-1">
                <p className="text-xs font-bold text-slate-500">Medicine</p>
                <p className="text-xs font-bold text-slate-500">Dose</p>
                <p className="text-xs font-bold text-slate-500">Frequency</p>
                <p className="text-xs font-bold text-slate-500">Duration</p>
                <span />
              </div>

              <div className="space-y-3 sm:mt-0 mt-4">
                {medicines.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 p-3 sm:p-2.5 sm:border-0 sm:rounded-none sm:border-b sm:pb-3"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-[1.3fr_0.9fr_1.1fr_0.9fr_28px] gap-2.5 sm:gap-3 sm:items-center">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[11px] font-semibold text-slate-400 sm:hidden">
                          Medicine
                        </label>
                        <input
                          value={m.name}
                          onChange={(e) => updateMedicine(m.id, "name", e.target.value)}
                          placeholder="Medicine name"
                          className={`${inputClass} font-semibold`}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 sm:hidden">
                          Dose
                        </label>
                        <input
                          value={m.dose}
                          onChange={(e) => updateMedicine(m.id, "dose", e.target.value)}
                          placeholder="Dose"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 sm:hidden">
                          Frequency
                        </label>
                        <input
                          value={m.frequency}
                          onChange={(e) => updateMedicine(m.id, "frequency", e.target.value)}
                          placeholder="Frequency"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <label className="text-[11px] font-semibold text-slate-400 sm:hidden">
                            Duration
                          </label>
                          <input
                            value={m.duration}
                            onChange={(e) => updateMedicine(m.id, "duration", e.target.value)}
                            placeholder="Duration"
                            className={inputClass}
                          />
                        </div>
                        <button
                          onClick={() => removeMedicine(m.id)}
                          className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                          aria-label={`Remove ${m.name || "medicine"}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addMedicine}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-teal-700 text-teal-700 font-semibold px-4 py-2.5 text-sm hover:bg-teal-50 transition"
              >
                <Plus className="h-4 w-4" />
                Add medicine
              </button>

              <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-7 mb-2">
                Clinical instructions
              </h3>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
              />
            </div>

            {/* AI SAFETY CHECKS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI safety checks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Rules + patient-specific context
              </p>

              <div className="mt-4 space-y-3.5">
                {checks.map((c) => {
                  const style = levelStyles[c.level];
                  return (
                    <div
                      key={c.key}
                      className={`rounded-xl border-2 ${style.border} ${style.bg} p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`shrink-0 rounded-full ${style.badgeBg} text-white text-[10px] font-bold px-2.5 py-1 mt-0.5`}
                        >
                          {c.level}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm sm:text-base">
                            {c.title}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                            {c.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* REAL AI (GROQ) REVIEW */}
              <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-teal-800 text-sm">AI-generated review (Groq)</p>
                  <button
                    onClick={runAiSafetyCheck}
                    disabled={aiChecking}
                    className="shrink-0 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 transition disabled:opacity-60"
                  >
                    {aiChecking ? "Checking..." : "Run AI check"}
                  </button>
                </div>
                {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}
                {aiReview && (
                  <div className="mt-2">
                    <span
                      className={`inline-block rounded-full text-[10px] font-bold px-2.5 py-1 mb-2 ${
                        aiReview.risk_level === "danger"
                          ? "bg-red-600 text-white"
                          : aiReview.risk_level === "caution"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {aiReview.risk_level?.toUpperCase()}
                    </span>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {aiReview.safety_review}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSignModal("draft")}
                  className="w-full sm:flex-1 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold px-5 py-2.5 sm:py-3 text-sm hover:bg-slate-50 transition"
                >
                  Save draft
                </button>
                <button
                  onClick={() => setSignModal("signed")}
                  className="w-full sm:flex-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 sm:py-3 text-sm transition"
                >
                  Resolve &amp; sign
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* SAVE / SIGN MODAL */}
      {signModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSignModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-2xl bg-white p-5 sm:p-6 text-center shadow-xl">
            {signModal === "signed" && warningCount > 0 ? (
              <>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  Unresolved warnings
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  There {warningCount > 1 ? "are" : "is"} still {warningCount}{" "}
                  safety warning{warningCount > 1 ? "s" : ""} on this
                  prescription. Please review the flagged items before signing.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  {signModal === "draft"
                    ? "Draft saved"
                    : "Prescription signed"}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  {signModal === "draft"
                    ? "This draft has been saved and can be resumed later."
                    : `Prescription for ${patient.name} has been signed and finalized.`}
                </p>
              </>
            )}
            <button
              onClick={() => setSignModal(null)}
              className="mt-4 w-full rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-sm transition"
            >
              {signModal === "signed" && warningCount > 0 ? "Review warnings" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}